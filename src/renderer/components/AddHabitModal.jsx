import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { getTrueDate } from '../utils/timeUtils';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
const COLORS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Rose', value: '#f43f5e' },
];
export default function AddHabitModal({ isOpen, onClose }) {
    const { addHabit } = useHabitStore();
    const { currentProfile } = useProfileStore();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '🎯',
        category: 'Health',
        difficulty: 'medium',
        frequency: 'daily',
        priority: 'medium',
        color: '#3b82f6',
        reminderTime: '',
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !currentProfile) {
            return;
        }
        const newHabit = {
            id: uuidv4(),
            profileId: currentProfile.id,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            category: formData.category,
            difficulty: formData.difficulty,
            frequency: formData.frequency,
            priority: formData.priority,
            currentStreak: 0,
            longestStreak: 0,
            totalCompletions: 0,
            isActive: true,
            isArchived: false,
            reminderTime: formData.reminderTime || undefined,
            createdAt: getTrueDate().toISOString(),
            updatedAt: getTrueDate().toISOString(),
        };
        addHabit(newHabit);
        setFormData({
            name: '',
            description: '',
            icon: '🎯',
            category: 'Health',
            difficulty: 'medium',
            frequency: 'daily',
            priority: 'medium',
            color: '#3b82f6',
            reminderTime: '',
        });
        onClose();
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md border border-slate-700/50 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Create New Habit" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx("div", { className: "w-full h-24 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-4xl", style: {
                                borderColor: formData.color,
                                backgroundColor: `${formData.color}15`,
                                boxShadow: `0 0 20px ${formData.color}40, inset 0 0 20px ${formData.color}20`,
                            }, children: formData.icon }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Habit Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: "e.g., Morning Exercise", className: "w-full bg-slate-700 border border-slate-700/50 rounded-2xl px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: "Optional description", className: "w-full bg-slate-700 border border-slate-700/50 rounded-2xl px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Icon" }), _jsx("input", { type: "text", value: formData.icon, onChange: (e) => setFormData({ ...formData, icon: e.target.value }), maxLength: 2, className: "w-full bg-slate-700 border border-slate-700/50 rounded-2xl px-4 py-2 text-white text-2xl focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-3", children: "Color" }), _jsx("div", { className: "grid grid-cols-5 gap-2", children: COLORS.map((color) => (_jsx("button", { type: "button", onClick: () => setFormData({ ...formData, color: color.value }), className: `w-10 h-10 rounded-2xl transition hover:scale-105 active:scale-95 border-2 ${formData.color === color.value
                                            ? 'border-white scale-110'
                                            : 'border-slate-700/50 hover:border-slate-700/50'}`, style: {
                                            backgroundColor: color.value,
                                            boxShadow: formData.color === color.value
                                                ? `0 0 15px ${color.value}80, inset 0 0 10px ${color.value}40`
                                                : 'none',
                                        }, title: color.name }, color.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Category" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full bg-slate-700 border border-slate-700/50 rounded-2xl px-4 py-2 text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { children: "Health" }), _jsx("option", { children: "Fitness" }), _jsx("option", { children: "Learning" }), _jsx("option", { children: "Productivity" }), _jsx("option", { children: "Mindfulness" }), _jsx("option", { children: "Other" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Difficulty" }), _jsxs("select", { value: formData.difficulty, onChange: (e) => setFormData({ ...formData, difficulty: e.target.value }), className: "w-full bg-slate-700 border border-slate-700/50 rounded-2xl px-4 py-2 text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "easy", children: "Easy" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "hard", children: "Hard" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Reminder Time (Optional)" }), _jsx("input", { type: "time", value: formData.reminderTime, onChange: (e) => setFormData({ ...formData, reminderTime: e.target.value }), className: "w-full bg-slate-700 border border-slate-700/50 rounded-2xl px-4 py-2 text-white focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 bg-slate-700 text-white px-4 py-2 rounded-2xl hover:bg-slate-600 transition hover:scale-105 active:scale-95 font-medium", children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 text-white px-4 py-2 rounded-2xl hover:shadow-lg transition hover:scale-105 active:scale-95 font-medium border-2", style: {
                                        borderColor: formData.color,
                                        backgroundColor: `${formData.color}30`,
                                        boxShadow: `0 0 15px ${formData.color}40`,
                                    }, children: "Create Habit" })] })] })] }) }));
}
