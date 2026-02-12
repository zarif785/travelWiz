import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui';
import { useAuth } from '@/context';

export const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    const navLinks = isAuthenticated
        ? [
              { path: '/plan', label: 'Plan Trip' },
              { path: '/trips', label: 'My Trips' },
          ]
        : [{ path: '/', label: 'Home' }];

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        setIsMenuOpen(false);
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to={isAuthenticated ? '/plan' : '/'} className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">✈</span>
                        </div>
                        <span className="text-xl font-bold text-neutral-900">Travel Wiz</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`font-medium transition-colors ${isActive(link.path)
                                        ? 'text-primary-600'
                                        : 'text-neutral-600 hover:text-neutral-900'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-neutral-600">Hi, {user.name}</span>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setShowLogoutConfirm(true)}
                                >
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <Button size="sm" onClick={() => navigate('/auth')}>
                                Login / Signup
                            </Button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="w-6 h-6 text-neutral-700"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {isMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-neutral-200">
                        <div className="flex flex-col space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`font-medium px-4 py-2 rounded-lg transition-colors ${isActive(link.path)
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-neutral-600 hover:bg-neutral-50'
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="px-4">
                                {isAuthenticated && user ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-neutral-600">Hi, {user.name}</p>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full"
                                            onClick={() => {
                                                setShowLogoutConfirm(true);
                                            }}
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            navigate('/auth');
                                        }}
                                    >
                                        Login / Signup
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl text-center">
                        <h3 className="text-lg font-semibold text-neutral-900">Logout?</h3>
                        <p className="mt-2 text-sm text-neutral-600">
                            Do you want to logout?
                        </p>
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
        </nav>
    );
};
