import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Home, PlanTrip, MyTrips, NotFound } from '@/pages';

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
