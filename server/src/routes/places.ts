import { Router } from 'express';
import { z } from 'zod';
import { getCacheByPlaceId } from '../db/place-cache';
import { resolvePlaces } from '../services/placeResolver';

const resolvePlacesRequestSchema = z.object({
    queries: z
        .array(
            z.object({
                placeQuery: z.string().min(1),
                area: z.string().optional(),
                hintLat: z.number().optional(),
                hintLng: z.number().optional(),
            })
        )
        .min(1),
});

export const placesRouter = Router();

placesRouter.get('/photo', async (req, res) => {
    const photoRef = String(req.query.photoRef ?? '').trim();
    const maxwidth = Number(req.query.maxwidth ?? 1200);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

    if (!photoRef) {
        return res.status(400).json({ error: 'photoRef is required' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY is missing' });
    }

    const width = Number.isFinite(maxwidth) ? Math.max(200, Math.min(1600, Math.floor(maxwidth))) : 1200;
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${width}&photo_reference=${encodeURIComponent(
        photoRef
    )}&key=${apiKey}`;

    try {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch Google place photo' });
        }
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const cacheControl = response.headers.get('cache-control') || 'public, max-age=86400';
        const bytes = Buffer.from(await response.arrayBuffer());

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', cacheControl);
        return res.status(200).send(bytes);
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown photo proxy error';
        return res.status(500).json({ error: 'Photo proxy failed', reason });
    }
});

placesRouter.get('/streetview', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const heading = Number(req.query.heading ?? 0);
    const size = String(req.query.size ?? '800x500');
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ error: 'lat and lng are required and must be numeric' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY is missing' });
    }

    const safeHeading = Number.isFinite(heading) ? Math.max(0, Math.min(360, Math.floor(heading))) : 0;
    const safeSize = /^[0-9]{2,4}x[0-9]{2,4}$/.test(size) ? size : '800x500';

    const url = `https://maps.googleapis.com/maps/api/streetview?size=${encodeURIComponent(
        safeSize
    )}&location=${lat},${lng}&heading=${safeHeading}&fov=90&pitch=0&key=${apiKey}`;

    try {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch Google Street View image' });
        }
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const bytes = Buffer.from(await response.arrayBuffer());
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(bytes);
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown streetview proxy error';
        return res.status(500).json({ error: 'Street View proxy failed', reason });
    }
});

placesRouter.post('/resolve', async (req, res) => {
    const parsed = resolvePlacesRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid places resolve request payload',
            issues: parsed.error.issues,
        });
    }

    try {
        const results = await resolvePlaces(parsed.data.queries);
        const unresolved = results
            .filter((item) => item.source === 'unresolved')
            .map((item) => ({
                placeQuery: item.placeQuery,
                reason:
                    item.highlights.find((line) =>
                        line.toLowerCase().startsWith('could not resolve coordinates automatically')
                    ) ?? 'No resolution reason available',
            }));
        return res.json({
            results,
            meta: {
                total: results.length,
                unresolvedCount: unresolved.length,
                unresolved,
            },
        });
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown resolve error';
        return res.status(500).json({
            error: 'Failed to resolve places',
            reason,
        });
    }
});

placesRouter.get('/:placeId', (req, res) => {
    const placeId = req.params.placeId;
    const record = getCacheByPlaceId(placeId);

    if (!record) {
        return res.status(404).json({
            error: 'Place not found in cache',
            placeId,
        });
    }

    return res.json({
        placeId: record.placeId,
        placeQuery: record.placeQuery,
        name: record.name,
        lat: record.lat,
        lng: record.lng,
        providerId: record.providerId,
        images: record.images,
        highlights: record.highlights,
        source: 'cache',
        lastUpdatedAt: record.lastUpdatedAt,
    });
});
