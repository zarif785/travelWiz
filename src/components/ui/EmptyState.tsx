import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && (
                <div className="mb-4 text-neutral-400">
                    {icon}
                </div>
            )}
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-neutral-600 mb-6 max-w-md">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
