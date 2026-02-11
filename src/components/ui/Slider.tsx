import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    leftLabel?: string;
    rightLabel?: string;
    showValue?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
    label,
    value,
    onChange,
    min = 0,
    max = 10,
    step = 1,
    leftLabel,
    rightLabel,
    showValue = true,
}) => {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-neutral-700">{label}</label>
                {showValue && (
                    <span className="text-sm font-semibold text-primary-600">{value}</span>
                )}
            </div>

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                style={{
                    WebkitAppearance: 'none',
                }}
            />

            {(leftLabel || rightLabel) && (
                <div className="flex justify-between text-xs text-neutral-500">
                    <span>{leftLabel}</span>
                    <span>{rightLabel}</span>
                </div>
            )}
        </div>
    );
};
