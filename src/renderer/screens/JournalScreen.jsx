import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils';
import { ChevronLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { useJournalStore } from '../store/journalStore';
import { useProfileStore } from '../store/profileStore';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
const MOOD_EMOJIS = {
    excellent: '😄',
    good: '😊',
    okay: '😐',
    bad: '😔',
    terrible: '😢',
};
export default function JournalScreen({ onBack }) {
    const { currentProfile } = useProfileStore();
    const { entries, loadEntries, addEntry, updateEntry, deleteEntry, getTodayEntry } = useJournalStore();
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        mood: 'good',
        tags: [],
    });
    const [currentTag, setCurrentTag] = useState('');
    useEffect(() => {
        if (currentProfile) {
            loadEntries(currentProfile.id);
        }
    }, [currentProfile, loadEntries]);
    const todayEntry = currentProfile ? getTodayEntry(currentProfile.id) : null;
    const handleSubmit = () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('Title and content are required');
            return;
        }
        if (!currentProfile)
            return;
        const today = getTrueTodayString();
        if (selectedEntry && (todayEntry === null || todayEntry === void 0 ? void 0 : todayEntry.id) === selectedEntry) {
            // Update existing
            updateEntry(selectedEntry, {
                title: formData.title,
                content: formData.content,
                mood: formData.mood,
                tags: formData.tags,
            });
            toast.success('Journal entry updated!');
        }
        else {
            // Create new
            const newEntry = {
                id: uuidv4(),
                profileId: currentProfile.id,
                date: today,
                title: formData.title,
                content: formData.content,
                mood: formData.mood,
                tags: formData.tags,
                createdAt: getTrueDate().toISOString(),
                updatedAt: getTrueDate().toISOString(),
            };
            addEntry(newEntry);
            useProfileStore.getState().addXP(currentProfile.id, 50);
            toast.success('Journal entry created! +50 XP ⚡');
        }
        setShowForm(false);
        setFormData({ title: '', content: '', mood: 'good', tags: [] });
        setSelectedEntry(null);
    };
    const handleAddTag = () => {
        if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, currentTag.trim()],
            });
            setCurrentTag('');
        }
    };
    const handleRemoveTag = (tag) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(t => t !== tag),
        });
    };
    const handleEdit = () => {
        if (todayEntry) {
            setFormData({
                title: todayEntry.title,
                content: todayEntry.content,
                mood: todayEntry.mood,
                tags: todayEntry.tags,
            });
            setSelectedEntry(todayEntry.id);
            setShowForm(true);
        }
    };
    const handleDelete = () => {
        if (todayEntry) {
            deleteEntry(todayEntry.id);
            toast.success('Journal entry deleted!');
            setShowForm(false);
            setFormData({ title: '', content: '', mood: 'good', tags: [] });
        }
    };
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-slate-700/50", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: onBack, className: "p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(ChevronLeft, { size: 24, className: "text-slate-400" }) }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "My Journal" })] }), _jsxs("button", { onClick: () => {
                            setShowForm(!showForm);
                            if (showForm) {
                                setFormData({ title: '', content: '', mood: 'good', tags: [] });
                                setSelectedEntry(null);
                            }
                        }, className: "p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4", children: [_jsx(Plus, { size: 20 }), "New Entry"] })] }), _jsx("div", { className: "flex-1 overflow-auto p-6", children: showForm ? (_jsxs("div", { className: "max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold text-white mb-4", children: selectedEntry ? 'Edit Entry' : "Today's Entry" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400 block mb-2", children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), placeholder: "Entry title", className: "w-full bg-slate-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400 block mb-2", children: "How are you feeling?" }), _jsx("div", { className: "flex gap-2", children: Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (_jsx("button", { onClick: () => setFormData({ ...formData, mood }), className: `text-3xl p-2 rounded-2xl transition hover:scale-105 active:scale-95 ${formData.mood === mood
                                            ? 'bg-blue-600 ring-2 ring-blue-400'
                                            : 'hover:bg-slate-700'}`, title: mood, children: emoji }, mood))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400 block mb-2", children: "Content *" }), _jsx("textarea", { value: formData.content, onChange: (e) => setFormData({ ...formData, content: e.target.value }), placeholder: "What's on your mind?", rows: 6, className: "w-full bg-slate-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400 block mb-2", children: "Tags" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "text", value: currentTag, onChange: (e) => setCurrentTag(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleAddTag(), placeholder: "Add a tag...", className: "flex-1 bg-slate-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("button", { onClick: handleAddTag, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Add" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: formData.tags.map(tag => (_jsxs("span", { className: "bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm flex items-center gap-2", children: [tag, _jsx("button", { onClick: () => handleRemoveTag(tag), className: "text-slate-400 hover:text-red-400", children: "\u00D7" })] }, tag))) })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx("button", { onClick: handleSubmit, className: "flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Save Entry" }), _jsx("button", { onClick: () => {
                                        setShowForm(false);
                                        setFormData({ title: '', content: '', mood: 'good', tags: [] });
                                        setSelectedEntry(null);
                                    }, className: "flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Cancel" })] })] })) : (_jsx("div", { className: "max-w-2xl mx-auto", children: todayEntry ? (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-4", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: todayEntry.title }), _jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("span", { className: "text-2xl", children: MOOD_EMOJIS[todayEntry.mood] }), _jsx("span", { className: "text-sm text-slate-400", children: new Date(todayEntry.date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        }) })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleEdit, className: "p-2 hover:bg-slate-700 rounded transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(Edit2, { size: 20, className: "text-blue-400" }) }), _jsx("button", { onClick: handleDelete, className: "p-2 hover:bg-slate-700 rounded transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(Trash2, { size: 20, className: "text-red-400" }) })] })] }), _jsx("div", { className: "prose prose-invert max-w-none", children: _jsx("p", { className: "text-slate-300 whitespace-pre-wrap", children: todayEntry.content }) }), todayEntry.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 pt-4 border-t border-slate-700/50", children: todayEntry.tags.map(tag => (_jsxs("span", { className: "bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm", children: ["#", tag] }, tag))) }))] })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-5xl mb-4", children: "\uD83D\uDCDD" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "No entry for today" }), _jsx("p", { className: "text-slate-400 mb-6", children: "Start your day by reflecting in your journal" }), _jsx("button", { onClick: () => setShowForm(true), className: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Create First Entry" })] })) })) })] }));
}
