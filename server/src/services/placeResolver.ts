import {
    createStablePlaceId,
    normalizePlaceQuery,
    readPlaceCache,
    type PlaceCacheRecord,
    type PlaceCacheStore,
    upsertCacheRecordInStore,
    writePlaceCache,
} from '../db/place-cache';

export interface PlaceResolveInput {
    placeQuery: string;
    area?: string;
    hintLat?: number;
    hintLng?: number;
}

export interface PlaceResolveResult {
    placeId: string;
    placeQuery: string;
    name: string;
    lat: number;
    lng: number;
    providerId?: string;
    images: string[];
    highlights: string[];
    source: 'cache' | 'api' | 'candidate' | 'unresolved';
}

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const UNRESOLVED_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const GEOCODE_TIMEOUT_MS = 1800;
const NOMINATIM_MAX_QUERY_VARIANTS = 3;

interface GooglePlaceDetails {
    result?: {
        place_id?: string;
        name?: string;
        photos?: Array<{
            photo_reference?: string;
        }>;
        editorial_summary?: {
            overview?: string;
        };
        reviews?: Array<{
            text?: string;
            rating?: number;
        }>;
    };
    status?: string;
}

function buildFallbackMedia(placeQuery: string, area?: string): {
    images: string[];
    highlights: string[];
} {
    const encoded = encodeURIComponent(placeQuery);
    const images = [
        `https://source.unsplash.com/800x600/?${encoded}`,
        `https://source.unsplash.com/800x600/?travel,${encoded}`,
        `https://source.unsplash.com/800x600/?landmark,${encoded}`,
    ];

    const highlights = [
        `Popular stop for ${placeQuery}.`,
        area ? `Located around ${area}.` : 'Area inferred from itinerary context.',
        'Best checked on map before departure.',
    ];

    return { images, highlights };
}

function buildGoogleStreetViewImageUrls(
    lat: number,
    lng: number
): string[] {
    const headings = [0, 90, 180];
    return headings.map(
        (heading) =>
            `/api/places/streetview?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(
                String(lng)
            )}&heading=${heading}&size=800x500`
    );
}

async function fetchGooglePlaceDetails(
    placeId: string
): Promise<{ images: string[]; highlights: string[] } | null> {
    if (!GOOGLE_MAPS_API_KEY) return null;

    const fields = [
        'name',
        'place_id',
        'photos',
        'editorial_summary',
        'reviews',
    ].join(',');
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        placeId
    )}&fields=${encodeURIComponent(fields)}&reviews_no_translations=true&key=${GOOGLE_MAPS_API_KEY}`;

    const payload = await fetchJsonWithTimeout<GooglePlaceDetails>(url, 4500).catch(() => null);
    if (!payload || payload.status !== 'OK' || !payload.result) return null;

    const photoRefs = (payload.result.photos ?? [])
        .map((photo) => photo.photo_reference)
        .filter((ref): ref is string => !!ref)
        .slice(0, 6);

    const images = photoRefs.map(
        (photoRef) =>
            `/api/places/photo?photoRef=${encodeURIComponent(photoRef)}&maxwidth=1200`
    );

    const highlights: string[] = [];
    if (payload.result.editorial_summary?.overview) {
        highlights.push(payload.result.editorial_summary.overview);
    }
    (payload.result.reviews ?? [])
        .slice(0, 5)
        .forEach((review) => {
            if (!review.text) return;
            const ratingText = typeof review.rating === 'number' ? `(${review.rating}/5)` : '';
            highlights.push(`${ratingText} ${review.text}`.trim());
        });

    return {
        images,
        highlights,
    };
}

async function fetchGooglePlacePhotosByTextQuery(
    input: PlaceResolveInput
): Promise<{ images: string[]; highlights: string[]; providerId?: string } | null> {
    if (!GOOGLE_MAPS_API_KEY) return null;

    const textQuery = [input.placeQuery, input.area].filter(Boolean).join(', ');
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        textQuery
    )}&inputtype=textquery&fields=place_id,name,photos,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;

    const payload = await fetchJsonWithTimeout<{
        candidates?: Array<{
            place_id?: string;
            name?: string;
            formatted_address?: string;
            photos?: Array<{ photo_reference?: string }>;
        }>;
        status?: string;
    }>(url, GEOCODE_TIMEOUT_MS).catch(() => null);

    if (!payload || payload.status !== 'OK') return null;
    const candidate = payload.candidates?.[0];
    if (!candidate) return null;

    const photoRefs = (candidate.photos ?? [])
        .map((photo) => photo.photo_reference)
        .filter((ref): ref is string => !!ref)
        .slice(0, 6);
    if (photoRefs.length === 0) return null;

    return {
        images: photoRefs.map(
            (photoRef) =>
                `/api/places/photo?photoRef=${encodeURIComponent(photoRef)}&maxwidth=1200`
        ),
        highlights: [
            `Photos resolved from Google Places for ${input.placeQuery}.`,
        ],
        providerId: candidate.place_id,
    };
}

async function fetchJsonWithTimeout<T>(
    url: string,
    timeoutMs: number,
    init?: RequestInit
): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...init,
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }
        return (await response.json()) as T;
    } finally {
        clearTimeout(timeout);
    }
}

async function resolveWithGoogle(input: PlaceResolveInput): Promise<Omit<PlaceResolveResult, 'source'>> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('GOOGLE_MAPS_API_KEY is missing');
    }

    const query = [input.placeQuery, input.area].filter(Boolean).join(', ');
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;

    const payload = await fetchJsonWithTimeout<{
        results?: Array<{
            place_id?: string;
            formatted_address?: string;
            name?: string;
            geometry?: {
                location?: { lat?: number; lng?: number };
            };
        }>;
        status?: string;
    }>(url, GEOCODE_TIMEOUT_MS).catch((error) => {
        const reason = error instanceof Error ? error.message : 'unknown';
        throw new Error(`Google geocoding failed (${reason})`);
    });

    const result = payload.results?.[0];
    const lat = result?.geometry?.location?.lat;
    const lng = result?.geometry?.location?.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(
            `No valid geocode result for "${input.placeQuery}" (status: ${payload.status ?? 'unknown'})`
        );
    }

    const fallbackMedia = buildFallbackMedia(input.placeQuery, input.area);
    const detailsMedia = result?.place_id
        ? await fetchGooglePlaceDetails(result.place_id).catch(() => null)
        : null;
    const findPlaceMedia = detailsMedia?.images?.length
        ? null
        : await fetchGooglePlacePhotosByTextQuery(input).catch(() => null);
    const streetViewImages = buildGoogleStreetViewImageUrls(Number(lat), Number(lng));

    const images =
        detailsMedia?.images?.length
            ? detailsMedia.images
            : findPlaceMedia?.images?.length
              ? findPlaceMedia.images
              : streetViewImages;
    const highlights = detailsMedia?.highlights?.length
        ? detailsMedia.highlights
        : findPlaceMedia?.highlights?.length
          ? findPlaceMedia.highlights
          : [
                ...fallbackMedia.highlights,
                'Using Google Street View images as fallback.',
            ];

    return {
        placeId: createStablePlaceId(input.placeQuery),
        placeQuery: input.placeQuery,
        name: result?.formatted_address || result?.name || input.placeQuery,
        lat: Number(lat),
        lng: Number(lng),
        providerId: result?.place_id || findPlaceMedia?.providerId,
        images,
        highlights,
    };
}

async function resolveWithNominatim(
    input: PlaceResolveInput
): Promise<Omit<PlaceResolveResult, 'source'>> {
    const stripped = input.placeQuery
        .replace(/\b(shrine|temple|museum|station|park)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    const candidateQueries = Array.from(
        new Set(
            [
                [input.placeQuery, input.area].filter(Boolean).join(', '),
                input.placeQuery,
                `${input.placeQuery}, Japan`,
                input.placeQuery.replace(/,/g, ' '),
                input.placeQuery.split(',').join(' ').replace(/\s+/g, ' ').trim(),
                `${input.placeQuery.split(',').reverse().join(' ').replace(/\s+/g, ' ').trim()}, Japan`,
                stripped ? [stripped, input.area].filter(Boolean).join(', ') : '',
                stripped ? `${stripped}, Japan` : '',
            ].filter(Boolean)
        )
    ).slice(0, NOMINATIM_MAX_QUERY_VARIANTS);

    for (const query of candidateQueries) {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(
            query
        )}`;

        const payload = await fetchJsonWithTimeout<Array<{
            lat?: string;
            lon?: string;
            display_name?: string;
            osm_id?: number;
        }>>(
            url,
            GEOCODE_TIMEOUT_MS,
            {
                headers: {
                    // Nominatim usage policy asks for an identifying User-Agent.
                    'User-Agent': 'TravelAI/1.0 (local-development)',
                    Accept: 'application/json',
                },
            }
        ).catch(() => null);
        if (!payload) continue;

        const top = payload[0];
        const lat = Number(top?.lat);
        const lng = Number(top?.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            continue;
        }

        const streetViewImages = buildGoogleStreetViewImageUrls(lat, lng);
        const media = buildFallbackMedia(input.placeQuery, input.area);
        return {
            placeId: createStablePlaceId(input.placeQuery),
            placeQuery: input.placeQuery,
            name: top?.display_name || input.placeQuery,
            lat,
            lng,
            providerId: top?.osm_id ? `osm:${top.osm_id}` : undefined,
            images: streetViewImages,
            highlights: [
                ...media.highlights.slice(0, 1),
                'Showing Google Street View imagery for this location.',
                'Resolved using OpenStreetMap fallback geocoder.',
            ],
        };
    }

    throw new Error(`No valid Nominatim geocode result for "${input.placeQuery}"`);
}

function recordToResult(record: PlaceCacheRecord, placeQuery: string): PlaceResolveResult {
    const unresolved = record.resolutionStatus === 'unresolved';
    const canUseStreetViewFromCache =
        Number.isFinite(record.lat) &&
        Number.isFinite(record.lng) &&
        (record.lat !== 0 || record.lng !== 0) &&
        hasPlaceholderImages(record.images);
    return {
        placeId: record.placeId,
        placeQuery,
        name: record.name,
        lat: record.lat,
        lng: record.lng,
        providerId: record.providerId,
        images: canUseStreetViewFromCache
            ? buildGoogleStreetViewImageUrls(record.lat, record.lng)
            : record.images,
        highlights: canUseStreetViewFromCache
            ? [...record.highlights, 'Showing Google Street View imagery from cached coordinates.']
            : record.highlights,
        source: unresolved ? 'unresolved' : 'cache',
    };
}

function hasPlaceholderImages(images: string[] | undefined): boolean {
    if (!images || images.length === 0) return true;
    return images.every(
        (url) =>
            url.includes('source.unsplash.com') ||
            url.includes('picsum.photos')
    );
}

async function resolveSinglePlace(
    input: PlaceResolveInput,
    normalizedQuery: string
): Promise<{ result: PlaceResolveResult; cacheRecord?: PlaceCacheRecord }> {
    try {
        let apiResolved: Omit<PlaceResolveResult, 'source'>;
        try {
            apiResolved = await resolveWithGoogle(input);
        } catch (googleError) {
            const reason =
                googleError instanceof Error ? googleError.message : 'Unknown Google geocoding error';
            // Fallback when Google API key is restricted, billing is disabled, or geocoder quota fails.
            if (
                reason.includes('REQUEST_DENIED') ||
                reason.includes('OVER_QUERY_LIMIT') ||
                reason.includes('missing') ||
                reason.includes('No valid geocode')
            ) {
                apiResolved = await resolveWithNominatim(input);
            } else {
                throw googleError;
            }
        }

        const cacheRecord: PlaceCacheRecord = {
            placeId: apiResolved.placeId,
            placeQueryNormalized: normalizedQuery,
            placeQuery: input.placeQuery,
            name: apiResolved.name,
            lat: apiResolved.lat,
            lng: apiResolved.lng,
            providerId: apiResolved.providerId,
            images: apiResolved.images,
            highlights: apiResolved.highlights,
            resolutionStatus: 'resolved',
            unresolvedReason: undefined,
            lastUpdatedAt: new Date().toISOString(),
        };

        return { result: { ...apiResolved, source: 'api' }, cacheRecord };
    } catch (error) {
        if (Number.isFinite(input.hintLat) && Number.isFinite(input.hintLng)) {
            const hintLat = Number(input.hintLat);
            const hintLng = Number(input.hintLng);
            const candidateImages = buildGoogleStreetViewImageUrls(hintLat, hintLng);
            const media = buildFallbackMedia(input.placeQuery, input.area);
            return {
                result: {
                    placeId: createStablePlaceId(input.placeQuery),
                    placeQuery: input.placeQuery,
                    name: input.placeQuery,
                    lat: hintLat,
                    lng: hintLng,
                    images: candidateImages,
                    highlights: [
                        ...media.highlights.slice(0, 1),
                        'Showing Google Street View imagery from itinerary candidate coordinates.',
                        'Coordinates are using itinerary candidate values.',
                    ],
                    source: 'candidate',
                },
            };
        }

        const reason = error instanceof Error ? error.message : 'Unknown resolver error';
        const media = buildFallbackMedia(input.placeQuery, input.area);
        const unresolvedResult: PlaceResolveResult = {
            placeId: createStablePlaceId(input.placeQuery),
            placeQuery: input.placeQuery,
            name: input.placeQuery,
            lat: 0,
            lng: 0,
            images: media.images,
            highlights: [
                ...media.highlights,
                `Could not resolve coordinates automatically: ${reason}`,
            ],
            source: 'unresolved',
        };

        const unresolvedCache: PlaceCacheRecord = {
            placeId: unresolvedResult.placeId,
            placeQueryNormalized: normalizedQuery,
            placeQuery: input.placeQuery,
            name: unresolvedResult.name,
            lat: 0,
            lng: 0,
            providerId: undefined,
            images: unresolvedResult.images,
            highlights: unresolvedResult.highlights,
            resolutionStatus: 'unresolved',
            unresolvedReason: reason,
            lastUpdatedAt: new Date().toISOString(),
        };

        return { result: unresolvedResult, cacheRecord: unresolvedCache };
    }
}

async function runWithConcurrency<T, R>(
    items: T[],
    worker: (item: T) => Promise<R>,
    limit = 6
): Promise<R[]> {
    const results: R[] = [];
    let cursor = 0;
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const current = cursor;
            cursor += 1;
            // eslint-disable-next-line no-await-in-loop
            results[current] = await worker(items[current]);
        }
    });
    await Promise.all(runners);
    return results;
}

export async function resolvePlaces(inputs: PlaceResolveInput[]): Promise<PlaceResolveResult[]> {
    const cacheStore: PlaceCacheStore = readPlaceCache();
    const cacheMap = new Map(
        cacheStore.items.map((record) => [record.placeQueryNormalized, record] as const)
    );

    const results = new Array<PlaceResolveResult>(inputs.length);
    const uncachedWork: Array<{
        input: PlaceResolveInput;
        normalized: string;
        index: number;
        previousCached?: PlaceCacheRecord;
    }> = [];

    inputs.forEach((input, index) => {
        const normalizedQuery = normalizePlaceQuery(input.placeQuery);
        const cached = cacheMap.get(normalizedQuery);
        if (!cached) {
            uncachedWork.push({ input, normalized: normalizedQuery, index });
            return;
        }

        // If we have an existing Google place id but only placeholder media, refresh details once.
        if (cached.resolutionStatus !== 'unresolved' && hasPlaceholderImages(cached.images)) {
            uncachedWork.push({ input, normalized: normalizedQuery, index, previousCached: cached });
            return;
        }

        // Re-attempt unresolved placeholders when we now have hint coordinates or media needs refresh.
        if (
            cached.resolutionStatus === 'unresolved' &&
            (hasPlaceholderImages(cached.images) ||
                (Number.isFinite(input.hintLat) &&
                    Number.isFinite(input.hintLng) &&
                    (!Number.isFinite(cached.lat) ||
                        !Number.isFinite(cached.lng) ||
                        (cached.lat === 0 && cached.lng === 0))))
        ) {
            uncachedWork.push({ input, normalized: normalizedQuery, index, previousCached: cached });
            return;
        }

        // Re-attempt stale unresolved entries once per day.
        if (
            cached.resolutionStatus === 'unresolved' &&
            Date.now() - new Date(cached.lastUpdatedAt).getTime() > UNRESOLVED_CACHE_TTL_MS
        ) {
            uncachedWork.push({ input, normalized: normalizedQuery, index, previousCached: cached });
            return;
        }

        results[index] = recordToResult(cached, input.placeQuery);
    });

    const resolvedUncached = await runWithConcurrency(
        uncachedWork,
        async (workItem) => resolveSinglePlace(workItem.input, workItem.normalized),
        6
    );

    resolvedUncached.forEach((resolved, workIndex) => {
        const target = uncachedWork[workIndex];
        if (
            target.previousCached &&
            target.previousCached.resolutionStatus !== 'unresolved' &&
            resolved.result.source === 'unresolved'
        ) {
            // Preserve previously resolved coordinates if media-refresh call fails.
            results[target.index] = recordToResult(target.previousCached, target.input.placeQuery);
            return;
        }

        results[target.index] = resolved.result;
        if (resolved.cacheRecord) {
            upsertCacheRecordInStore(cacheStore, resolved.cacheRecord);
        }
    });

    if (resolvedUncached.some((item) => item.cacheRecord)) {
        writePlaceCache(cacheStore);
    }

    return results.filter(Boolean);
}
