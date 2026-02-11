import React from 'react';

interface Option {
    value: string;
    label: string;
    icon?: string;
}

interface MultiSelectProps {
    label: string;
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    error?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    label,
    options,
    selected,
    onChange,
    error,
}) => {
    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-700">{label}</label>

            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleOption(option.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isSelected
                                    ? 'bg-primary-500 text-white shadow-md'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                }`}
                        >
                            {option.icon && <span className="mr-2">{option.icon}</span>}
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};
