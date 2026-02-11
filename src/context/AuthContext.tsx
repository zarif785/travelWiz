import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
    // Placeholder for future auth state
    isAuthenticated: boolean;
    user: null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Placeholder - no logic implemented yet
    const value: AuthContextType = {
        isAuthenticated: false,
        user: null,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
