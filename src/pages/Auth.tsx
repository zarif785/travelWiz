import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Input, PageWrapper } from '@/components/ui';
import { useAuth } from '@/context';

type AuthMode = 'login' | 'signup';

export const Auth: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, login, signup, logout } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const result =
            mode === 'login'
                ? login(email, password)
                : signup(name, email, password);

        if (!result.ok) {
            setError(result.error ?? 'Unable to continue.');
            return;
        }

        setError(null);
        navigate('/trips');
    };

    return (
        <Container>
            <PageWrapper title="Account">
                <Card className="max-w-xl mx-auto">
                    {isAuthenticated && user ? (
                        <div className="space-y-4">
                            <p className="text-neutral-700">
                                Signed in as <strong>{user.name}</strong> ({user.email})
                            </p>
                            <div className="flex gap-3">
                                <Button onClick={() => navigate('/trips')}>Go to My Trips</Button>
                                <Button variant="secondary" onClick={logout}>Logout</Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={mode === 'login' ? 'primary' : 'secondary'}
                                    onClick={() => setMode('login')}
                                >
                                    Login
                                </Button>
                                <Button
                                    type="button"
                                    variant={mode === 'signup' ? 'primary' : 'secondary'}
                                    onClick={() => setMode('signup')}
                                >
                                    Signup
                                </Button>
                            </div>

                            {mode === 'signup' && (
                                <Input
                                    label="Name"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                />
                            )}

                            <Input
                                label="Email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />

                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <Button type="submit" className="w-full">
                                {mode === 'login' ? 'Login' : 'Create account'}
                            </Button>
                        </form>
                    )}
                </Card>
            </PageWrapper>
        </Container>
    );
};
