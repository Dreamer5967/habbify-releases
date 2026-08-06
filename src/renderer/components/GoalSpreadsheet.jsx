import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { memo } from 'react';
/**
 * GoalSpreadsheet renders a weekly table (Monday‑Sunday) covering the goal's
 * start and end dates. Each cell is a checkbox representing a daily check‑in.
 * The component is deliberately lightweight – it does not persist data itself;
 * it simply calls`onCheckIn` which updates the goal in the store.
 */
const GoalSpreadsheet = ({ goal, onCheckIn }) => {
    if (!goal.startDate || !goal.endDate) {
        return _jsx("p", { className: "text-slate-400", children: "No start / end date defined." });
    }
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    // Ensure we include the end date
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    // Build an array of all dates within the range
    const dates = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
    }
    // Group dates by week number (ISO week starting Monday)
    const weeks = {};
    dates.forEach((date) => {
        // ISO week number calculation
        const tempDate = new Date(date);
        tempDate.setHours(0, 0, 0, 0);
        // Thursday in current week decides the week number
        tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
        const week1 = new Date(tempDate.getFullYear(), 0, 4);
        const weekNumber = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
        if (!weeks[weekNumber])
            weeks[weekNumber] = [];
        weeks[weekNumber].push(date);
    });
    const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);
    // Helper to format date as YYYY‑MM‑DD (same as ISO input value)
    const formatISO = (d) => d.toISOString().split('T')[0];
    return (_jsx("div", { className: "mt-4 overflow-x-auto", children: _jsxs("table", { className: "min-w-full border border-slate-700/50 bg-slate-800/80 rounded-2xl shadow-lg", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-slate-700/50", children: [_jsx("th", { className: "px-2 py-1 text-xs font-medium text-slate-300", children: "Day" }), weekNumbers.map((wn) => (_jsxs("th", { className: "px-2 py-1 text-xs font-medium text-slate-300", children: ["W", wn] }, wn)))] }) }), _jsx("tbody", { children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (_jsxs("tr", { className: idx % 2 === 0 ? 'bg-slate-800/40' : '', children: [_jsx("td", { className: "px-2 py-1 text-sm font-semibold text-slate-200", children: dayName }), weekNumbers.map((wn) => {
                                var _a, _b;
                                const day = weeks[wn].find((d) => d.getDay() === ((idx + 1) % 7)); // JS: Sunday=0, Monday=1
                                if (!day) {
                                    return _jsx("td", { className: "px-2 py-1" }, wn);
                                }
                                const iso = formatISO(day);
                                const checked = (_b = (_a = goal.checkIns) === null || _a === void 0 ? void 0 : _a[iso]) !== null && _b !== void 0 ? _b : false;
                                return (_jsx("td", { className: "px-2 py-1 text-center", children: _jsx("input", { type: "checkbox", checked: checked, onChange: (e) => onCheckIn(goal.id, iso, e.target.checked), className: "form-checkbox h-4 w-4 text-indigo-600 bg-slate-700 border-slate-700/50 rounded" }) }, wn));
                            })] }, dayName))) })] }) }));
};
export default memo(GoalSpreadsheet);

