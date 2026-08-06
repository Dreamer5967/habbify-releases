import { jsx as _jsx } from "react/jsx-runtime";
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
            return 'bg-slate-800/80';
        if (count === 1)
            return 'bg-green-900/70';
        if (count === 2)
            return 'bg-green-800';
        if (count === 3)
            return 'bg-green-700';
        if (count === 4)
            return 'bg-green-600';
        if (count === 5)
            return 'bg-green-500';
        return 'bg-green-400';
    };
    return (_jsx("div", { className: "p-6 bg-slate-900 dark:bg-slate-900 border border-slate-700/50 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-lg", children: _jsx("div", { className: "w-full overflow-x-auto pb-2 custom-scrollbar", children: _jsx("div", { className: "grid grid-flow-col gap-1 w-max", style: { gridTemplateRows: 'repeat(7, 1fr)', contain: 'content' }, children: grid.map((day) => {
                    const count = (data && data[day.dateStr]) || 0;
                    return (_jsx("div", { title: `${day.dateStr}: ${count} completions`, className: `w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] cursor-pointer hover:ring-2 hover:ring-slate-400 ${getColor(count)}` }, day.dateStr));
                }) }) }) }));
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


