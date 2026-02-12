import React from 'react';
import { Container } from '../ui';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-neutral-900 text-neutral-300 py-8 mt-auto">
            <Container>
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">✈</span>
                        </div>
                        <span className="font-semibold text-white">Travel Wiz</span>
                    </div>

                    <p className="text-sm">
                        © {currentYear} Travel Wiz. All rights reserved.
                    </p>

                    <div className="flex space-x-6 text-sm">
                        <a href="#" className="hover:text-white transition-colors">
                            Privacy
                        </a>
                        <a href="#" className="hover:text-white transition-colors">
                            Terms
                        </a>
                        <a href="#" className="hover:text-white transition-colors">
                            Contact
                        </a>
                    </div>
                </div>
            </Container>
        </footer>
    );
};
