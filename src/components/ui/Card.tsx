import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
    return (
        <div
            className={`bg-white rounded-2xl shadow-soft p-6 ${hover ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1' : ''
                } ${className}`}
        >
            {children}
        </div>
    );
};
