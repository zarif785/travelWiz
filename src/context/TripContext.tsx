import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface TripContextType {
    // Placeholder for future trip state
    trips: [];
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Placeholder - no logic implemented yet
    const value: TripContextType = {
        trips: [],
    };

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export const useTrip = () => {
    const context = useContext(TripContext);
    if (context === undefined) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
};
