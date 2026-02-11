import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="text-sm font-medium text-neutral-700">{label}</label>
            )}
            <input
                className={`w-full px-4 py-2 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors ${error ? 'border-red-500' : ''
                    } ${className}`}
                {...props}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
};
