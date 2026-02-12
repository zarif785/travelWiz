import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Input, PageWrapper } from '@/components/ui';
import { useAuth } from '@/context';

type AuthMode = 'login' | 'signup';

export const Auth: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, login, signup, logout } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        const nextPath =
            typeof (location.state as { from?: string } | null)?.from === 'string'
                ? (location.state as { from: string }).from
                : '/plan';
        navigate(nextPath);
    };

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
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
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setShowLogoutConfirm(true)}
                                >
                                    Logout
                                </Button>
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
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl text-center">
                            <h3 className="text-lg font-semibold text-neutral-900">Logout?</h3>
                            <p className="mt-2 text-sm text-neutral-600">Do you want to logout?</p>
                            <div className="mt-4 flex justify-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowLogoutConfirm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="button" size="sm" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </PageWrapper>
        </Container>
    );
};
