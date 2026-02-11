import React, { useEffect, useMemo, useState } from 'react';
import {
    GoogleMap,
    InfoWindowF,
    MarkerF,
    useJsApiLoader,
} from '@react-google-maps/api';
import type { MapPin } from '@/types/map';

interface MapViewProps {
    pins: MapPin[];
    selectedPinId: string | null;
    onSelectPin: (pinId: string | null) => void;
}

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const DEFAULT_CENTER = { lat: 0, lng: 0 };
const MAP_CONTAINER_STYLE: React.CSSProperties = {
    width: '100%',
    height: '520px',
};

export const MapView: React.FC<MapViewProps> = ({
    pins,
    selectedPinId,
    onSelectPin,
}) => {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_KEY,
    });

    const selectedPin = useMemo(
        () => pins.find((pin) => pin.id === selectedPinId) ?? null,
        [pins, selectedPinId]
    );

    useEffect(() => {
        if (!map || pins.length === 0) return;

        if (pins.length === 1) {
            map.panTo({ lat: pins[0].lat, lng: pins[0].lng });
            map.setZoom(12);
            return;
        }

        const bounds = new google.maps.LatLngBounds();
        pins.forEach((pin) => bounds.extend({ lat: pin.lat, lng: pin.lng }));
        map.fitBounds(bounds, 80);
    }, [map, pins]);

    if (!GOOGLE_MAPS_KEY) {
        return (
            <div className="h-[520px] rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">
                    Map is unavailable because <code>VITE_GOOGLE_MAPS_API_KEY</code> is not set.
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-[520px] rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm text-neutral-700">Loading Google Map...</p>
            </div>
        );
    }

    return (
        <div className="h-[520px] rounded-xl overflow-hidden border border-neutral-200">
            <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={DEFAULT_CENTER}
                zoom={2}
                onLoad={(mapInstance) => setMap(mapInstance)}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                }}
            >
                {pins.map((pin) => (
                    <MarkerF
                        key={pin.id}
                        position={{ lat: pin.lat, lng: pin.lng }}
                        onClick={() => onSelectPin(pin.id)}
                    />
                ))}

                {selectedPin && (
                    <InfoWindowF
                        position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
                        onCloseClick={() => onSelectPin(null)}
                    >
                        <div className="max-w-48">
                            <p className="font-semibold">{selectedPin.name}</p>
                            <p className="text-xs text-neutral-600">{selectedPin.area}</p>
                        </div>
                    </InfoWindowF>
                )}
            </GoogleMap>
        </div>
    );
};
