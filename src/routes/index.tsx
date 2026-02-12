import React from 'react';
import { Navigate, createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { useAuth } from '@/context';
import { Auth, Home, PlanTrip, ItineraryPage, MyTrips, NotFound } from '@/pages';

const HomeRoute: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/plan" replace /> : <Home />;
};

const AuthRoute: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/plan" replace /> : <Auth />;
};

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
    }
    return children;
};

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                index: true,
                element: <HomeRoute />,
            },
            {
                path: 'plan',
                element: (
                    <RequireAuth>
                        <PlanTrip />
                    </RequireAuth>
                ),
            },
            {
                path: 'auth',
                element: <AuthRoute />,
            },
            {
                path: 'plan/result',
                element: (
                    <RequireAuth>
                        <ItineraryPage />
                    </RequireAuth>
                ),
            },
            {
                path: 'itinerary/:id',
                element: (
                    <RequireAuth>
                        <ItineraryPage />
                    </RequireAuth>
                ),
            },
            {
                path: 'trips',
                element: (
                    <RequireAuth>
                        <MyTrips />
                    </RequireAuth>
                ),
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);

export const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};
