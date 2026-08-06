import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Dumbbell, Trash2, Send, Bot, Sparkles, User, Settings as SettingsIcon, Check, Activity, TrendingUp } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { useGymStore } from '../store/gymStore';
import { useSettingsStore } from '../store/settingsStore';
import { toast } from 'sonner';
const GLOBAL_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
export default function GymPlannerScreen({ onBack, onNavigateSettings }) {
    const { currentProfile } = useProfileStore();
    const { plan, loadPlan, addDay, removeDay, updateDayDescription, addExercise, removeExercise, updateExercise, toggleExerciseCompletion, setFullPlan } = useGymStore();
    const { settings, updateSettings } = useSettingsStore();
    const [messages, setMessages] = useState([{
            role: 'assistant',
            content: "Hi! I'm your AI Fitness Coach. I can help you build a weekly gym plan. Tell me your goals, or instruct me to generate a plan for you (e.g. 'Create a 3-day push/pull/legs split')."
        }]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);
    useEffect(() => {
        if (currentProfile) {
            loadPlan(currentProfile.id);
        }
    }, [currentProfile, loadPlan]);
    useEffect(() => {
        var _a;
        (_a = chatEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleAddExercise = (dayId) => {
        addExercise(dayId, { name: 'New Exercise', sets: '3', reps: '10', weight: 'BW' });
    };
    const callGroqAPI = async (messages, apiKey) => {
        var _a;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant', // updated to current supported model
                messages,
                temperature: 0.7,
            })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.message) || 'API request failed');
        }
        return response.json();
    };
    const handleSendMessage = async () => {
        if (!inputMessage.trim())
            return;
        const userKey = settings === null || settings === void 0 ? void 0 : settings.groqApiKey;
        const freeCalls = (settings === null || settings === void 0 ? void 0 : settings.freeAiCallsRemaining) || 0;
        if (!userKey && freeCalls <= 0) {
            toast.error('Free AI calls exhausted. Please configure your own Groq API key in Settings.');
            return;
        }
        const newUserMsg = { role: 'user', content: inputMessage };
        const updatedMessages = [...messages, newUserMsg];
        setMessages(updatedMessages);
        setInputMessage('');
        setIsTyping(true);
        // Build the payload
        const systemPrompt = {
            role: 'system',
            content: `You are an expert fitness coach AI integrated into a gym planner app.
 Help the user with gym advice.
 IMPORTANT: If the user explicitly asks you to create, generate, or update their gym plan schedule, you MUST output a JSON block wrapped in \`\`\`json ... \`\`\` that contains an array of days with exercises.
 Format: 
 [
 {"dayName":"Day 1 - Push","description":"Focus on chest and triceps","exercises": [ {"name":"Bench Press","sets":"3","reps":"8-10","weight":"135 lbs"} ]}
 ]
 ONLY output JSON if the user explicitly asks to generate or update the plan. Otherwise, converse normally. Do not output JSON for general advice.`
        };
        try {
            // Determine which key to use
            const apiKey = userKey || GLOBAL_GROQ_KEY;
            if (!apiKey) {
                throw new Error('No API Key configured. Please add it in Settings.');
            }
            const apiMessages = [systemPrompt, ...updatedMessages];
            const response = await callGroqAPI(apiMessages, apiKey);
            const assistantMessage = response.choices[0].message.content;
            setMessages([...updatedMessages, { role: 'assistant', content: assistantMessage }]);
            // Decrease free calls if using global key
            if (!userKey) {
                updateSettings({ freeAiCallsRemaining: Math.max(0, freeCalls - 1) });
            }
            // Parse potential JSON plan
            let jsonStr = '';
            const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonStr = jsonMatch[1];
            }
            else {
                const firstBracket = assistantMessage.indexOf('[');
                const lastBracket = assistantMessage.lastIndexOf(']');
                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                    jsonStr = assistantMessage.slice(firstBracket, lastBracket + 1);
                }
            }
            if (jsonStr) {
                try {
                    const parsedPlan = JSON.parse(jsonStr);
                    if (Array.isArray(parsedPlan) && parsedPlan.length > 0) {
                        setFullPlan(parsedPlan);
                        toast.success('Gym plan successfully updated by AI!');
                    }
                }
                catch (e) {
                    console.error("Failed to parse AI JSON plan", e);
                }
            }
        }
        catch (error) {
            toast.error(error.message || 'Failed to connect to AI coach.');
            setMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, I encountered an error. If using the global key, it might be exhausted or invalid. Please configure your personal Groq API key in Settings.' }]);
        }
        finally {
            setIsTyping(false);
        }
    };
    if (!plan)
        return _jsx("div", { className: "h-full bg-slate-900 flex items-center justify-center text-white", children: "Loading..." });
    // Calculate Stats
    const totalExercises = plan.days.reduce((acc, d) => acc + d.exercises.length, 0);
    const completedExercises = plan.days.reduce((acc, d) => acc + d.exercises.filter(e => e.completed).length, 0);
    const progressPercent = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
    const strengthExercises = plan.days.flatMap(d => d.exercises).filter(e => {
        // Parse the first number found in reps string
        const match = e.reps.match(/\d+/);
        const r = match ? parseInt(match[0]) : NaN;
        return !isNaN(r) && r < 8;
    });
    const enduranceExercises = plan.days.flatMap(d => d.exercises).filter(e => {
        const match = e.reps.match(/\d+/);
        const r = match ? parseInt(match[0]) : NaN;
        return !isNaN(r) && r >= 8;
    });
    const completedStrength = strengthExercises.filter(e => e.completed).length;
    const completedEndurance = enduranceExercises.filter(e => e.completed).length;
    const strengthPercent = strengthExercises.length > 0 ? Math.round((completedStrength / strengthExercises.length) * 100) : 0;
    const endurancePercent = enduranceExercises.length > 0 ? Math.round((completedEndurance / enduranceExercises.length) * 100) : 0;
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: onBack, className: "p-2 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(ChevronLeft, { size: 24, className: "text-slate-400" }) }), _jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [_jsx(Dumbbell, { className: "text-blue-400" }), "Gym Planner"] })] }), _jsx("div", { className: "flex gap-3", children: _jsxs("button", { onClick: addDay, className: "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Plus, { size: 20 }), "Add Day"] }) })] }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsx("div", { className: "flex-1 overflow-y-auto p-6 custom-scrollbar", children: _jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-slate-400 mb-2", children: [_jsx(TrendingUp, { size: 16, className: "text-blue-400" }), _jsx("span", { className: "text-sm font-semibold uppercase tracking-wider", children: "Overall Progress" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-end mb-1", children: [_jsxs("span", { className: "text-2xl font-bold text-white", children: [progressPercent, "%"] }), _jsxs("span", { className: "text-xs text-slate-500", children: [completedExercises, "/", totalExercises] })] }), _jsx("div", { className: "w-full bg-slate-700 rounded-full h-1.5", children: _jsx("div", { className: "bg-blue-500 h-1.5 rounded-full transition-all duration-500", style: { width: `${progressPercent}%` } }) })] })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-slate-400 mb-2", children: [_jsx(Dumbbell, { size: 16, className: "text-purple-400" }), _jsx("span", { className: "text-sm font-semibold uppercase tracking-wider", children: "Strength Focus" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-end mb-1", children: [_jsxs("span", { className: "text-2xl font-bold text-white", children: [strengthPercent, "%"] }), _jsxs("span", { className: "text-xs text-slate-500", children: [completedStrength, "/", strengthExercises.length] })] }), _jsx("div", { className: "w-full bg-slate-700 rounded-full h-1.5", children: _jsx("div", { className: "bg-purple-500 h-1.5 rounded-full transition-all duration-500", style: { width: `${strengthPercent}%` } }) })] })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-slate-400 mb-2", children: [_jsx(Activity, { size: 16, className: "text-emerald-400" }), _jsx("span", { className: "text-sm font-semibold uppercase tracking-wider", children: "Endurance Focus" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-end mb-1", children: [_jsxs("span", { className: "text-2xl font-bold text-white", children: [endurancePercent, "%"] }), _jsxs("span", { className: "text-xs text-slate-500", children: [completedEndurance, "/", enduranceExercises.length] })] }), _jsx("div", { className: "w-full bg-slate-700 rounded-full h-1.5", children: _jsx("div", { className: "bg-emerald-500 h-1.5 rounded-full transition-all duration-500", style: { width: `${endurancePercent}%` } }) })] })] })] }), _jsxs("div", { className: "bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-2xl p-5 mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "text-xl", children: "\uD83E\uDD69" }), _jsx("h3", { className: "text-lg font-bold text-orange-400", children: "Weekly Diet & Protein Guide" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-slate-900 rounded-2xl p-3 border border-slate-700/50", children: [_jsx("h4", { className: "text-sm font-semibold text-orange-300 mb-1", children: "Protein Intake" }), _jsxs("p", { className: "text-xs text-slate-300", children: ["Aim for ", _jsx("strong", { className: "text-white", children: "1.6 - 2.2g" }), " per kg of body weight (or 0.7 - 1g per lb) to maximize muscle protein synthesis."] })] }), _jsxs("div", { className: "bg-slate-900 rounded-2xl p-3 border border-slate-700/50", children: [_jsx("h4", { className: "text-sm font-semibold text-orange-300 mb-1", children: "Hydration & Recovery" }), _jsxs("p", { className: "text-xs text-slate-300", children: ["Drink at least ", _jsx("strong", { className: "text-white", children: "3-4 liters" }), " of water daily. Eat a carb + protein meal 1-2 hours pre-workout."] })] })] })] }), plan.days.length === 0 && (_jsxs("div", { className: "text-center py-12 text-slate-400 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 border-dashed", children: [_jsx(Dumbbell, { size: 48, className: "mx-auto mb-4 text-slate-600" }), _jsx("p", { className: "text-lg", children: "No days in your plan." }), _jsx("p", { className: "text-sm", children: "Click\"Add Day\" or ask the AI to generate a plan." })] })), plan.days.map((day, dIdx) => (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-lg relative group", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: day.dayName }), _jsx("button", { onClick: () => removeDay(day.id), className: "text-slate-500 hover:text-red-400 transition hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 p-2", children: _jsx(Trash2, { size: 18 }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "text-xs text-slate-400 uppercase font-semibold", children: "Common Description / Focus" }), _jsx("textarea", { value: day.description, onChange: (e) => updateDayDescription(day.id, e.target.value), placeholder: "E.g., Focus on slow eccentrics...", className: "w-full mt-1 bg-slate-700/50 text-white rounded p-2 text-sm border border-slate-700/50 focus:border-blue-500 focus:outline-none resize-none h-16" })] }), _jsxs("div", { className: "space-y-3", children: [day.exercises.map((ex, eIdx) => (_jsxs("div", { className: `flex items-center gap-2 p-2 rounded-2xl border transition hover:scale-105 active:scale-95 ${ex.completed ? 'bg-slate-800/50 backdrop-blur-sm border-slate-700/50 opacity-70' : 'bg-slate-700/30 border-slate-700/50'}`, children: [_jsx("button", { onClick: () => toggleExerciseCompletion(day.id, ex.id, !ex.completed), className: `w-5 h-5 shrink-0 rounded flex items-center justify-center border transition hover:scale-105 active:scale-95 ${ex.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-700/50 hover:border-slate-400 text-transparent'}`, children: _jsx(Check, { size: 14, className: ex.completed ? 'opacity-100' : 'opacity-0' }) }), _jsx("div", { className: "flex-1", children: _jsx("input", { type: "text", value: ex.name, onChange: (e) => updateExercise(day.id, ex.id, { name: e.target.value }), className: `w-full bg-transparent font-medium focus:outline-none focus:bg-slate-700 px-2 py-1 rounded ${ex.completed ? 'text-slate-400 line-through' : 'text-white'}`, placeholder: "Exercise name" }) }), _jsx("div", { className: "w-16", children: _jsx("input", { type: "text", value: ex.sets, onChange: (e) => updateExercise(day.id, ex.id, { sets: e.target.value }), className: "w-full bg-slate-700 text-center text-slate-300 text-sm focus:outline-none px-1 py-1 rounded", placeholder: "Sets" }) }), _jsx("span", { className: "text-slate-500 text-xs", children: "x" }), _jsx("div", { className: "w-16", children: _jsx("input", { type: "text", value: ex.reps, onChange: (e) => updateExercise(day.id, ex.id, { reps: e.target.value }), className: "w-full bg-slate-700 text-center text-slate-300 text-sm focus:outline-none px-1 py-1 rounded", placeholder: "Reps" }) }), _jsx("div", { className: "w-20 ml-2", children: _jsx("input", { type: "text", value: ex.weight, onChange: (e) => updateExercise(day.id, ex.id, { weight: e.target.value }), className: "w-full bg-slate-700 text-center text-emerald-400 text-sm focus:outline-none px-1 py-1 rounded", placeholder: "Weight" }) }), _jsx("button", { onClick: () => removeExercise(day.id, ex.id), className: "p-1.5 text-slate-500 hover:text-red-400 transition hover:scale-105 active:scale-95 hover:bg-slate-700 rounded ml-1", children: _jsx(Trash2, { size: 16 }) })] }, ex.id))), _jsxs("button", { onClick: () => handleAddExercise(day.id), className: "w-full py-2 border border-dashed border-slate-700/50 text-slate-400 rounded-2xl hover:border-blue-500 hover:text-blue-400 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm", children: [_jsx(Plus, { size: 16 }), " Add Exercise"] })] })] }, day.id)))] }) }), _jsxs("div", { className: "w-96 border-l border-slate-700/50 bg-slate-800/50 backdrop-blur-sm flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sparkles, { className: "text-purple-400", size: 20 }), _jsx("h2", { className: "font-semibold text-white", children: "AI Coach" })] }), (!(settings === null || settings === void 0 ? void 0 : settings.groqApiKey)) && (_jsxs("div", { className: `text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-slate-700 transition hover:scale-105 active:scale-95 flex items-center gap-1 ${((settings === null || settings === void 0 ? void 0 : settings.freeAiCallsRemaining) || 0) === 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`, onClick: onNavigateSettings, title: "Free calls remaining. Click to configure API Key.", children: [(settings === null || settings === void 0 ? void 0 : settings.freeAiCallsRemaining) || 0, " left", _jsx(SettingsIcon, { size: 12 })] }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar", children: [messages.map((msg, idx) => (_jsxs("div", { className: `flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`, children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`, children: msg.role === 'user' ? _jsx(User, { size: 16, className: "text-white" }) : _jsx(Bot, { size: 16, className: "text-white" }) }), _jsx("div", { className: `p-3 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-slate-700 text-slate-200 rounded-tl-none'}`, children: msg.content })] }, idx))), isTyping && (_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0", children: _jsx(Bot, { size: 16, className: "text-white" }) }), _jsxs("div", { className: "p-3 bg-slate-700 rounded-2xl rounded-tl-none flex items-center gap-1", children: [_jsx("div", { className: "w-2 h-2 bg-slate-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-slate-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } }), _jsx("div", { className: "w-2 h-2 bg-slate-400 rounded-full animate-bounce", style: { animationDelay: '0.4s' } })] })] })), _jsx("div", { ref: chatEndRef })] }), _jsxs("div", { className: "p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50", children: [_jsxs("div", { className: "relative flex items-end gap-2", children: [_jsx("textarea", { value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyDown: (e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }, placeholder: "Ask about a workout or tell me to generate a plan...", className: "w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none resize-none custom-scrollbar", rows: 2 }), _jsx("button", { onClick: handleSendMessage, disabled: isTyping || !inputMessage.trim(), className: "p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0", children: _jsx(Send, { size: 18 }) })] }), _jsx("div", { className: "mt-2 text-center", children: _jsx("button", { onClick: onNavigateSettings, className: "text-xs text-slate-500 hover:text-slate-300 underline", children: "Configure your own API Key" }) })] })] })] })] }));
}
