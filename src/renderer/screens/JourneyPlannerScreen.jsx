import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getTrueDate } from '../utils/timeUtils';
import { ChevronLeft, Loader2, Sparkles, X, ArrowRight, Flag, Compass, Repeat } from 'lucide-react';
import { useJourneyStore } from '../store/journeyStore';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useSettingsStore } from '../store/settingsStore';
const GLOBAL_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
export default function JourneyPlannerScreen({ onBack, onComplete, initialPrompt }) {
    const { currentProfile } = useProfileStore();
    const { addJourney } = useJourneyStore();
    const { addHabit } = useHabitStore();
    const { settings } = useSettingsStore();
    const [prompt, setPrompt] = useState(initialPrompt);
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const generatePlan = async (goal) => {
        if (!goal.trim())
            return;
        setLoading(true);
        try {
            const apiKey = (settings === null || settings === void 0 ? void 0 : settings.groqApiKey) || GLOBAL_GROQ_KEY;
            if (!apiKey) {
                throw new Error('No API Key configured. Please add your Groq API key in Settings.');
            }
            const systemPrompt = `You are Habbify's AI Journey Planner. Your job is to take a user's goal and break it down into a highly actionable roadmap.
You MUST respond strictly in the following JSON format without any markdown blocks or conversational text.
{
"title":"A short, catchy title for the journey (e.g., The NVIDIA Path)",
"description":"A 1-2 sentence motivating summary.",
"milestones": [
 {"title":"Milestone name","description":"Details","estimatedDays": 14}
 ],
"habits": [
 { 
"name":"A specific daily or weekly action (e.g., Solve 2 LeetCode problems)", 
"frequency":"daily",
"icon":"A single representative emoji (e.g., 💻)",
"color":"A hex color code that fits the theme (e.g., #3b82f6)"
}
 ]
}`;
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `My goal is: ${goal}` }
                    ],
                    temperature: 0.7,
                })
            });
            if (!response.ok) {
                throw new Error('Failed to generate plan from AI');
            }
            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            // Parse JSON, handling potential markdown wrappers
            let jsonStr = assistantMessage;
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
            }
            const generatedPlan = JSON.parse(jsonStr);
            setPlan(generatedPlan);
            toast.success('Journey roadmap generated successfully!');
        }
        catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to generate plan.');
        }
        finally {
            setLoading(false);
        }
    };
    // Generate on mount if initial prompt exists
    useEffect(() => {
        if (initialPrompt && !plan && !loading) {
            generatePlan(initialPrompt);
        }
    }, []);
    const handleConfirm = () => {
        if (!plan || !currentProfile)
            return;
        const journeyId = uuidv4();
        // 1. Create the Journey Milestones
        const newMilestones = plan.milestones.map(m => ({
            id: uuidv4(),
            title: m.title,
            description: m.description,
            completed: false,
            estimatedDays: m.estimatedDays
        }));
        // 2. Inject Habits into HabitStore
        const linkedHabitIds = [];
        plan.habits.forEach(h => {
            const habitId = uuidv4();
            linkedHabitIds.push(habitId);
            addHabit({
                id: habitId,
                profileId: currentProfile.id,
                name: h.name,
                category: 'Learning',
                color: h.color || '#8b5cf6',
                icon: h.icon || '✨',
                difficulty: 'medium',
                frequency: h.frequency === 'daily' ? 'daily' : 'weekly',
                priority: 'high',
                currentStreak: 0,
                longestStreak: 0,
                totalCompletions: 0,
                checkIns: [],
                createdAt: getTrueDate().toISOString(),
                updatedAt: getTrueDate().toISOString(),
                isActive: true,
                isArchived: false,
                journeyId: journeyId
            }); // Use 'as any' or update interface properly (we added journeyId)
        });
        // 3. Create and Save the Journey
        const newJourney = {
            id: journeyId,
            profileId: currentProfile.id,
            title: plan.title,
            description: plan.description,
            milestones: newMilestones,
            linkedHabits: linkedHabitIds,
            status: 'active',
            createdAt: getTrueDate().toISOString(),
            updatedAt: getTrueDate().toISOString()
        };
        addJourney(newJourney);
        toast.success(`Journey"${plan.title}" launched! Habits added.`);
        onComplete(); // Navigate to dashboard
    };
    const handleRemoveHabit = (index) => {
        if (!plan)
            return;
        const newHabits = [...plan.habits];
        newHabits.splice(index, 1);
        setPlan({ ...plan, habits: newHabits });
    };
    const handleRemoveMilestone = (index) => {
        if (!plan)
            return;
        const newMilestones = [...plan.milestones];
        newMilestones.splice(index, 1);
        setPlan({ ...plan, milestones: newMilestones });
    };
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900", children: [_jsxs("div", { className: "flex items-center gap-4 p-6 border-b border-slate-700/50", children: [_jsx("button", { onClick: onBack, className: "p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(ChevronLeft, { size: 24, className: "text-slate-400" }) }), _jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [_jsx(Compass, { className: "text-purple-400" }), "AI Journey Planner"] })] }), _jsx("div", { className: "flex-1 overflow-auto p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex gap-3", children: [_jsx("input", { type: "text", value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: "What do you want to achieve?", className: "flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none px-2", onKeyDown: (e) => e.key === 'Enter' && generatePlan(prompt) }), _jsxs("button", { onClick: () => generatePlan(prompt), disabled: loading || !prompt.trim(), className: "bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [loading ? _jsx(Loader2, { size: 20, className: "animate-spin" }) : _jsx(Sparkles, { size: 20 }), loading ? 'Thinking...' : 'Generate'] })] }), plan && !loading && (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-2xl shadow-lg text-white", children: [_jsx("h2", { className: "text-3xl font-bold mb-2", children: plan.title }), _jsx("p", { className: "text-slate-300 text-lg", children: plan.description })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("h3", { className: "text-xl font-semibold text-white flex items-center gap-2", children: [_jsx(Flag, { className: "text-blue-400" }), "Roadmap & Milestones"] }), _jsx("div", { className: "space-y-3", children: plan.milestones.map((m, idx) => (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 relative group", children: [_jsx("button", { onClick: () => handleRemoveMilestone(idx), className: "absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(X, { size: 16 }) }), _jsx("h4", { className: "font-semibold text-white mb-1", children: m.title }), _jsx("p", { className: "text-sm text-slate-400 mb-2", children: m.description }), _jsxs("span", { className: "text-xs font-medium px-2 py-1 bg-slate-700 rounded-full text-slate-300", children: ["~", m.estimatedDays, " days"] })] }, idx))) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h3", { className: "text-xl font-semibold text-white flex items-center gap-2", children: [_jsx(Repeat, { className: "text-green-400" }), "Generated Habits"] }), _jsx("p", { className: "text-sm text-slate-400", children: "These will be injected into your daily tracker." }), _jsx("div", { className: "space-y-3", children: plan.habits.map((h, idx) => (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between group", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center", children: _jsx(Sparkles, { className: "text-purple-400", size: 20 }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-white", children: h.name }), _jsx("span", { className: "text-xs text-slate-400 capitalize", children: h.frequency })] })] }), _jsx("button", { onClick: () => handleRemoveHabit(idx), className: "p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(X, { size: 18 }) })] }, idx))) })] })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 flex items-center justify-between mt-8 sticky bottom-6 shadow-xl", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold mb-1", children: "Ready to start?" }), _jsx("p", { className: "text-sm text-slate-400", children: "This will officially launch your journey and configure your habits." })] }), _jsxs("button", { onClick: handleConfirm, className: "bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: ["Looks Good! ", _jsx(ArrowRight, { size: 20 })] })] })] }))] }) })] }));
}
