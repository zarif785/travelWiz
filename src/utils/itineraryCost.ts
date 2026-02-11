import type { DayPlan, Itinerary } from '@/types/itinerary';

type SectionKey = 'morning' | 'afternoon' | 'evening';

const SECTIONS: SectionKey[] = ['morning', 'afternoon', 'evening'];

export function computeSectionCost(day: DayPlan, section: SectionKey): number {
    return day[section].reduce((sum, activity) => sum + activity.estimatedCost, 0);
}

export function computeDayCost(day: DayPlan): number {
    return SECTIONS.reduce((sum, section) => sum + computeSectionCost(day, section), 0);
}

export function computeTotalCost(itinerary: Itinerary): number {
    return itinerary.days.reduce((sum, day) => sum + computeDayCost(day), 0);
}

export function computeDailyAverage(itinerary: Itinerary): number {
    if (itinerary.days.length === 0) return 0;
    return computeTotalCost(itinerary) / itinerary.days.length;
}

export function computeDayBreakdown(itinerary: Itinerary): Array<{ dayNumber: number; cost: number }> {
    return itinerary.days.map((day) => ({
        dayNumber: day.dayNumber,
        cost: computeDayCost(day),
    }));
}

export function isOverBudget(total: number, budgetTotal: number): boolean {
    return total > budgetTotal;
}

export function withRecomputedTotals(itinerary: Itinerary): Itinerary {
    const total = computeTotalCost(itinerary);
    const average = itinerary.days.length > 0 ? total / itinerary.days.length : 0;

    return {
        ...itinerary,
        totals: {
            ...itinerary.totals,
            estimatedTotalCost: total,
            estimatedDailyAverageCost: average,
        },
    };
}
