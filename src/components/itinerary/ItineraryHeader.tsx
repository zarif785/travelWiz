import React from 'react';
import { Card, Button } from '@/components/ui';
import type { Itinerary } from '@/types/itinerary';

interface ItineraryHeaderProps {
    itinerary: Itinerary;
    totalCost: number;
    dailyAverage: number;
    dayBreakdown: Array<{ dayNumber: number; cost: number }>;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onOpenMap: () => void;
}

function formatCurrency(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${currency} ${Math.round(amount)}`;
    }
}

export const ItineraryHeader: React.FC<ItineraryHeaderProps> = ({
    itinerary,
    totalCost,
    dailyAverage,
    dayBreakdown,
    onExpandAll,
    onCollapseAll,
    onOpenMap,
}) => {
    return (
        <Card>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Itinerary</h1>
                        <p className="text-neutral-600 mt-1">{itinerary.destinationSummary}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={onOpenMap}>
                            Map
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onExpandAll}>
                            Expand all
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onCollapseAll}>
                            Collapse all
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">Total estimated</p>
                        <p className="text-lg font-semibold text-neutral-900">
                            {formatCurrency(totalCost, itinerary.totals.currency)}
                        </p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">Daily average</p>
                        <p className="text-lg font-semibold text-neutral-900">
                            {formatCurrency(dailyAverage, itinerary.totals.currency)}
                        </p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">Map candidates</p>
                        <p className="text-lg font-semibold text-neutral-900">{itinerary.places.length}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {dayBreakdown.map((entry) => (
                        <span
                            key={`day-cost-${entry.dayNumber}`}
                            className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700"
                        >
                            Day {entry.dayNumber}: {formatCurrency(entry.cost, itinerary.totals.currency)}
                        </span>
                    ))}
                </div>
            </div>
        </Card>
    );
};
