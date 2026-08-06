import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export default function ChartCard({ title, value, icon: Icon, color, children }) {
    // Render compact stat card when value, icon and color are provided
    if (value !== undefined && Icon && color) {
        return (_jsxs("div", { className: "group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]", children: [_jsx("div", { className: `p-3 rounded-2xl ${color} bg-opacity-10 group-`, children: _jsx(Icon, { size: 24, className: `${color.replace('bg-', 'text-')}` }) }), _jsxs("div", { children: [title && _jsx("h2", { className: "text-sm font-medium text-slate-400", children: title }), _jsx("p", { className: "text-2xl font-bold text-white", children: value })] })] }));
    }
    // Generic container for charts or custom JSX
    return (_jsxs("div", { className: "group bg-slate-800/50 backdrop-blur-sm backdrop-blur-lg border border-slate-700/50 rounded-2xl p-4 animate-fade-in hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]", children: [title && _jsx("h2", { className: "text-lg font-semibold text-white mb-2", children: title }), children] }));
}
