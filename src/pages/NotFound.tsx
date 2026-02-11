import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from '@/components/ui';

export const NotFound: React.FC = () => {
    return (
        <Container>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-9xl font-bold text-primary-500 mb-4">404</h1>
                <h2 className="text-3xl font-semibold text-neutral-900 mb-4">
                    Page Not Found
                </h2>
                <p className="text-lg text-neutral-600 mb-8 max-w-md">
                    Oops! The page you're looking for seems to have wandered off the map.
                </p>
                <Link to="/">
                    <Button>Back to Home</Button>
                </Link>
            </div>
        </Container>
    );
};
