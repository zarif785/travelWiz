import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    label: string;
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
    label,
    tags,
    onChange,
    placeholder = 'Type and press Enter',
}) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = inputValue.trim();
            if (trimmed && !tags.includes(trimmed)) {
                onChange([...tags, trimmed]);
                setInputValue('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">{label}</label>

            <div className="flex flex-wrap gap-2 p-3 border-2 border-neutral-200 rounded-xl focus-within:border-primary-500 transition-colors">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-primary-900"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}

                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] outline-none bg-transparent"
                />
            </div>

            <p className="text-xs text-neutral-500">Press Enter to add</p>
        </div>
    );
};
