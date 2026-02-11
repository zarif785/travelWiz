import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Auth, Home, PlanTrip, ItineraryResult, MyTrips, NotFound } from '@/pages';

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
                element: <ItineraryResult />,
            },
            {
                path: 'itinerary/:id',
                element: <ItineraryResult />,
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
