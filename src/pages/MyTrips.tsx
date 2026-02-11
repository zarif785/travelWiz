import React from 'react';
import { Container, PageWrapper, EmptyState } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

export const MyTrips: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container>
            <PageWrapper title="My Trips">
                <EmptyState
                    icon={
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    }
                    title="No Trips Yet"
                    description="You haven't created any trips yet. Start planning your first adventure!"
                    actionLabel="Plan a Trip"
                    onAction={() => navigate('/plan')}
                />
            </PageWrapper>
        </Container>
    );
};
