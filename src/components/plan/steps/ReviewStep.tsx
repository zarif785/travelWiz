import React, { useState } from 'react';
import type { TripFormData, TripProfile } from '@/types/trip';
import { Card, Button } from '@/components/ui';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { CURRENCY_OPTIONS, TRAVEL_TYPES, PACE_OPTIONS } from '@/types/trip';

interface ReviewStepProps {
    formData: TripFormData;
    tripProfile: TripProfile | null;
    onSave: () => void;
    onGenerateItinerary: () => void;
    onViewItinerary: () => void;
    hasSavedItinerary: boolean;
    isSaved: boolean;
    isGeneratingItinerary: boolean;
    generateError?: string;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
    formData,
    tripProfile,
    onSave,
    onGenerateItinerary,
    onViewItinerary,
    hasSavedItinerary,
    isSaved,
    isGeneratingItinerary,
    generateError,
}) => {
    const [showJSON, setShowJSON] = useState(false);

    const currencySymbol = CURRENCY_OPTIONS.find((c) => c.value === formData.currency)?.symbol || '$';
    const travelTypeLabel = TRAVEL_TYPES.find((t) => t.value === formData.travelType)?.label;
    const paceLabel = PACE_OPTIONS.find((p) => p.value === formData.pace)?.label;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Review Your Trip Profile
                </h2>
                <p className="text-neutral-600">
                    Check everything looks good before saving
                </p>
            </div>

            <div className="space-y-4">
                {/* Destinations */}
                <Card>
                    <h3 className="font-semibold text-neutral-900 mb-3">📍 Destinations</h3>
                    <div className="space-y-2">
                        {formData.destinations.map((dest, index) => (
                            <p key={index} className="text-neutral-700">
                                {dest.city}, {dest.country}
                            </p>
                        ))}
                    </div>
                </Card>

                {/* Dates */}
                <Card>
                    <h3 className="font-semibold text-neutral-900 mb-3">📅 Dates & Duration</h3>
                    {formData.dateMode === 'range' ? (
                        <div className="space-y-1 text-neutral-700">
                            <p><strong>Start:</strong> {formData.startDate}</p>
                            <p><strong>End:</strong> {formData.endDate}</p>
                            <p><strong>Duration:</strong> {formData.durationDays} days</p>
                        </div>
                    ) : (
                        <p className="text-neutral-700">
                            <strong>Duration:</strong> {formData.durationDays} days
                        </p>
                    )}
                </Card>

                {/* Budget */}
                <Card>
                    <h3 className="font-semibold text-neutral-900 mb-3">💰 Budget</h3>
                    <div className="space-y-1 text-neutral-700">
                        <p><strong>Total:</strong> {currencySymbol}{formData.budgetTotal}</p>
                        {formData.budgetPerDay && (
                            <p><strong>Per Day:</strong> {currencySymbol}{formData.budgetPerDay}</p>
                        )}
                    </div>
                </Card>

                {/* Travel Style */}
                <Card>
                    <h3 className="font-semibold text-neutral-900 mb-3">✨ Travel Style</h3>
                    <div className="space-y-2 text-neutral-700">
                        <p><strong>Type:</strong> {travelTypeLabel}</p>
                        <p><strong>Pace:</strong> {paceLabel}</p>
                        <p><strong>Interests:</strong> {formData.interests.join(', ')}</p>
                    </div>
                </Card>

                {/* Constraints & Preferences */}
                <Card>
                    <h3 className="font-semibold text-neutral-900 mb-3">⚙️ Preferences</h3>
                    <div className="space-y-2 text-neutral-700">
                        {formData.dietary && <p><strong>Dietary:</strong> {formData.dietary}</p>}
                        {formData.accessibility && <p><strong>Accessibility:</strong> {formData.accessibility}</p>}
                        <p><strong>With Kids:</strong> {formData.withKids ? 'Yes' : 'No'}</p>
                        {formData.mustSee.length > 0 && (
                            <p><strong>Must-See:</strong> {formData.mustSee.join(', ')}</p>
                        )}
                        {formData.avoid.length > 0 && (
                            <p><strong>Avoid:</strong> {formData.avoid.join(', ')}</p>
                        )}
                        <p><strong>Companions:</strong> {formData.companionsCount}</p>
                        <p><strong>Walking Tolerance:</strong> {formData.walkingTolerance}/10</p>
                        <p><strong>Day Start:</strong> {formData.dayStartPreference}/10 (Early → Late)</p>
                        <p><strong>Comfort vs Budget:</strong> {formData.comfortVsBudget}/10</p>
                    </div>
                </Card>
            </div>

            {/* Save Button */}
            {!isSaved ? (
                <Button onClick={onSave} size="lg" className="w-full">
                    Save Trip Profile
                </Button>
            ) : (
                <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="text-white" size={20} />
                    </div>
                    <div>
                        <p className="font-semibold text-green-900">Trip Profile Saved!</p>
                        <p className="text-sm text-green-700">Your trip has been saved successfully.</p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        onClick={onGenerateItinerary}
                        size="lg"
                        className="w-full"
                        isLoading={isGeneratingItinerary}
                        disabled={!tripProfile}
                    >
                        {hasSavedItinerary ? 'Open Saved Itinerary' : 'Generate Itinerary'}
                    </Button>
                    <Button
                        onClick={onViewItinerary}
                        size="lg"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        disabled={!hasSavedItinerary || !tripProfile}
                    >
                        View
                    </Button>
                </div>
                {isGeneratingItinerary && (
                    <div className="grid md:grid-cols-3 gap-3">
                        {[0, 1, 2].map((item) => (
                            <div key={item} className="rounded-xl border border-neutral-200 p-4 animate-pulse">
                                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
                                <div className="h-3 bg-neutral-100 rounded w-full mb-2"></div>
                                <div className="h-3 bg-neutral-100 rounded w-4/5"></div>
                            </div>
                        ))}
                    </div>
                )}
                {generateError && (
                    <p className="text-sm text-red-600">
                        {generateError}
                    </p>
                )}
            </div>

            {/* Developer Preview */}
            {tripProfile && (
                <div className="border-2 border-neutral-200 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowJSON(!showJSON)}
                        className="w-full p-4 bg-neutral-100 flex items-center justify-between hover:bg-neutral-200 transition-colors"
                    >
                        <span className="font-medium text-neutral-700">Developer Preview (JSON)</span>
                        {showJSON ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {showJSON && (
                        <pre className="p-4 bg-neutral-900 text-green-400 text-xs overflow-x-auto">
                            {JSON.stringify(tripProfile, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};
