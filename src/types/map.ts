export interface MapPinReference {
    dayNumber: number;
    section: 'morning' | 'afternoon' | 'evening';
    activityId: string;
    activityName: string;
}

export interface MapPin {
    id: string;
    name: string;
    area: string;
    placeQuery: string;
    lat: number;
    lng: number;
    tags: string[];
    references: MapPinReference[];
    media?: {
        images: string[];
        videos?: string[];
        highlights?: string[];
    };
    source?: 'cache' | 'api' | 'candidate' | 'unresolved';
}

export interface PlaceResolveQuery {
    placeQuery: string;
    area?: string;
    hintLat?: number;
    hintLng?: number;
}

export interface PlaceResolveItem {
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
