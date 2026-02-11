import fs from 'node:fs';
import path from 'node:path';

export interface PlaceCacheRecord {
    placeId: string;
    placeQueryNormalized: string;
    placeQuery: string;
    name: string;
    lat: number;
    lng: number;
    providerId?: string;
    images: string[];
    highlights: string[];
    resolutionStatus?: 'resolved' | 'unresolved';
    unresolvedReason?: string;
    lastUpdatedAt: string;
}

export interface PlaceCacheStore {
    items: PlaceCacheRecord[];
}

const DEFAULT_CACHE_FILE = 'server/data/place-cache.json';
const PLACE_CACHE_FILE = process.env.PLACES_CACHE_FILE || DEFAULT_CACHE_FILE;

function getCachePath(): string {
    return path.resolve(process.cwd(), PLACE_CACHE_FILE);
}

function ensureCacheFile(): string {
    const cachePath = getCachePath();
    const dir = path.dirname(cachePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(cachePath)) {
        fs.writeFileSync(cachePath, JSON.stringify({ items: [] }, null, 2), 'utf8');
    }

    return cachePath;
}

export function normalizePlaceQuery(value: string): string {
    return value.trim().toLowerCase();
}

export function createStablePlaceId(query: string): string {
    const normalized = normalizePlaceQuery(query);
    let hash = 0;
    for (let index = 0; index < normalized.length; index += 1) {
        hash = (hash << 5) - hash + normalized.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}

export function readPlaceCache(): PlaceCacheStore {
    const cachePath = ensureCacheFile();
    try {
        const raw = fs.readFileSync(cachePath, 'utf8');
        const parsed = JSON.parse(raw) as PlaceCacheStore;
        if (!Array.isArray(parsed.items)) {
            return { items: [] };
        }
        return parsed;
    } catch (error) {
        console.error('Failed to read place cache:', error);
        return { items: [] };
    }
}

export function writePlaceCache(store: PlaceCacheStore): void {
    const cachePath = ensureCacheFile();
    fs.writeFileSync(cachePath, JSON.stringify(store, null, 2), 'utf8');
}

export function getCacheByNormalizedQuery(normalizedQuery: string): PlaceCacheRecord | null {
    const store = readPlaceCache();
    return store.items.find((item) => item.placeQueryNormalized === normalizedQuery) ?? null;
}

export function getCacheByPlaceId(placeId: string): PlaceCacheRecord | null {
    const store = readPlaceCache();
    return store.items.find((item) => item.placeId === placeId) ?? null;
}

export function upsertCacheRecord(record: PlaceCacheRecord): void {
    const store = readPlaceCache();
    const index = store.items.findIndex(
        (item) => item.placeQueryNormalized === record.placeQueryNormalized
    );

    if (index >= 0) {
        store.items[index] = record;
    } else {
        store.items.push(record);
    }

    writePlaceCache(store);
}

export function upsertCacheRecordInStore(store: PlaceCacheStore, record: PlaceCacheRecord): void {
    const index = store.items.findIndex(
        (item) => item.placeQueryNormalized === record.placeQueryNormalized
    );

    if (index >= 0) {
        store.items[index] = record;
    } else {
        store.items.push(record);
    }
}
