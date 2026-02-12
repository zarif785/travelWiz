import React, { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, EmptyState } from '@/components/ui';
import { useItinerary, useTripProfile } from '@/context';
import { getTripProfile } from '@/utils/storage';
import { refineItineraryRequest } from '@/services/itineraryApi';
import type { Activity, Itinerary } from '@/types/itinerary';
import {
    computeDailyAverage,
    computeDayBreakdown,
    computeTotalCost,
    isOverBudget,
    withRecomputedTotals,
} from '@/utils/itineraryCost';
import { BudgetWarningBanner } from '@/components/itinerary/BudgetWarningBanner';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { DayCard } from '@/components/itinerary/DayCard';
import { AddActivityModal } from '@/components/itinerary/AddActivityModal';
import { ReplaceActivityModal } from '@/components/itinerary/ReplaceActivityModal';
import type { SectionKey } from '@/components/itinerary/SectionTimeline';

interface SectionTarget {
    dayNumber: number;
    section: SectionKey;
}

interface ReplaceTarget extends SectionTarget {
    activity: Activity;
}

const SECTION_KEYS: SectionKey[] = ['morning', 'afternoon', 'evening'];

function getSectionStateStorageKey(itineraryId: string): string {
    return `travelai_itinerary_ui_state_${itineraryId}`;
}

function sectionKey(dayNumber: number, section: SectionKey): string {
    return `${dayNumber}-${section}`;
}

function sectionTitle(section: SectionKey): string {
    if (section === 'morning') return 'Morning';
    if (section === 'afternoon') return 'Afternoon';
    return 'Evening';
}

function parseSectionContainerId(value: string): SectionTarget | null {
    if (!value.startsWith('section-')) return null;
    const match = /^section-(\d+)-(morning|afternoon|evening)$/.exec(value);
    if (!match) return null;
    return {
        dayNumber: Number(match[1]),
        section: match[2] as SectionKey,
    };
}

function simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}

function buildPlacesFromItinerary(itinerary: Itinerary): Itinerary['places'] {
    const map = new Map<string, Itinerary['places'][number]>();
    itinerary.days.forEach((day) => {
        SECTION_KEYS.forEach((section) => {
            day[section].forEach((activity) => {
                const key = activity.placeQuery.trim().toLowerCase();
                if (!key) return;
                const existing = map.get(key);
                if (!existing) {
                    map.set(key, {
                        placeId: simpleHash(key),
                        name: activity.name,
                        area: activity.area,
                        placeQuery: activity.placeQuery,
                        coordinatesCandidate: activity.coordinatesCandidate,
                        tags: Array.from(new Set(activity.tags)),
                    });
                    return;
                }
                map.set(key, {
                    ...existing,
                    tags: Array.from(new Set([...existing.tags, ...activity.tags])),
                });
            });
        });
    });
    return Array.from(map.values());
}

function withUpdatedPlaces(itinerary: Itinerary): Itinerary {
    return {
        ...itinerary,
        places: buildPlacesFromItinerary(itinerary),
    };
}

function findActivityLocation(itinerary: Itinerary, activityId: string): (SectionTarget & { index: number }) | null {
    for (const day of itinerary.days) {
        for (const section of SECTION_KEYS) {
            const index = day[section].findIndex((activity) => activity.id === activityId);
            if (index >= 0) {
                return {
                    dayNumber: day.dayNumber,
                    section,
                    index,
                };
            }
        }
    }
    return null;
}

function moveActivityInItinerary(
    itinerary: Itinerary,
    source: SectionTarget & { index: number },
    target: SectionTarget & { index: number }
): Itinerary {
    const days = itinerary.days.map((day) => ({
        ...day,
        morning: [...day.morning],
        afternoon: [...day.afternoon],
        evening: [...day.evening],
    }));

    const sourceDay = days.find((day) => day.dayNumber === source.dayNumber);
    const targetDay = days.find((day) => day.dayNumber === target.dayNumber);
    if (!sourceDay || !targetDay) return itinerary;

    const sourceList = sourceDay[source.section];
    if (!sourceList[source.index]) return itinerary;

    const [moved] = sourceList.splice(source.index, 1);
    const targetList = targetDay[target.section];
    const targetIndex = Math.max(0, Math.min(target.index, targetList.length));
    targetList.splice(targetIndex, 0, moved);

    return {
        ...itinerary,
        days,
    };
}

export const ItineraryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { finalTripProfile } = useTripProfile();
    const { currentItinerary, getItineraryById, setItinerary } = useItinerary();

    const [dayExpanded, setDayExpanded] = useState<Record<number, boolean>>({});
    const [sectionExpanded, setSectionExpanded] = useState<Record<string, boolean>>({});
    const [friendlyError, setFriendlyError] = useState<string | null>(null);
    const [addTarget, setAddTarget] = useState<SectionTarget | null>(null);
    const [replaceTarget, setReplaceTarget] = useState<ReplaceTarget | null>(null);

    const itinerary = useMemo(() => {
        if (id) return getItineraryById(id);
        return currentItinerary;
    }, [id, getItineraryById, currentItinerary]);

    const tripProfile = useMemo(() => {
        if (!itinerary?.tripId) return finalTripProfile;
        return finalTripProfile?.id === itinerary.tripId ? finalTripProfile : getTripProfile(itinerary.tripId);
    }, [finalTripProfile, itinerary?.tripId]);

    useEffect(() => {
        if (!itinerary) return;
        const storageKey = getSectionStateStorageKey(itinerary.id);
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                const nextDayState = Object.fromEntries(itinerary.days.map((day) => [day.dayNumber, true]));
                const nextSectionState: Record<string, boolean> = {};
                itinerary.days.forEach((day) => {
                    SECTION_KEYS.forEach((section) => {
                        nextSectionState[sectionKey(day.dayNumber, section)] = true;
                    });
                });
                setDayExpanded(nextDayState);
                setSectionExpanded(nextSectionState);
                return;
            }

            const parsed = JSON.parse(raw) as {
                dayExpanded?: Record<number, boolean>;
                sectionExpanded?: Record<string, boolean>;
            };

            setDayExpanded(parsed.dayExpanded ?? {});
            setSectionExpanded(parsed.sectionExpanded ?? {});
        } catch {
            // no-op
        }
    }, [itinerary?.id]);

    useEffect(() => {
        if (!itinerary) return;
        const storageKey = getSectionStateStorageKey(itinerary.id);
        localStorage.setItem(
            storageKey,
            JSON.stringify({
                dayExpanded,
                sectionExpanded,
            })
        );
    }, [dayExpanded, sectionExpanded, itinerary]);

    const refineMutation = useMutation({
        mutationFn: async (instruction: string) => {
            if (!itinerary || !tripProfile) {
                throw new Error('Trip profile not found for this itinerary.');
            }
            return refineItineraryRequest({
                tripProfile,
                currentItinerary: itinerary,
                instruction,
            });
        },
        onSuccess: (response) => {
            setFriendlyError(null);
            setItinerary(withRecomputedTotals(withUpdatedPlaces(response.itinerary)));
            setReplaceTarget(null);
        },
        onError: (error) => {
            setFriendlyError(error instanceof Error ? error.message : 'Could not refine itinerary right now.');
        },
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!itinerary) {
        return (
            <Container>
                <div className="py-10">
                    <EmptyState
                        title="No itinerary loaded"
                        description="Generate an itinerary from the planning wizard first."
                        actionLabel="Go to planner"
                        onAction={() => navigate('/plan')}
                        icon={<span className="text-5xl">🗺️</span>}
                    />
                </div>
            </Container>
        );
    }

    const totalCost = computeTotalCost(itinerary);
    const dailyAverage = computeDailyAverage(itinerary);
    const dayBreakdown = computeDayBreakdown(itinerary);
    const budgetTotal = tripProfile?.budgetTotal ?? 0;
    const overBy = Math.max(0, totalCost - budgetTotal);
    const overBudget = tripProfile ? isOverBudget(totalCost, budgetTotal) : false;

    const persistUpdate = (next: Itinerary) => {
        setItinerary(withRecomputedTotals(withUpdatedPlaces(next)));
    };

    const handleRemove = (dayNumber: number, section: SectionKey, activityId: string) => {
        const next: Itinerary = {
            ...itinerary,
            days: itinerary.days.map((day) =>
                day.dayNumber !== dayNumber
                    ? day
                    : {
                          ...day,
                          [section]: day[section].filter((activity) => activity.id !== activityId),
                      }
            ),
        };
        persistUpdate(next);
    };

    const handleAdd = (activity: Activity, section: SectionKey, dayNumber: number) => {
        const next: Itinerary = {
            ...itinerary,
            days: itinerary.days.map((day) =>
                day.dayNumber !== dayNumber
                    ? day
                    : {
                          ...day,
                          [section]: [...day[section], activity],
                      }
            ),
        };
        persistUpdate(next);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const activeId = String(event.active.id);
        const overId = event.over ? String(event.over.id) : null;
        if (!overId) return;

        const source = findActivityLocation(itinerary, activeId);
        if (!source) return;

        const overContainer = parseSectionContainerId(overId);
        let target: SectionTarget & { index: number } | null = null;

        if (overContainer) {
            const targetDay = itinerary.days.find((day) => day.dayNumber === overContainer.dayNumber);
            const targetLength = targetDay ? targetDay[overContainer.section].length : 0;
            target = { ...overContainer, index: targetLength };
        } else {
            const overActivityLocation = findActivityLocation(itinerary, overId);
            if (!overActivityLocation) return;
            target = {
                dayNumber: overActivityLocation.dayNumber,
                section: overActivityLocation.section,
                index: overActivityLocation.index,
            };
        }

        if (!target) return;
        if (
            source.dayNumber === target.dayNumber &&
            source.section === target.section &&
            source.index === target.index
        ) {
            return;
        }

        const moved = moveActivityInItinerary(itinerary, source, target);
        persistUpdate(moved);
    };

    const expandAll = () => {
        const nextDayState = Object.fromEntries(itinerary.days.map((day) => [day.dayNumber, true]));
        const nextSectionState: Record<string, boolean> = {};
        itinerary.days.forEach((day) => {
            SECTION_KEYS.forEach((section) => {
                nextSectionState[sectionKey(day.dayNumber, section)] = true;
            });
        });
        setDayExpanded(nextDayState);
        setSectionExpanded(nextSectionState);
    };

    const collapseAll = () => {
        const nextDayState = Object.fromEntries(itinerary.days.map((day) => [day.dayNumber, false]));
        const nextSectionState: Record<string, boolean> = {};
        itinerary.days.forEach((day) => {
            SECTION_KEYS.forEach((section) => {
                nextSectionState[sectionKey(day.dayNumber, section)] = false;
            });
        });
        setDayExpanded(nextDayState);
        setSectionExpanded(nextSectionState);
    };

    return (
        <Container>
            <div className="py-8 space-y-5">
                <ItineraryHeader
                    itinerary={itinerary}
                    totalCost={totalCost}
                    dailyAverage={dailyAverage}
                    dayBreakdown={dayBreakdown}
                    onExpandAll={expandAll}
                    onCollapseAll={collapseAll}
                />

                {overBudget && (
                    <BudgetWarningBanner
                        overBy={overBy}
                        currency={itinerary.totals.currency}
                        isLoading={refineMutation.isPending}
                        onMakeCheaper={() =>
                            refineMutation.mutate(
                                'Make this itinerary cheaper while preserving core experiences and constraints.'
                            )
                        }
                    />
                )}

                {friendlyError && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                        {friendlyError}
                    </div>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="space-y-4">
                        {itinerary.days.map((day) => (
                            <DayCard
                                key={day.dayNumber}
                                day={day}
                                isExpanded={dayExpanded[day.dayNumber] ?? true}
                                isSectionExpanded={(section) =>
                                    sectionExpanded[sectionKey(day.dayNumber, section)] ?? true
                                }
                                onToggleDay={() =>
                                    setDayExpanded((prev) => ({
                                        ...prev,
                                        [day.dayNumber]: !(prev[day.dayNumber] ?? true),
                                    }))
                                }
                                onToggleSection={(section) =>
                                    setSectionExpanded((prev) => ({
                                        ...prev,
                                        [sectionKey(day.dayNumber, section)]:
                                            !(prev[sectionKey(day.dayNumber, section)] ?? true),
                                    }))
                                }
                                onAddActivity={(section) => setAddTarget({ dayNumber: day.dayNumber, section })}
                                onRemoveActivity={(section, activityId) =>
                                    handleRemove(day.dayNumber, section, activityId)
                                }
                                onReplaceActivity={(section, activity) =>
                                    setReplaceTarget({ dayNumber: day.dayNumber, section, activity })
                                }
                            />
                        ))}
                    </div>
                </DndContext>
            </div>

            <AddActivityModal
                isOpen={!!addTarget}
                dayNumber={addTarget?.dayNumber ?? null}
                section={addTarget?.section ?? null}
                onClose={() => setAddTarget(null)}
                onSave={handleAdd}
            />

            <ReplaceActivityModal
                isOpen={!!replaceTarget}
                activity={replaceTarget?.activity ?? null}
                dayNumber={replaceTarget?.dayNumber ?? null}
                sectionLabel={replaceTarget ? sectionTitle(replaceTarget.section) : undefined}
                isLoading={refineMutation.isPending}
                onClose={() => setReplaceTarget(null)}
                onSubmit={(userInstruction) => {
                    if (!replaceTarget) return;
                    const fallbackInstruction = [
                        `Replace Day ${replaceTarget.dayNumber} ${replaceTarget.section} activity "${replaceTarget.activity.name}".`,
                        'Keep same area if possible and follow trip profile constraints.',
                        'Return full updated itinerary JSON.',
                    ].join(' ');
                    const instruction =
                        userInstruction.trim().length > 0
                            ? `${fallbackInstruction} User preference: ${userInstruction.trim()}`
                            : fallbackInstruction;
                    refineMutation.mutate(instruction);
                }}
            />
        </Container>
    );
};
