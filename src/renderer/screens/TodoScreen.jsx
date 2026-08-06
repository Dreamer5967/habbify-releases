import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { CheckSquare, Plus, Trash2, Sparkles, ListChecks, Circle, CheckCircle2, X, Bot, Eraser } from 'lucide-react';
import { useTodoStore } from '../store/todoStore';
import { useProfileStore } from '../store/profileStore';
import { useHabitStore } from '../store/habitStore';
import { useSettingsStore } from '../store/settingsStore';
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils';
import { toast } from 'sonner';
export default function TodoScreen({ onBack }) {
    const { todos, addTodo, toggleTodo, removeTodo, clearCompleted, loadTodos } = useTodoStore();
    const { currentProfile } = useProfileStore();
    const { habits } = useHabitStore();
    const { settings, updateSettings } = useSettingsStore();
    const [newTask, setNewTask] = useState('');
    const [aiMessage, setAiMessage] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiBubble, setShowAiBubble] = useState(false);
    const inputRef = useRef(null);
    const today = getTrueTodayString();
    const todayTodos = todos.filter(t => t.date === today);
    const completedCount = todayTodos.filter(t => t.completed).length;
    const totalCount = todayTodos.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    useEffect(() => {
        if (currentProfile) {
            loadTodos(currentProfile.id);
        }
    }, [currentProfile, loadTodos]);
    const handleAddTask = () => {
        var _a;
        if (!newTask.trim() || !currentProfile)
            return;
        const todo = {
            id: crypto.randomUUID(),
            profileId: currentProfile.id,
            text: newTask.trim(),
            completed: false,
            date: today,
            createdAt: getTrueDate().toISOString(),
        };
        addTodo(todo);
        setNewTask('');
        (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    };
    const fetchAiEncouragement = async (taskName, completed, total) => {
        var _a, _b, _c, _d;
        const apiKey = (settings === null || settings === void 0 ? void 0 : settings.groqApiKey) || import.meta.env.VITE_GROQ_API_KEY || '';
        if (!apiKey)
            return;
        setAiLoading(true);
        setShowAiBubble(true);
        try {
            const activeHabits = habits.filter(h => h.isActive && !h.isArchived).length;
            const completedHabits = habits.filter(h => h.lastCompletedDate === today).length;
            const userName = (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.name) ? currentProfile.name.split(' ')[0] : 'Legend';
            const personas = [
                "You are Sparky, an ultra-enthusiastic, hilarious hype-friend and accountability buddy.",
                "You are Blitz, a witty, energetic companion who loves celebrating wins like a stadium announcer.",
                "You are Luna, a warm, hilarious, upbeat best friend who loves seeing their buddy succeed."
            ];
            const randomPersona = personas[Math.floor(Math.random() * personas.length)];
            const systemPrompt = `${randomPersona}
Your mission: Make ${userName} feel insanely hyped, appreciated, and proud after finishing a daily task!

Guidelines:
- Talk like a real, funny, energetic best friend (use natural casual phrasing, exclamations, and fun emojis 🔥⚡️👑).
- NEVER sound like a boring, robotic corporate AI assistant or generic template ("Great job completing task X!").
- Address ${userName} by name naturally!
- Reference what they just accomplished ("${taskName}") with genuine excitement, witty banter, or fun high-fives.
- Keep it punchy: 1 to 2 short sentences max. High energy, super memorable and warm!`;
            const userPrompt = `User: ${userName}
Task Just Finished: "${taskName}"
Today's To-Do Progress: ${completed}/${total} tasks finished!
Habits Progress: ${completedHabits}/${activeHabits} habits completed today.

Give ${userName} an awesome, hilarious, high-energy pep talk for crushing "${taskName}"!`;
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.9,
                    max_tokens: 90,
                })
            });
            if (response.ok) {
                const data = await response.json();
                const message = (_d = (_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim();
                if (message) {
                    setAiMessage(message);
                    // Keep visible for 8 seconds
                    setTimeout(() => {
                        setShowAiBubble(false);
                    }, 8000);
                }
            }
        }
        catch (e) {
            console.error('AI encouragement failed:', e);
        }
        finally {
            setAiLoading(false);
        }
    };
    const handleToggle = (todo) => {
        const wasCompleted = todo.completed;
        toggleTodo(todo.id);
        // Only trigger AI every 2 completed tasks (not every single task)
        if (!wasCompleted) {
            useProfileStore.getState().addXP(25);
            const newCompleted = completedCount + 1;
            if (newCompleted % 2 === 0) {
                fetchAiEncouragement(todo.text, newCompleted, totalCount);
            }
            if (newCompleted === totalCount && totalCount > 1) {
                toast.success('🎉 All tasks completed! Amazing work today!');
            }
        }
    };
    const handleDelete = (id) => {
        removeTodo(id);
    };
    const formatDate = () => {
        const d = getTrueDate();
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };
    return (_jsxs("div", { className: "min-h-screen p-6 md:p-8 max-w-3xl mx-auto animate-fade-in", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 bg-pink-500/20 rounded-xl", children: _jsx(ListChecks, { size: 24, className: "text-pink-400" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Today's Tasks" }), _jsx("p", { className: "text-slate-400 text-sm", children: formatDate() })] })] }), totalCount > 0 && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-2xl font-bold text-white", children: completedCount }), _jsxs("span", { className: "text-slate-400 text-lg", children: ["/", totalCount] })] }), _jsxs("div", { className: "w-12 h-12 relative", children: [_jsxs("svg", { className: "w-12 h-12 -rotate-90", viewBox: "0 0 48 48", children: [_jsx("circle", { cx: "24", cy: "24", r: "20", fill: "none", stroke: "currentColor", strokeWidth: "3", className: "text-slate-700/50" }), _jsx("circle", { cx: "24", cy: "24", r: "20", fill: "none", stroke: "currentColor", strokeWidth: "3", className: "text-sky-400 transition-all duration-700 ease-out", strokeDasharray: `${2 * Math.PI * 20}`, strokeDashoffset: `${2 * Math.PI * 20 * (1 - progress / 100)}`, strokeLinecap: "round" })] }), _jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[10px] font-bold text-sky-300", children: [progress, "%"] })] })] }))] }), totalCount > 0 && (_jsx("div", { className: "mt-4 h-1.5 bg-slate-700/50 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-700 ease-out", style: { width: `${progress}%` } }) }))] }), _jsxs("div", { className: "mb-6 relative group", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-pink-500/35 via-fuchsia-400/25 to-rose-300/25 rounded-full blur-2xl opacity-30 group-hover:opacity-45 transition duration-500 pointer-events-none" }), _jsxs("div", { className: "relative flex items-center gap-3 bg-slate-800/55 backdrop-blur-2xl border border-slate-700/40 rounded-full p-2.5 pl-5 pr-2 shadow-[0_18px_45px_rgba(15,23,42,0.22)] overflow-hidden", children: [_jsx(Plus, { size: 20, className: "text-pink-400 flex-shrink-0" }), _jsx("input", { ref: inputRef, type: "text", value: newTask, onChange: (e) => setNewTask(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleAddTask(), placeholder: "What needs to be done today?", className: "todo-composer-input flex-1 bg-transparent text-white placeholder-slate-400 text-base focus:outline-none" }), _jsxs("button", { onClick: handleAddTask, disabled: !newTask.trim(), className: "bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg text-sm", children: ["Add ", _jsx(CheckSquare, { size: 16 })] })] })] }), todayTodos.length === 0 ? (_jsxs("div", { className: "text-center py-20 animate-fade-in", children: [_jsx("div", { className: "inline-flex items-center justify-center w-20 h-20 bg-pink-500/10 rounded-3xl mb-6", children: _jsx(CheckSquare, { size: 36, className: "text-pink-400/60" }) }), _jsx("h3", { className: "text-xl font-semibold text-slate-300 mb-2", children: "No tasks for today" }), _jsx("p", { className: "text-slate-500 max-w-sm mx-auto", children: "Add your first task above to start planning your day. Stay focused and productive!" })] })) : (_jsx("div", { className: "space-y-2", children: todayTodos.map((todo, index) => (_jsxs("div", { className: `group flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 ${todo.completed
                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                        : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/50'}`, style: { animationDelay: `${index * 50}ms` }, children: [_jsx("button", { onClick: () => handleToggle(todo), className: "flex-shrink-0 transition-all duration-300 hover:scale-110", children: todo.completed ? (_jsx(CheckCircle2, { size: 24, className: "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]" })) : (_jsx(Circle, { size: 24, className: "text-slate-500 hover:text-sky-400" })) }), _jsx("span", { className: `flex-1 text-base transition-all duration-300 ${todo.completed
                                ? 'text-slate-500 line-through'
                                : 'text-white'}`, children: todo.text }), _jsx("button", { onClick: () => handleDelete(todo.id), className: "opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all duration-200 hover:scale-110 p-1", children: _jsx(Trash2, { size: 16 }) })] }, todo.id))) })), completedCount > 0 && (_jsx("div", { className: "mt-6 flex justify-center", children: _jsxs("button", { onClick: clearCompleted, className: "flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors px-4 py-2 rounded-lg hover:bg-slate-800/50", children: [_jsx(Eraser, { size: 14 }), "Clear ", completedCount, " completed ", completedCount === 1 ? 'task' : 'tasks'] }) })), showAiBubble && (_jsx("div", { className: "fixed bottom-8 right-8 max-w-md animate-fade-in z-50", children: _jsxs("div", { className: "relative bg-gradient-to-br from-purple-950/95 via-indigo-950/95 to-slate-900/95 backdrop-blur-2xl border border-purple-500/40 rounded-3xl p-5 shadow-2xl shadow-purple-500/20 group", children: [_jsx("div", { className: "absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500 pointer-events-none" }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowAiBubble(false), className: "absolute -top-1 -right-1 p-1 text-purple-300/60 hover:text-white hover:bg-purple-800/40 rounded-full transition-colors", title: "Dismiss", children: _jsx(X, { size: 16 }) }), _jsxs("div", { className: "flex items-start gap-3.5", children: [_jsxs("div", { className: "relative flex-shrink-0", children: [_jsx("div", { className: "w-11 h-11 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse", children: _jsx(Sparkles, { size: 22, className: "text-white" }) }), _jsx("div", { className: "absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full", title: "Sparky is Online" })] }), _jsxs("div", { className: "flex-1 pr-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200", children: "Sparky \u2022 Hype Companion" }), _jsx("span", { className: "px-1.5 py-0.2 text-[9px] font-extrabold bg-purple-500/30 text-purple-300 rounded-full border border-purple-400/30", children: "AI" })] }), aiLoading ? (_jsxs("div", { className: "flex items-center gap-2 text-purple-300 text-sm py-2", children: [_jsx(Bot, { size: 16, className: "animate-spin text-purple-400" }), _jsx("span", { className: "text-xs italic text-purple-300/80", children: "Cooking up your pep talk..." })] })) : (_jsxs("p", { className: "text-purple-100 text-sm font-medium leading-relaxed drop-shadow-sm", children: ["\"", aiMessage, "\""] }))] })] }), !aiLoading && (_jsxs("div", { className: "mt-3.5 pt-3 border-t border-purple-500/20 flex items-center justify-between gap-2", children: [_jsxs("button", { onClick: () => {
                                                const lastDone = todayTodos.filter(t => t.completed).slice(-1)[0];
                                                fetchAiEncouragement(lastDone ? lastDone.text : 'staying focused', completedCount, totalCount);
                                            }, className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-xs font-semibold transition hover:scale-105 active:scale-95", children: [_jsx(Sparkles, { size: 12, className: "text-amber-400" }), " Hype Me More!"] }), _jsx("button", { onClick: () => {
                                                toast.success("Sparky says: You're welcome! Keep crushing it! 🔥");
                                                setShowAiBubble(false);
                                            }, className: "px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition", children: "\u2764\uFE0F Thanks Sparky!" })] }))] })] }) }))] }));
}
