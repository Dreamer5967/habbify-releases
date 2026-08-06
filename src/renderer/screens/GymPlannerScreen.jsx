import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Dumbbell, Trash2, Send, Bot, Sparkles, User, Settings as SettingsIcon, Check, Activity, TrendingUp, Utensils } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { useGymStore } from '../store/gymStore';
import { useSettingsStore } from '../store/settingsStore';
import { toast } from 'sonner';

const GLOBAL_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export default function GymPlannerScreen({ onBack, onNavigateSettings }) {
    const { currentProfile } = useProfileStore();
    const { plan, loadPlan, addDay, removeDay, updateDayDescription, addExercise, removeExercise, updateExercise, toggleExerciseCompletion, setFullPlan } = useGymStore();
    const { settings, updateSettings } = useSettingsStore();

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm your AI Fitness Coach. I can help you build a personalized weekly gym split & custom diet plan tailored to your routine. Tell me your goals (e.g. 'Create a 4-day workout & high-protein diet plan')."
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (currentProfile) {
            loadPlan(currentProfile.id);
        }
    }, [currentProfile, loadPlan]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleAddExercise = (dayId) => {
        addExercise(dayId, { name: 'New Exercise', sets: '3', reps: '10', weight: 'BW' });
    };

    const callGroqAPI = async (messages, apiKey) => {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages,
                temperature: 0.7,
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        return response.json();
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userKey = settings?.groqApiKey;
        const freeCalls = settings?.freeAiCallsRemaining || 0;

        if (!userKey && freeCalls <= 0) {
            toast.error('Free AI calls exhausted. Please configure your own Groq API key in Settings.');
            return;
        }

        const newUserMsg = { role: 'user', content: inputMessage };
        const updatedMessages = [...messages, newUserMsg];
        setMessages(updatedMessages);
        setInputMessage('');
        setIsTyping(true);

        const systemPrompt = {
            role: 'system',
            content: `You are an expert fitness coach AI integrated into a gym planner app.
Help the user with gym & nutrition advice.
IMPORTANT: If the user explicitly asks you to create, generate, or update their gym plan schedule (or include a diet guide), you MUST output a JSON block wrapped in \`\`\`json ... \`\`\` containing days and an optional dietGuide.
Format:
{
  "dietGuide": {
    "title": "Custom Nutrition & Protein Plan",
    "proteinText": "Aim for 1.8g protein per kg of body weight.",
    "recoveryText": "3-4L water daily with pre-workout carbs."
  },
  "days": [
    {"dayName":"Day 1 - Push","description":"Focus on chest and triceps","exercises": [ {"name":"Bench Press","sets":"3","reps":"8-10","weight":"135 lbs"} ]}
  ]
}
ONLY output JSON if the user explicitly asks to generate or update the plan. Otherwise, converse normally.`
        };

        try {
            const apiKey = userKey || GLOBAL_GROQ_KEY;
            if (!apiKey) {
                throw new Error('No API Key configured. Please add it in Settings.');
            }

            const apiMessages = [systemPrompt, ...updatedMessages];
            const response = await callGroqAPI(apiMessages, apiKey);
            const assistantMessage = response.choices[0].message.content;

            setMessages([...updatedMessages, { role: 'assistant', content: assistantMessage }]);

            if (!userKey) {
                updateSettings({ freeAiCallsRemaining: Math.max(0, freeCalls - 1) });
            }

            let jsonStr = '';
            const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonStr = jsonMatch[1];
            } else {
                const firstBrace = assistantMessage.indexOf('{');
                const lastBrace = assistantMessage.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    jsonStr = assistantMessage.slice(firstBrace, lastBrace + 1);
                }
            }

            if (jsonStr) {
                try {
                    const parsedData = JSON.parse(jsonStr);
                    const days = Array.isArray(parsedData) ? parsedData : parsedData.days;
                    const dietGuide = parsedData.dietGuide || undefined;
                    if (Array.isArray(days) && days.length > 0) {
                        setFullPlan(days, dietGuide);
                        toast.success('Gym plan & routine successfully updated by AI!');
                    }
                } catch (e) {
                    console.error("Failed to parse AI JSON plan", e);
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to connect to AI coach.');
            setMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please configure your personal Groq API key in Settings.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!plan) return <div className="h-full bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

    const totalExercises = plan.days.reduce((acc, d) => acc + d.exercises.length, 0);
    const completedExercises = plan.days.reduce((acc, d) => acc + d.exercises.filter(e => e.completed).length, 0);
    const progressPercent = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    const strengthExercises = plan.days.flatMap(d => d.exercises).filter(e => {
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

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95">
                        <ChevronLeft size={24} className="text-slate-400" />
                    </button>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Dumbbell className="text-blue-400" /> Gym Planner
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={addDay} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95">
                        <Plus size={20} /> Add Day
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Stats Widgets */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <TrendingUp size={16} className="text-blue-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Overall Progress</span>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-2xl font-bold text-white">{progressPercent}%</span>
                                        <span className="text-xs text-slate-500">{completedExercises}/{totalExercises}</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Dumbbell size={16} className="text-purple-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Strength Focus</span>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-2xl font-bold text-white">{strengthPercent}%</span>
                                        <span className="text-xs text-slate-500">{completedStrength}/{strengthExercises.length}</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                                        <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${strengthPercent}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Activity size={16} className="text-emerald-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Endurance Focus</span>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-2xl font-bold text-white">{endurancePercent}%</span>
                                        <span className="text-xs text-slate-500">{completedEndurance}/{enduranceExercises.length}</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${endurancePercent}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Custom Per-User Diet Plan Guide (Only rendered IF generated for user) */}
                        {plan.dietGuide && (
                            <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30 rounded-2xl p-5 mb-6 animate-fade-in">
                                <div className="flex items-center gap-2 mb-3">
                                    <Utensils className="text-orange-400" size={20} />
                                    <h3 className="text-lg font-bold text-orange-400">{plan.dietGuide.title || 'Personalized Diet & Nutrition Guide'}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-700/50">
                                        <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-1">Protein & Macronutrients</h4>
                                        <p className="text-xs text-slate-300">{plan.dietGuide.proteinText}</p>
                                    </div>
                                    <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-700/50">
                                        <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-1">Hydration & Recovery</h4>
                                        <p className="text-xs text-slate-300">{plan.dietGuide.recoveryText}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Days List */}
                        {plan.days.length === 0 && (
                            <div className="text-center py-12 text-slate-400 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 border-dashed">
                                <Dumbbell size={48} className="mx-auto mb-4 text-slate-600" />
                                <p className="text-lg">No days in your gym plan.</p>
                                <p className="text-sm text-slate-500">Click "Add Day" or ask the AI Coach to create your workout routine.</p>
                            </div>
                        )}

                        {plan.days.map((day) => (
                            <div key={day.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-lg relative group">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">{day.dayName}</h3>
                                    <button onClick={() => removeDay(day.id)} className="text-slate-500 hover:text-red-400 transition hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <label className="text-xs text-slate-400 uppercase font-semibold">Common Description / Focus</label>
                                    <textarea
                                        value={day.description}
                                        onChange={(e) => updateDayDescription(day.id, e.target.value)}
                                        placeholder="E.g., Focus on slow eccentrics..."
                                        className="w-full mt-1 bg-slate-700/50 text-white rounded p-2 text-sm border border-slate-700/50 focus:border-blue-500 focus:outline-none resize-none h-16"
                                    />
                                </div>

                                <div className="space-y-3">
                                    {day.exercises.map((ex) => (
                                        <div key={ex.id} className={`flex items-center gap-2 p-2 rounded-2xl border transition hover:scale-105 active:scale-95 ${ex.completed ? 'bg-slate-800/50 backdrop-blur-sm border-slate-700/50 opacity-70' : 'bg-slate-700/30 border-slate-700/50'}`}>
                                            <button
                                                onClick={() => toggleExerciseCompletion(day.id, ex.id, !ex.completed)}
                                                className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition hover:scale-105 active:scale-95 ${ex.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-700/50 hover:border-slate-400 text-transparent'}`}
                                            >
                                                <Check size={14} className={ex.completed ? 'opacity-100' : 'opacity-0'} />
                                            </button>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={ex.name}
                                                    onChange={(e) => updateExercise(day.id, ex.id, { name: e.target.value })}
                                                    className={`w-full bg-transparent font-medium focus:outline-none focus:bg-slate-700 px-2 py-1 rounded ${ex.completed ? 'text-slate-400 line-through' : 'text-white'}`}
                                                    placeholder="Exercise name"
                                                />
                                            </div>
                                            <div className="w-16">
                                                <input
                                                    type="text"
                                                    value={ex.sets}
                                                    onChange={(e) => updateExercise(day.id, ex.id, { sets: e.target.value })}
                                                    className="w-full bg-slate-700 text-center text-slate-300 text-sm focus:outline-none px-1 py-1 rounded"
                                                    placeholder="Sets"
                                                />
                                            </div>
                                            <span className="text-slate-500 text-xs">x</span>
                                            <div className="w-16">
                                                <input
                                                    type="text"
                                                    value={ex.reps}
                                                    onChange={(e) => updateExercise(day.id, ex.id, { reps: e.target.value })}
                                                    className="w-full bg-slate-700 text-center text-slate-300 text-sm focus:outline-none px-1 py-1 rounded"
                                                    placeholder="Reps"
                                                />
                                            </div>
                                            <div className="w-20 ml-2">
                                                <input
                                                    type="text"
                                                    value={ex.weight}
                                                    onChange={(e) => updateExercise(day.id, ex.id, { weight: e.target.value })}
                                                    className="w-full bg-slate-700 text-center text-emerald-400 text-sm focus:outline-none px-1 py-1 rounded"
                                                    placeholder="Weight"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeExercise(day.id, ex.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 transition hover:scale-105 active:scale-95 hover:bg-slate-700 rounded ml-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleAddExercise(day.id)}
                                        className="w-full py-2 border border-dashed border-slate-700/50 text-slate-400 rounded-2xl hover:border-blue-500 hover:text-blue-400 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Plus size={16} /> Add Exercise
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar AI Coach */}
                <div className="w-96 border-l border-slate-700/50 bg-slate-800/50 backdrop-blur-sm flex flex-col">
                    <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-purple-400" size={20} />
                            <h2 className="font-semibold text-white">AI Coach</h2>
                        </div>
                        {!settings?.groqApiKey && (
                            <div
                                className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-slate-700 transition flex items-center gap-1 ${
                                    (settings?.freeAiCallsRemaining || 0) === 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                }`}
                                onClick={onNavigateSettings}
                                title="Free calls remaining. Click to configure API Key."
                            >
                                {settings?.freeAiCallsRemaining || 0} left
                                <SettingsIcon size={12} />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                                    {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                                </div>
                                <div
                                    className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                                        msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-200 rounded-tl-none'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                    <Bot size={16} className="text-white" />
                                </div>
                                <div className="p-3 bg-slate-700 rounded-2xl rounded-tl-none flex items-center gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50">
                        <div className="relative flex items-end gap-2">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Ask about a workout or tell me to generate a split..."
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none resize-none custom-scrollbar"
                                rows={2}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isTyping || !inputMessage.trim()}
                                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
