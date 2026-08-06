import React, { useMemo, memo } from 'react';
import { getTrueDate } from '../utils/timeUtils';

function HeatmapGrid({ data }) {
    const grid = useMemo(() => {
        const days = [];
        const endDate = getTrueDate();
        endDate.setHours(0, 0, 0, 0);
        // Start approx 52 weeks ago
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 364);
        // Adjust start date to the previous Sunday to ensure 7 rows align correctly (Sun-Sat)
        const startDay = startDate.getDay();
        startDate.setDate(startDate.getDate() - startDay);
        const iterDate = new Date(startDate);
        while (iterDate <= endDate) {
            const year = iterDate.getFullYear();
            const month = String(iterDate.getMonth() + 1).padStart(2, '0');
            const day = String(iterDate.getDate()).padStart(2, '0');
            days.push({
                dateStr: `${year}-${month}-${day}`,
                date: new Date(iterDate),
            });
            iterDate.setDate(iterDate.getDate() + 1);
        }
        return days;
    }, []);

    const getColor = (count) => {
        if (count === 0)
            return 'bg-[color-mix(in_srgb,var(--color-surface)_80%,var(--color-border))] border border-[var(--color-border)]/50';
        if (count === 1)
            return 'bg-emerald-500/30 border border-emerald-500/50';
        if (count === 2)
            return 'bg-emerald-500/50';
        if (count === 3)
            return 'bg-emerald-500/75';
        if (count === 4)
            return 'bg-emerald-500';
        return 'bg-emerald-400 font-bold';
    };

    return (
        <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-lg">
            <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                <div className="grid grid-flow-col gap-1 w-max" style={{ gridTemplateRows: 'repeat(7, 1fr)', contain: 'content' }}>
                    {grid.map((day) => {
                        const count = (data && data[day.dateStr]) || 0;
                        return (
                            <div
                                key={day.dateStr}
                                title={`${day.dateStr}: ${count} completions`}
                                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] cursor-pointer hover:ring-2 hover:ring-[var(--color-primary)] transition-all ${getColor(count)}`}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const arePropsEqual = (prevProps, nextProps) => {
    if (prevProps.data === nextProps.data) return true;
    const prev = prevProps.data || {};
    const next = nextProps.data || {};
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    if (prevKeys.length !== nextKeys.length) return false;
    for (let i = 0; i < prevKeys.length; i++) {
        const key = prevKeys[i];
        if (prev[key] !== next[key]) return false;
    }
    return true;
};

export default memo(HeatmapGrid, arePropsEqual);
