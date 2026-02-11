import React from 'react';

interface PageWrapperProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, title, className = '' }) => {
    return (
        <div className={`py-8 sm:py-12 ${className}`}>
            {title && (
                <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-8">
                    {title}
                </h1>
            )}
            {children}
        </div>
    );
};
