import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getTrueDate } from '../utils/timeUtils';
import { ChevronLeft, Plus, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { useChallengeStore, CHALLENGE_TEMPLATES } from '../store/challengeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useProfileStore } from '../store/profileStore';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
export default function ChallengesScreen({ onBack }) {
    const { currentProfile } = useProfileStore();
    const { challenges, loadChallenges, createChallenge, getActiveChallenges, getCompletedChallenges, progressChallenge } = useChallengeStore();
    const [selectedTab, setSelectedTab] = useState('active');
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { settings } = useSettingsStore();
    useEffect(() => {
        if (currentProfile) {
            loadChallenges(currentProfile.id);
        }
    }, [currentProfile, loadChallenges]);
    const activeChallenges = currentProfile ? getActiveChallenges(currentProfile.id) : [];
    const completedChallenges = currentProfile ? getCompletedChallenges(currentProfile.id) : [];
    const startChallenge = (template) => {
        if (!currentProfile)
            return;
        const startDate = getTrueDate();
        const endDate = getTrueDate();
        endDate.setDate(endDate.getDate() + template.duration);
        const newChallenge = {
            id: uuidv4(),
            profileId: currentProfile.id,
            name: template.name,
            description: template.description,
            icon: template.icon,
            difficulty: template.difficulty,
            duration: template.duration,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isCompleted: false,
            progress: 0,
            targetValue: template.targetValue,
            reward: template.reward,
            createdAt: getTrueDate().toISOString(),
        };
        createChallenge(newChallenge);
        toast.success(`Challenge"${template.name}" started!`);
        setShowTemplateModal(false);
    };
    const handleProgressChallenge = (id) => {
        progressChallenge(id, 1);
        const challenge = challenges.find(c => c.id === id);
        if (challenge && challenge.progress + 1 >= challenge.targetValue) {
            toast.success(`Challenge completed! +${challenge.reward} XP`);
        }
        else {
            toast.success('Progress updated!');
        }
    };
    const handleGenerateChallenge = async () => {
        if (!aiPrompt.trim())
            return;
        setIsGenerating(true);
        try {
            const apiKey = (settings === null || settings === void 0 ? void 0 : settings.groqApiKey) || import.meta.env.VITE_GROQ_API_KEY || '';
            if (!apiKey) {
                throw new Error('No API Key configured. Please add your Groq API key in Settings.');
            }
            const systemPrompt = `You are Habbify's AI Challenge Generator.
You MUST respond strictly in the following JSON format. Do not use markdown.
{
"name":"Catchy challenge name",
"description":"Short description of what the user must do",
"icon":"Flame",
"difficulty":"Medium",
"duration": 14,
"targetValue": 14,
"reward": 50
}`;
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Generate a challenge for: ${aiPrompt}` }
                    ],
                    temperature: 0.7,
                })
            });
            if (!response.ok)
                throw new Error('Failed to generate from AI');
            const data = await response.json();
            let jsonStr = data.choices[0].message.content;
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
            }
            const template = JSON.parse(jsonStr);
            // Start the generated challenge immediately
            startChallenge(template);
            setAiPrompt('');
            setShowAiModal(false);
        }
        catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to generate challenge');
        }
        finally {
            setIsGenerating(false);
        }
    };
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900", children: [_jsxs("div", { className: "flex items-center gap-4 p-6 border-b border-slate-700/50", children: [_jsx("button", { onClick: onBack, className: "p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(ChevronLeft, { size: 24, className: "text-slate-400" }) }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "Challenges" })] }), _jsxs("div", { className: "flex border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm", children: [_jsxs("button", { onClick: () => setSelectedTab('active'), className: `flex-1 py-4 text-center font-semibold transition hover:scale-105 active:scale-95 ${selectedTab === 'active'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-slate-400 hover:text-white'}`, children: ["Active (", activeChallenges.length, ")"] }), _jsxs("button", { onClick: () => setSelectedTab('completed'), className: `flex-1 py-4 text-center font-semibold transition hover:scale-105 active:scale-95 ${selectedTab === 'completed'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-slate-400 hover:text-white'}`, children: ["Completed (", completedChallenges.length, ")"] }), _jsx("button", { onClick: () => setSelectedTab('browse'), className: `flex-1 py-4 text-center font-semibold transition hover:scale-105 active:scale-95 ${selectedTab === 'browse'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-slate-400 hover:text-white'}`, children: "Browse" })] }), _jsxs("div", { className: "flex-1 overflow-auto p-6", children: [selectedTab === 'active' && (_jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Active Challenges" }), _jsx("div", { className: "flex gap-2", children: _jsxs("button", { onClick: () => setSelectedTab('browse'), className: "flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Plus, { size: 20 }), "Add Challenge"] }) })] }), _jsx("div", { className: "space-y-4", children: activeChallenges.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-slate-400 mb-4", children: "No active challenges yet" }), _jsx("button", { onClick: () => setSelectedTab('browse'), className: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Browse Challenges" })] })) : (activeChallenges.map(challenge => (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start gap-3 flex-1", children: [_jsx("span", { className: "text-3xl", children: challenge.icon }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-white", children: challenge.name }), _jsx("p", { className: "text-sm text-slate-400", children: challenge.description }), _jsxs("div", { className: "text-xs text-slate-500 mt-1", children: ["Difficulty: ", _jsx("span", { className: "capitalize", children: challenge.difficulty })] })] })] }), _jsx("div", { className: "text-right", children: _jsxs("div", { className: "text-sm font-semibold text-yellow-400", children: ["+", challenge.reward, " XP"] }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-slate-400", children: "Progress" }), _jsxs("span", { className: "text-white", children: [challenge.progress, " / ", challenge.targetValue] })] }), _jsx("div", { className: "w-full bg-slate-700 rounded-full h-2", children: _jsx("div", { className: "bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all", style: {
                                                            width: `${(challenge.progress / challenge.targetValue) * 100}%`,
                                                        } }) })] }), _jsx("button", { onClick: () => handleProgressChallenge(challenge.id), className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Log Progress" })] }, challenge.id)))) })] })), selectedTab === 'completed' && (_jsx("div", { className: "max-w-3xl mx-auto space-y-4", children: completedChallenges.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-slate-400", children: "No completed challenges yet" }) })) : (completedChallenges.map(challenge => (_jsx("div", { className: "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-4 space-y-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start gap-3 flex-1", children: [_jsx("span", { className: "text-3xl", children: challenge.icon }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-white", children: challenge.name }), _jsx("p", { className: "text-sm text-slate-400", children: challenge.description })] })] }), _jsxs("div", { className: "text-right", children: [_jsx(CheckCircle, { size: 24, className: "text-green-400" }), _jsxs("div", { className: "text-sm font-semibold text-yellow-400 mt-2", children: ["+", challenge.reward, " XP"] })] })] }) }, challenge.id)))) })), selectedTab === 'browse' && (_jsx("div", { className: "max-w-3xl mx-auto space-y-4", children: Object.entries(CHALLENGE_TEMPLATES).map(([key, template]) => (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 space-y-3 hover:bg-slate-700/50 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex items-start gap-3 flex-1", children: [_jsx("span", { className: "text-3xl", children: template.icon }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-white", children: template.name }), _jsx("p", { className: "text-sm text-slate-400", children: template.description }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx("span", { className: "text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded capitalize", children: template.difficulty }), _jsxs("span", { className: "text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded", children: ["+", template.reward, " XP"] }), _jsxs("span", { className: "text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded", children: [template.duration, " days"] })] })] })] }) }), _jsx("button", { onClick: () => startChallenge(template), className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: "Start Challenge" })] }, key))) }))] }), showAiModal && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4", children: _jsx("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg w-full max-w-lg border border-slate-700/50 overflow-hidden", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h2", { className: "text-xl font-bold text-white flex items-center gap-2", children: [_jsx(Sparkles, { className: "text-purple-400" }), "AI Challenge Generator"] }), _jsx("button", { onClick: () => !isGenerating && setShowAiModal(false), className: "p-1 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95 text-slate-400", children: _jsx(X, { size: 20 }) })] }), _jsx("p", { className: "text-slate-400 mb-4 text-sm", children: "Describe a personal goal, hobby, or weakness you want to work on. The AI will design a custom challenge for you with rewards and milestones." }), _jsx("textarea", { value: aiPrompt, onChange: (e) => setAiPrompt(e.target.value), placeholder: "e.g., I want to read 10 books this year, I want to learn to do a handstand...", className: "w-full bg-slate-900 text-white rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-purple-500 focus:outline-none border border-slate-700/50 resize-none", disabled: isGenerating }), _jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [_jsx("button", { onClick: () => setShowAiModal(false), className: "px-4 py-2 rounded-2xl text-slate-300 hover:bg-slate-700 transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", disabled: isGenerating, children: "Cancel" }), _jsx("button", { onClick: handleGenerateChallenge, disabled: !aiPrompt.trim() || isGenerating, className: "px-6 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 18, className: "animate-spin" }), "Designing Challenge..."] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { size: 18 }), "Generate & Start"] })) })] })] }) }) }))] }));
}
