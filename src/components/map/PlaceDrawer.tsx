import React from 'react';
import type { MapPin } from '@/types/map';

interface PlaceDrawerProps {
    pin: MapPin | null;
    onClose: () => void;
}

function googleMapsCoordsLink(lat: number, lng: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function googleMapsQueryLink(placeQuery: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
}

export const PlaceDrawer: React.FC<PlaceDrawerProps> = ({ pin, onClose }) => {
    if (!pin) {
        return (
            <aside className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-600">Select a pin to view place details.</p>
            </aside>
        );
    }

    return (
        <aside className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{pin.name}</h3>
                    <p className="text-sm text-neutral-600">{pin.area}</p>
                    <p className="text-xs text-neutral-500 mt-1">Source: {pin.source ?? 'unknown'}</p>
                </div>
                <button
                    type="button"
                    className="text-sm rounded-md border border-neutral-300 px-2 py-1"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>

            {pin.media?.highlights && pin.media.highlights.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-2">Description</h4>
                    <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
                        {pin.media.highlights.slice(0, 6).map((highlight, index) => (
                            <li key={`${pin.id}-hl-${index}`}>{highlight}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h4 className="text-sm font-semibold text-neutral-800 mb-2">Itinerary references</h4>
                <div className="space-y-1">
                    {pin.references.map((ref) => (
                        <p key={`${pin.id}-${ref.activityId}`} className="text-sm text-neutral-700">
                            Day {ref.dayNumber}{' -> '} {ref.section}: {ref.activityName}
                        </p>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <a
                    href={googleMapsCoordsLink(pin.lat, pin.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm rounded-lg bg-primary-500 text-white px-3 py-2"
                >
                    Navigate
                </a>
                <a
                    href={googleMapsQueryLink(pin.placeQuery)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm rounded-lg border border-neutral-300 px-3 py-2"
                >
                    Open by query
                </a>
            </div>
        </aside>
    );
};
