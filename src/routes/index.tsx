import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Auth, Home, MapPage, PlanTrip, ItineraryPage, MyTrips, NotFound } from '@/pages';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'plan',
                element: <PlanTrip />,
            },
            {
                path: 'auth',
                element: <Auth />,
            },
            {
                path: 'plan/result',
                element: <ItineraryPage />,
            },
            {
                path: 'itinerary/:id',
                element: <ItineraryPage />,
            },
            {
                path: 'itinerary/:id/map',
                element: <MapPage />,
            },
            {
                path: 'trips',
                element: <MyTrips />,
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
