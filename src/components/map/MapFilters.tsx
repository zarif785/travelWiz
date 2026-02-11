import React from 'react';
import { Button } from '@/components/ui';

interface MapFiltersProps {
    dayOptions: number[];
    selectedDay: number | 'all';
    onDayChange: (day: number | 'all') => void;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
    dayOptions,
    selectedDay,
    onDayChange,
}) => {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
                <label htmlFor="day-filter" className="text-sm font-medium text-neutral-700">
                    Day filter
                </label>
                <select
                    id="day-filter"
                    value={selectedDay}
                    onChange={(event) =>
                        onDayChange(event.target.value === 'all' ? 'all' : Number(event.target.value))
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                    <option value="all">All days</option>
                    {dayOptions.map((day) => (
                        <option key={`day-${day}`} value={day}>
                            Day {day}
                        </option>
                    ))}
                </select>
            </div>
            <Button size="sm" variant="secondary" disabled>
                Show route for selected day (coming soon)
            </Button>
        </div>
    );
};
