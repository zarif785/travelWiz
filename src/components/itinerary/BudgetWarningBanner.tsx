import React from 'react';
import { Button } from '@/components/ui';

interface BudgetWarningBannerProps {
    overBy: number;
    currency: string;
    isLoading?: boolean;
    onMakeCheaper: () => void;
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

export const BudgetWarningBanner: React.FC<BudgetWarningBannerProps> = ({
    overBy,
    currency,
    isLoading = false,
    onMakeCheaper,
}) => {
    return (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-red-900">
                This plan is over budget by <strong>{formatCurrency(overBy, currency)}</strong>.
            </p>
            <Button size="sm" variant="secondary" onClick={onMakeCheaper} isLoading={isLoading}>
                Make it cheaper
            </Button>
        </div>
    );
};
