import React from 'react';

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
    label,
    checked,
    onChange,
    description,
}) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <label className="text-sm font-medium text-neutral-700">{label}</label>
                {description && (
                    <p className="text-xs text-neutral-500 mt-1">{description}</p>
                )}
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
};
