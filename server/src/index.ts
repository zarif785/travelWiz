import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { generateItinerary, refineItinerary } from './itinerary-service';
import { placesRouter } from './routes/places';
import { generateItineraryRequestSchema, refineItineraryRequestSchema } from './schemas';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/places', placesRouter);

app.use((req, _res, next) => {
    const requestId = req.header('x-request-id') || randomUUID();
    req.headers['x-request-id'] = requestId;
    next();
});

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        timestamp: new Date().toISOString(),
    });
});

app.post('/api/itinerary/generate', async (req, res) => {
    const requestId = req.header('x-request-id') || randomUUID();
    const parsed = generateItineraryRequestSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid request payload',
            issues: parsed.error.issues,
            requestId,
        });
    }

    try {
        const { tripProfile } = parsed.data;
        const result = await generateItinerary(tripProfile);

        console.info(
            JSON.stringify({
                requestId,
                endpoint: '/api/itinerary/generate',
                tripProfileId: tripProfile.id,
                model: result.meta.model,
                warnings: result.meta.warnings ?? [],
            })
        );

        return res.json(result);
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        console.error(
            JSON.stringify({
                requestId,
                endpoint: '/api/itinerary/generate',
                error: reason,
            })
        );
        return res.status(500).json({
            error: 'Failed to generate itinerary',
            requestId,
        });
    }
});

app.post('/api/itinerary/refine', async (req, res) => {
    const requestId = req.header('x-request-id') || randomUUID();
    const parsed = refineItineraryRequestSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid request payload',
            issues: parsed.error.issues,
            requestId,
        });
    }

    try {
        const { tripProfile, currentItinerary, instruction, refine } = parsed.data;
        const result = await refineItinerary(tripProfile, currentItinerary, instruction, refine);

        console.info(
            JSON.stringify({
                requestId,
                endpoint: '/api/itinerary/refine',
                tripProfileId: tripProfile.id,
                model: result.meta.model,
                refineType: refine?.type,
                warnings: result.meta.warnings ?? [],
            })
        );

        return res.json(result);
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        console.error(
            JSON.stringify({
                requestId,
                endpoint: '/api/itinerary/refine',
                error: reason,
            })
        );
        return res.status(500).json({
            error: 'Failed to refine itinerary',
            requestId,
        });
    }
});

app.listen(port, () => {
    console.info(`Itinerary API listening on http://localhost:${port}`);
});
