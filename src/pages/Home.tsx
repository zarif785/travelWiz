import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Card } from '@/components/ui';

export const Home: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: '🤖',
            title: 'AI-Generated Itineraries',
            description: 'Get personalized travel plans crafted by advanced AI based on your preferences and interests.',
        },
        {
            icon: '🗺️',
            title: 'Smart Map Integration',
            description: 'Visualize your entire trip with interactive maps, pinned locations, and optimized routes.',
        },
        {
            icon: '✈️',
            title: 'Flights & Hotel Recommendations',
            description: 'Discover the best flight deals and accommodation options tailored to your budget and style.',
        },
    ];

    return (
        <div>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 py-20 sm:py-32">
                <Container>
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 text-balance">
                            Plan Your Perfect Trip with AI
                        </h1>
                        <p className="text-lg sm:text-xl text-neutral-600 mb-8 text-balance">
                            Experience the future of travel planning. Let our AI create personalized itineraries,
                            discover hidden gems, and make your dream vacation a reality.
                        </p>
                        <Button size="lg" onClick={() => navigate('/plan')}>
                            Start Planning
                        </Button>
                    </div>
                </Container>

                {/* Decorative gradient orbs */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </section>

            {/* Features Section */}
            <section className="py-16 sm:py-24 bg-white">
                <Container>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                            Everything You Need for the Perfect Trip
                        </h2>
                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                            Powerful features designed to make travel planning effortless and enjoyable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} hover>
                                <div className="text-center">
                                    <div className="text-5xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-neutral-600">
                                        {feature.description}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Container>
            </section>
        </div>
    );
};
