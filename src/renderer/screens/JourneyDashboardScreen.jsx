import React, { useState } from 'react';
import { ChevronLeft, Compass, Target, CheckCircle2, Circle, Flame, Sparkles, X, ArrowRight } from 'lucide-react';
import { useJourneyStore } from '../store/journeyStore';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function JourneyDashboardScreen({ onBack, onNavigate }) {
    const { journeys, toggleMilestone, removeJourney } = useJourneyStore();
    const { habits, completeHabit, canCompleteHabit } = useHabitStore();
    const { currentProfile } = useProfileStore();

    const [activeTab, setActiveTab] = useState('active');
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');

    const safeJourneys = journeys || [];
    const safeHabits = habits || [];

    const filteredJourneys = safeJourneys.filter(j => j && j.status === activeTab);
    const emptyTitle = `No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Journeys`;

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-slate-700/50">
                <button onClick={onBack} className="p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95">
                    <ChevronLeft size={24} className="text-slate-400" />
                </button>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Target className="text-purple-400" /> Goal Dashboard
                </h1>
                <button
                    onClick={() => setShowAiModal(true)}
                    className="ml-auto flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20 text-sm font-bold"
                >
                    <Sparkles size={18} /> Plan New Journey
                </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 pt-4 border-b border-slate-700/50 gap-6">
                {['active', 'planned', 'completed'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-2 text-sm font-semibold capitalize border-b-2 transition hover:scale-105 active:scale-95 ${
                            activeTab === tab ? 'text-purple-400 border-purple-400' : 'text-slate-400 border-transparent hover:text-white'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {filteredJourneys.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
                        <Compass size={40} className="text-slate-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{emptyTitle}</h2>
                    <p className="text-slate-400 max-w-md text-sm">
                        {activeTab === 'planned'
                            ? "You don't have any planned journeys."
                            : activeTab === 'completed'
                            ? "You haven't completed any journeys yet."
                            : "You haven't launched any AI-planned journeys yet. Click 'Plan New Journey' or head to Home!"}
                    </p>
                    <button onClick={onBack} className="mt-6 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition hover:scale-105 active:scale-95">
                        Go to Home
                    </button>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {filteredJourneys.map(journey => {
                            const milestones = journey.milestones || [];
                            const completedMilestones = milestones.filter(m => m.completed).length;
                            const totalMilestones = milestones.length;
                            const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
                            const linkedHabitsData = safeHabits.filter(h => (journey.linkedHabits || []).includes(h.id));
                            const totalHabitCompletions = linkedHabitsData.reduce((sum, h) => sum + (h.totalCompletions || 0), 0);
                            const highestStreak = linkedHabitsData.length > 0 ? Math.max(...linkedHabitsData.map(h => h.currentStreak || 0)) : 0;
                            const nextMilestone = milestones.find(m => !m.completed);
                            const pieData = [
                                { name: 'Completed', value: completedMilestones },
                                { name: 'Remaining', value: Math.max(0, totalMilestones - completedMilestones) }
                            ];
                            const COLORS = ['#8b5cf6', '#334155'];

                            return (
                                <div key={journey.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                                    {/* Journey Header Card */}
                                    <div className={`p-6 ${journey.status === 'completed' ? 'bg-gradient-to-r from-green-600/80 to-emerald-800/80' : 'bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-800/80'} border-b border-slate-700/50`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-white mb-1">{journey.title}</h2>
                                                <p className="text-purple-200/90 text-sm">{journey.description}</p>
                                            </div>
                                            {journey.status === 'completed' && (
                                                <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle2 size={14} /> Completed
                                                </span>
                                            )}
                                        </div>

                                        {/* CRISP & HIGH CONTRAST STAT BOXES (Readability fixed) */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                                            <div className="bg-slate-900/90 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 shadow-inner">
                                                <div className="text-purple-400 text-[10px] font-extrabold mb-1 uppercase tracking-wider">Progress</div>
                                                <div className="text-2xl font-black text-white">{progress}%</div>
                                            </div>
                                            <div className="bg-slate-900/90 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 shadow-inner">
                                                <div className="text-blue-400 text-[10px] font-extrabold mb-1 uppercase tracking-wider">Milestones</div>
                                                <div className="text-2xl font-black text-white">{completedMilestones} / {totalMilestones}</div>
                                            </div>
                                            <div className="bg-slate-900/90 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 shadow-inner">
                                                <div className="text-emerald-400 text-[10px] font-extrabold mb-1 uppercase tracking-wider">Habit Executions</div>
                                                <div className="text-2xl font-black text-white">{totalHabitCompletions}</div>
                                            </div>
                                            <div className="bg-slate-900/90 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 shadow-inner">
                                                <div className="text-orange-400 text-[10px] font-extrabold mb-1 uppercase tracking-wider">Best Streak</div>
                                                <div className="text-2xl font-black text-white flex items-center gap-1">
                                                    <Flame size={20} className="text-orange-400" /> {highestStreak}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Roadmap & Habits Section */}
                                    <div className="p-6 grid md:grid-cols-2 gap-8">
                                        {/* Milestones */}
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <Target size={20} className="text-blue-400" /> Roadmap Milestones
                                            </h3>
                                            <div className="space-y-3">
                                                {milestones.map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => toggleMilestone(journey.id, m.id)}
                                                        className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border transition hover:scale-105 active:scale-95 ${
                                                            m.completed
                                                                ? 'bg-slate-800/60 border-slate-700/40 opacity-70'
                                                                : 'bg-slate-800 border-slate-700 hover:border-purple-500'
                                                        }`}
                                                    >
                                                        <div className="mt-0.5 shrink-0">
                                                            {m.completed ? (
                                                                <CheckCircle2 className="text-green-400" size={20} />
                                                            ) : (
                                                                <Circle className="text-slate-400" size={20} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className={`font-bold text-sm ${m.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                                                                {m.title}
                                                            </div>
                                                            {m.description && (
                                                                <div className="text-xs text-slate-400 mt-1 leading-relaxed">{m.description}</div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chart & Active Habits */}
                                        <div className="space-y-6">
                                            <div className="bg-slate-800/80 p-4 rounded-2xl flex items-center justify-center border border-slate-700/50">
                                                <div className="w-36 h-36">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={5} dataKey="value" stroke="none">
                                                                {pieData.map((_entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Next Target</div>
                                                    <div className="text-white font-bold text-sm line-clamp-2">
                                                        {nextMilestone ? nextMilestone.title : 'All Milestones Complete! 🎯'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <Sparkles size={20} className="text-purple-400" /> Active Habits
                                                </h3>
                                                {linkedHabitsData.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic">No active habits linked to this journey yet.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {linkedHabitsData.map(habit => {
                                                            const canComplete = canCompleteHabit(habit.id);
                                                            return (
                                                                <div key={habit.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700/50">
                                                                    <div className="text-white font-semibold text-sm">{habit.name}</div>
                                                                    <button
                                                                        onClick={() => canComplete && completeHabit(habit.id)}
                                                                        disabled={!canComplete}
                                                                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                                                                            canComplete
                                                                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow'
                                                                                : 'bg-green-500/20 text-green-300 border border-green-500/30 cursor-default'
                                                                        }`}
                                                                    >
                                                                        {canComplete ? 'Complete' : 'Done ✓'}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Delete this journey? Linked habits will remain intact.')) {
                                                            removeJourney(journey.id);
                                                        }
                                                    }}
                                                    className="text-red-400 hover:text-red-300 text-xs font-bold transition"
                                                >
                                                    Delete Journey
                                                </button>
                                                {journey.status !== 'completed' && (
                                                    <button
                                                        onClick={() => {
                                                            const newStatus = journey.status === 'active' ? 'planned' : 'active';
                                                            useJourneyStore.getState().updateJourney(journey.id, { status: newStatus });
                                                        }}
                                                        className="text-purple-400 hover:text-purple-300 text-xs font-bold transition px-3 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20"
                                                    >
                                                        Move to {journey.status === 'active' ? 'Planned' : 'Active'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* AI Journey Modal */}
            {showAiModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
                    <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="text-purple-400" /> AI Journey Planner
                                </h2>
                                <button onClick={() => setShowAiModal(false)} className="p-1 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-slate-300 mb-4 text-xs">
                                Describe your goal. The AI Coach will break it down into actionable milestones and daily habits.
                            </p>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="e.g., Transform my fitness in 90 days with daily workouts and diet goals..."
                                className="w-full bg-slate-900 text-white rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none border border-slate-700 resize-none min-h-[110px]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && aiPrompt.trim() && onNavigate) {
                                        onNavigate('journeyPlanner', aiPrompt);
                                        setShowAiModal(false);
                                    }
                                }}
                            />
                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => setShowAiModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (aiPrompt.trim() && onNavigate) {
                                            onNavigate('journeyPlanner', aiPrompt);
                                            setShowAiModal(false);
                                        }
                                    }}
                                    disabled={!aiPrompt.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
                                >
                                    Plan it <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
