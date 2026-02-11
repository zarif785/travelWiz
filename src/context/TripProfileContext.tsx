import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TripFormData, TripProfile } from '@/types/trip';
import {
    saveDraftToStorage,
    loadDraftFromStorage,
    clearDraftFromStorage,
    saveTripProfile as saveToStorage,
    loadTripProfiles,
} from '@/utils/storage';

interface TripProfileContextType {
    // Draft form data
    draftFormData: Partial<TripFormData> | null;
    saveDraft: (data: Partial<TripFormData>) => void;
    clearDraft: () => void;

    // Final trip profile
    finalTripProfile: TripProfile | null;
    saveFinalTripProfile: (profile: TripProfile) => void;

    // All saved trips
    allTripProfiles: TripProfile[];
    refreshTrips: () => void;
}

const TripProfileContext = createContext<TripProfileContextType | undefined>(undefined);

export const TripProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [draftFormData, setDraftFormData] = useState<Partial<TripFormData> | null>(null);
    const [finalTripProfile, setFinalTripProfile] = useState<TripProfile | null>(null);
    const [allTripProfiles, setAllTripProfiles] = useState<TripProfile[]>([]);

    // Load draft and trips on mount
    useEffect(() => {
        const draft = loadDraftFromStorage();
        if (draft) {
            setDraftFormData(draft);
        }

        const trips = loadTripProfiles();
        setAllTripProfiles(trips);
    }, []);

    const saveDraft = (data: Partial<TripFormData>) => {
        setDraftFormData(data);
        saveDraftToStorage(data);
    };

    const clearDraft = () => {
        setDraftFormData(null);
        clearDraftFromStorage();
    };

    const saveFinalTripProfile = (profile: TripProfile) => {
        setFinalTripProfile(profile);
        saveToStorage(profile);
        refreshTrips();
        clearDraft(); // Clear draft after successful save
    };

    const refreshTrips = () => {
        const trips = loadTripProfiles();
        setAllTripProfiles(trips);
    };

    const value: TripProfileContextType = {
        draftFormData,
        saveDraft,
        clearDraft,
        finalTripProfile,
        saveFinalTripProfile,
        allTripProfiles,
        refreshTrips,
    };

    return <TripProfileContext.Provider value={value}>{children}</TripProfileContext.Provider>;
};

export const useTripProfile = () => {
    const context = useContext(TripProfileContext);
    if (context === undefined) {
        throw new Error('useTripProfile must be used within a TripProfileProvider');
    }
    return context;
};
