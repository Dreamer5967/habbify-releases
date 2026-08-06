import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils';
import { DollarSign, Plus, X, BarChart3 } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { useProfileStore } from '../store/profileStore';
import { useSettingsStore } from '../store/settingsStore';
import ChartCard from '../components/ChartCard';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
const CATEGORY_COLORS = ['#f97316', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#10b981'];
export default function FinanceTrackerScreen({ onBack }) {
    const { entries, addEntry, updateEntry, removeEntry, loadEntries } = useFinanceStore();
    const { currentProfile } = useProfileStore();
    const { settings } = useSettingsStore();
    const currency = (settings === null || settings === void 0 ? void 0 : settings.currencySymbol) || '$';
    const [showForm, setShowForm] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [formData, setFormData] = useState({
        date: getTrueTodayString(),
        amount: '',
        type: 'expense',
        category: '',
        notes: '',
    });
    // Load finance entries for the current profile on mount
    useEffect(() => {
        if (currentProfile) {
            loadEntries(currentProfile.id);
        }
    }, [currentProfile, loadEntries]);
    // ── Statistics ──
    const totalIncome = entries
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = entries
        .filter((e) => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalIncome - Math.abs(totalExpense);
    const transactionCount = entries.length;
    const averageAmount = transactionCount > 0 ? entries.reduce((s, e) => s + e.amount, 0) / transactionCount : 0;
    // Monthly aggregation for bar chart
    const monthlyData = entries.reduce((acc, e) => {
        const month = format(new Date(e.date), 'yyyy-MM');
        const existing = acc.find((d) => d.month === month);
        if (existing) {
            if (e.type === 'income')
                existing.income += e.amount;
            else
                existing.expense += e.amount;
        }
        else {
            acc.push({ month, income: e.type === 'income' ? e.amount : 0, expense: e.type === 'expense' ? e.amount : 0 });
        }
        return acc;
    }, []);
    // Pie chart data
    const pieData = [
        { name: 'Income', value: totalIncome },
        { name: 'Expense', value: Math.abs(totalExpense) },
    ];
    const COLORS = ['#22c55e', '#ef4444'];
    // Category breakdown data (expenses only)
    const categoryData = entries
        .filter((e) => e.type === 'expense')
        .reduce((acc, e) => {
        const cat = e.category || 'Uncategorized';
        const existing = acc.find((d) => d.name === cat);
        if (existing) {
            existing.value += Math.abs(e.amount);
        }
        else {
            acc.push({ name: cat, value: Math.abs(e.amount) });
        }
        return acc;
    }, []);
    const handleAddEntry = () => {
        if (!formData.amount || isNaN(Number(formData.amount)))
            return;
        const now = getTrueDate().toISOString();
        const newEntry = {
            id: crypto.randomUUID(),
            profileId: (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.id) || '',
            date: formData.date,
            amount: Number(formData.amount),
            type: formData.type,
            category: formData.category || undefined,
            notes: formData.notes || undefined,
            createdAt: now,
            updatedAt: now,
        };
        addEntry(newEntry);
        setFormData({
            date: getTrueTodayString(),
            amount: '',
            type: 'expense',
            category: '',
            notes: '',
        });
        setShowForm(false);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6", children: [_jsxs("header", { className: "flex items-center gap-4 mb-6", children: [_jsx("button", { onClick: onBack, className: "p-2 rounded-2xl hover:bg-slate-700 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(X, { size: 24, className: "text-slate-300" }) }), _jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [_jsx(DollarSign, { size: 24, className: "text-green-400" }), "Finance Tracker"] }), _jsxs("button", { onClick: () => setShowStats(!showStats), className: `ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 ${showStats ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`, children: [_jsx(BarChart3, { size: 20 }), showStats ? 'Hide Stats' : 'Show Stats'] }), _jsxs("button", { onClick: () => setShowForm(true), className: "flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Plus, { size: 20 }), "New Entry"] })] }), showStats && (_jsxs("div", { className: "mb-8 space-y-4 animate-fade-in", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsx(ChartCard, { title: "Total Income", children: _jsxs("p", { className: "text-3xl font-bold text-green-400", children: [currency, totalIncome.toFixed(2)] }) }), _jsx(ChartCard, { title: "Total Expense", children: _jsxs("p", { className: "text-3xl font-bold text-red-400", children: ["-", currency, Math.abs(totalExpense).toFixed(2)] }) }), _jsx(ChartCard, { title: "Net Balance", children: _jsxs("p", { className: `text-3xl font-bold ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [netBalance < 0 ? '-' : '', currency, Math.abs(netBalance).toFixed(2)] }) }), _jsx(ChartCard, { title: "Average Transaction", children: _jsxs("p", { className: "text-xl font-medium text-white", children: [currency, averageAmount.toFixed(2), " ", _jsxs("span", { className: "text-sm text-slate-400", children: ["(", transactionCount, " entries)"] })] }) })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [_jsx(ChartCard, { title: "Monthly Income vs Expense", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: monthlyData, margin: { top: 20, right: 30, left: 0, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#555" }), _jsx(XAxis, { dataKey: "month", stroke: "#ffffff" }), _jsx(YAxis, { stroke: "#ffffff" }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 } }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "income", fill: "#22c55e", name: "Income", radius: [4, 4, 0, 0] }), _jsx(Bar, { dataKey: "expense", fill: "#ef4444", name: "Expense", radius: [4, 4, 0, 0] })] }) }) }), _jsx(ChartCard, { title: "Income vs Expense Proportion", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 90, label: true, children: pieData.map((_entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 } }), _jsx(Legend, {})] }) }) }), _jsx(ChartCard, { title: "Spending by Category", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: categoryData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 90, label: true, children: categoryData.map((_entry, index) => (_jsx(Cell, { fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }, `cat-cell-${index}`))) }), _jsx(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 } }), _jsx(Legend, {})] }) }) })] })] })), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [entries.length === 0 && (_jsx("div", { className: "col-span-full flex flex-col items-center justify-center py-16 text-center", children: _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 max-w-md", children: [_jsx(DollarSign, { size: 48, className: "text-green-400 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "No transactions yet" }), _jsx("p", { className: "text-slate-400 mb-6", children: "Add your first income or expense to start tracking!" }), _jsxs("button", { onClick: () => setShowForm(true), className: "flex items-center gap-2 mx-auto bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Plus, { size: 20 }), "Add Transaction"] })] }) })), entries.map((entry) => (_jsxs("div", { className: "group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h2", { className: "text-lg font-semibold text-white", children: entry.type === 'income' ? '💰 Income' : '🧾 Expense' }), _jsx("button", { onClick: () => { if (window.confirm('Delete this transaction?'))
                                            removeEntry(entry.id); }, className: "p-1 text-slate-400 hover:text-red-400 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(X, { size: 18 }) })] }), _jsxs("p", { className: "text-slate-400 text-sm mb-1", children: ["Date: ", entry.date] }), _jsxs("p", { className: "text-slate-400 text-sm mb-1", children: ["Amount: ", entry.type === 'expense' ? '-' : '+', currency, entry.amount.toFixed(2)] }), entry.category && (_jsxs("p", { className: "text-slate-400 text-sm mb-1", children: ["Category: ", entry.category] })), entry.notes && (_jsxs("p", { className: "text-slate-400 text-sm mb-1", children: ["Notes: ", entry.notes] }))] }, entry.id)))] }), showForm && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 w-full max-w-md", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Add New Finance Entry" }), _jsx("label", { className: "block text-slate-300 mb-1", children: "Date" }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => setFormData({ ...formData, date: e.target.value }), className: "w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsx("label", { className: "block text-slate-300 mb-1", children: "Amount" }), _jsx("input", { type: "number", step: "0.01", value: formData.amount, onChange: (e) => setFormData({ ...formData, amount: Number(e.target.value) }), className: "w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsx("label", { className: "block text-slate-300 mb-1", children: "Type" }), _jsxs("select", { value: formData.type, onChange: (e) => setFormData({ ...formData, type: e.target.value }), className: "w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white", children: [_jsx("option", { value: "expense", children: "Expense" }), _jsx("option", { value: "income", children: "Income" })] }), _jsx("label", { className: "block text-slate-300 mb-1", children: "Category (optional)" }), _jsx("input", { type: "text", placeholder: "e.g., Food, Salary", value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsx("label", { className: "block text-slate-300 mb-1", children: "Notes (optional)" }), _jsx("textarea", { placeholder: "Additional details", value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), className: "w-full mb-4 px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none" }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setShowForm(false), className: "px-4 py-2 rounded bg-slate-600 text-slate-200 hover:bg-slate-500 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Cancel" }), _jsx("button", { onClick: handleAddEntry, className: "px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Add Entry" })] })] }) }))] }));
}
