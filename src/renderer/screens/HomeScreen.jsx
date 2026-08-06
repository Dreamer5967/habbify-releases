import React, { useEffect, useState } from 'react';
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils';
import { Plus, Zap, Flame, Trophy, Check, RotateCcw, Target, Repeat, Sparkles, ArrowRight, Trash2, Camera, Quote, HeartHandshake, RefreshCw, X } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { useGoalStore } from '../store/goalStore';
import { useRoutineStore } from '../store/routineStore';
import { useFinanceStore } from '../store/financeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTodoStore } from '../store/todoStore';
import { useAuthStore } from '../store/authStore';
import AddHabitModal from '../components/AddHabitModal';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import logoLightUrl from '../assets/logo-light.png';
import logoDarkUrl from '../assets/logo-dark.png';

const THOUGHTS_OF_THE_DAY = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
    { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Consistency is what transforms average into extraordinary.", author: "Unknown" },
    { text: "The man who moves a mountain begins by carrying away small stones.", author: "Lao Tzu" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "Your life does not get better by chance, it gets better by change.", author: "Jim Rohn" }
];

function getDailyThought() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return THOUGHTS_OF_THE_DAY[dayOfYear % THOUGHTS_OF_THE_DAY.length];
}

export default function HomeScreen({ onNavigate }) {
    const { habits, completeHabit, canCompleteHabit, undoCompletion, canUndoCompletion, loadHabits, updateHabit, removeHabit } = useHabitStore();
    const { currentProfile, setCurrentProfile, loadProfiles, loadProfile, updateProfile } = useProfileStore();
    const { userProfile } = useAuthStore();
    const { goals, loadGoals } = useGoalStore();
    const { routines, loadRoutines } = useRoutineStore();
    const { entries: financeEntries, loadEntries: loadFinance } = useFinanceStore();
    const { settings, loadSettings } = useSettingsStore();
    const { loadTodos } = useTodoStore();
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [thought, setThought] = useState(getDailyThought);
    const [isAiThoughtLoading, setIsAiThoughtLoading] = useState(false);
    const [habitAppreciation, setHabitAppreciation] = useState(null);
    const [isAppreciationLoading, setIsAppreciationLoading] = useState(false);
    const [showSparkyBubble, setShowSparkyBubble] = useState(false);
    const [sparkyMessage, setSparkyMessage] = useState('');

    useEffect(() => {
        const initializeApp = async () => {
            try {
                loadProfiles();
                const savedProfileId = localStorage.getItem('currentProfileId');
                let profile = null;
                if (savedProfileId) {
                    profile = loadProfile(savedProfileId);
                }
                if (!profile) {
                    const newProfile = {
                        id: uuidv4(),
                        name: 'User',
                        avatar: '👤',
                        xp: 0,
                        level: 1,
                        createdAt: getTrueDate().toISOString(),
                        updatedAt: getTrueDate().toISOString(),
                    };
                    setCurrentProfile(newProfile);
                    profile = newProfile;
                }
                if (profile) {
                    console.log('Loading app stores for profile:', profile.id);
                    loadHabits(profile.id);
                    if (!settings)
                        loadSettings(profile.id);
                    loadGoals(profile.id);
                    loadRoutines(profile.id);
                    loadFinance(profile.id);
                    loadTodos(profile.id);
                }
            }
            catch (error) {
                console.error('Failed to initialize app:', error);
                toast.error('Failed to load data');
            }
            finally {
                setLoading(false);
            }
        };
        initializeApp();
    }, []);

    useEffect(() => {
        if (loading || !currentProfile)
            return;
        const today = getTrueDate();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const activeHabits = habits.filter(h => h.isActive && !h.isArchived);
        const missedYesterday = activeHabits.some(h => {
            const createdDate = new Date(h.createdAt);
            return h.lastCompletedDate !== yesterdayStr && createdDate < yesterday;
        });
        const sessionKey = 'sparky_missed_shown_' + yesterdayStr;
        if (missedYesterday && !sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            triggerSparkyPepTalkContext("The user missed some habits yesterday. Encourage them to get back on track today!");
        }
    }, [loading, currentProfile, habits]);

    const triggerSparkyPepTalkContext = async (contextMsg) => {
        var _a, _b, _c, _d;
        const apiKey = settings?.groqApiKey || import.meta.env.VITE_GROQ_API_KEY || '';
        const userName = currentProfile?.name ? currentProfile.name.split(' ')[0] : 'friend';
        setShowSparkyBubble(true);
        if (!apiKey) {
            setSparkyMessage(`Hey ${userName}! Let's crush today and keep building those streaks! 🔥`);
            return;
        }
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: `You are Sparky, an energetic, funny, hyper-supportive best friend & hype companion in Habbify.` },
                        { role: 'user', content: contextMsg + ` Address ${userName} and keep it to 1-2 short hyped sentences!` }
                    ],
                    temperature: 0.9,
                    max_tokens: 60,
                })
            });
            if (response.ok) {
                const data = await response.json();
                const msg = data.choices?.[0]?.message?.content?.trim();
                if (msg)
                    setSparkyMessage(msg);
            }
        }
        catch (e) {
            console.error('Sparky context talk failed:', e);
        }
    };

    const triggerSparkyPepTalk = () => {
        triggerSparkyPepTalkContext("The user wants to be hyped up right now. Give them an energetic burst of motivation!");
    };

    const handleRefreshThought = async () => {
        var _a, _b, _c;
        const apiKey = settings?.groqApiKey || import.meta.env.VITE_GROQ_API_KEY || '';
        if (!apiKey) {
            const nextIdx = (THOUGHTS_OF_THE_DAY.findIndex(t => t.text === thought.text) + 1) % THOUGHTS_OF_THE_DAY.length;
            setThought(THOUGHTS_OF_THE_DAY[nextIdx]);
            return;
        }
        setIsAiThoughtLoading(true);
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: 'You are a master philosopher and motivational mentor. Output strictly JSON with format {"text": "Quote here...", "author": "Author Name"}. Keep the quote short, profound, and deeply inspiring.' },
                        { role: 'user', content: 'Give me a powerful, unique motivational thought of the day for someone working on personal transformation.' }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.9,
                })
            });
            if (response.ok) {
                const data = await response.json();
                const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
                if (parsed.text && parsed.author) {
                    setThought(parsed);
                }
            }
        }
        catch (e) {
            console.error('Failed to generate AI thought:', e);
        }
        finally {
            setIsAiThoughtLoading(false);
        }
    };

    const triggerHabitAppreciation = async (habitName) => {
        var _a, _b, _c, _d;
        const apiKey = settings?.groqApiKey || import.meta.env.VITE_GROQ_API_KEY || '';
        const userName = currentProfile?.name ? currentProfile.name.split(' ')[0] : 'friend';
        const today = getTrueTodayString();
        const activeHabits = habits.filter(h => h.isActive && !h.isArchived);
        const completedTodayCount = activeHabits.filter(h => h.lastCompletedDate === today).length + 1;
        setShowSparkyBubble(true);
        if (!apiKey) {
            const fallbackMessages = [
                `Completing "${habitName}" is a vote for the person you want to become, ${userName}. Every small win rewires your mindset! 🔥`,
                `Great momentum, ${userName}! Finishing "${habitName}" proves your actions align with your goals. Real progress in motion! 💪`,
                `Consistency in "${habitName}" builds lifelong mastery, ${userName}. Be proud of showing up for yourself today! ✨`
            ];
            const msg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
            setHabitAppreciation(msg);
            setSparkyMessage(msg);
            return;
        }
        setIsAppreciationLoading(true);
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        {
                            role: 'system',
                            content: `You are Sparky, a wise, inspiring, hyper-supportive best friend & mentor for ${userName} in Habbify. 
When ${userName} completes a habit, give a deep, heartfelt appreciation message. Explain specifically how completing "${habitName}" is helping them make a real, lasting change in their life and identity.
Keep it to 2 short sentences. Be warm, empowering, and profound. Avoid generic phrases.`
                        },
                        {
                            role: 'user',
                            content: `${userName} just completed habit: "${habitName}". (${completedTodayCount}/${activeHabits.length} habits done today). Appreciate their growth!`
                        }
                    ],
                    temperature: 0.85,
                    max_tokens: 80,
                })
            });
            if (response.ok) {
                const data = await response.json();
                const msg = data.choices?.[0]?.message?.content?.trim();
                if (msg) {
                    setHabitAppreciation(msg);
                    setSparkyMessage(msg);
                }
            }
        }
        catch (e) {
            console.error('Failed habit appreciation:', e);
        }
        finally {
            setIsAppreciationLoading(false);
        }
    };

    const handleCompleteHabit = (habitId, habitName) => {
        if (canCompleteHabit(habitId)) {
            completeHabit(habitId);
            if (currentProfile) {
                useProfileStore.getState().addXP(currentProfile.id, 50);
            }
            toast.success(`Great! "${habitName}" completed! +50 XP ⚡`);
            const today = getTrueTodayString();
            const completedTodayCount = habits.filter(h => h.lastCompletedDate === today).length + 1;
            const activeHabits = habits.filter(h => h.isActive && !h.isArchived);
            const habit = habits.find(h => h.id === habitId);
            let bounceBack = false;
            if (habit) {
                const todayDate = getTrueDate();
                const lastComp = habit.lastCompletedDate ? new Date(habit.lastCompletedDate) : new Date(habit.createdAt);
                const daysSinceLast = Math.floor((todayDate.getTime() - lastComp.getTime()) / (1000 * 3600 * 24));
                if (daysSinceLast >= 2)
                    bounceBack = true;
            }
            if (bounceBack) {
                triggerSparkyPepTalkContext(`The user just completed "${habitName}" after missing it for a few days. Give them a massive hype-up for bouncing back!`);
            }
            else if (completedTodayCount === activeHabits.length && activeHabits.length > 0) {
                triggerSparkyPepTalkContext(`The user just completed ALL their habits for today! Give them a massive congratulatory hype!`);
            }
            else if (completedTodayCount % 2 === 0) {
                triggerHabitAppreciation(habitName);
            }
        }
    };

    const handleUndoCompletion = (habitId, habitName) => {
        if (undoCompletion(habitId)) {
            toast.info(`Undo: "${habitName}" completion reverted`);
        }
    };

    const handleAvatarChange = (e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file && currentProfile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateProfile(currentProfile.id, { avatar: reader.result, photoURL: reader.result });
                toast.success("Profile picture updated!");
            };
            reader.readAsDataURL(file);
        }
    };

    const visibleAvatar = currentProfile?.avatar || currentProfile?.photoURL || userProfile?.photoURL;

    const darkThemes = ['dashboard', 'dark', 'midnight', 'black-hole', 'meteor-shower', 'arcane', 'gradient-sunset', 'gradient-midnight', 'gradient-ocean', 'gradient-forest', 'gradient-berry'];
    const isDarkTheme = darkThemes.includes((settings === null || settings === void 0 ? void 0 : settings.theme) || '') || (typeof document !== 'undefined' && (document.documentElement.classList.contains('dashboard') || document.documentElement.classList.contains('dark') || document.documentElement.classList.contains('midnight') || document.documentElement.classList.contains('black-hole') || document.documentElement.classList.contains('arcane') || document.documentElement.classList.contains('meteor-shower')));
    const activeLogoUrl = isDarkTheme ? logoDarkUrl : logoLightUrl;

    return (
        <div className="min-h-screen pb-12">
            <main className="max-w-7xl mx-auto px-6 pt-8">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img src={activeLogoUrl} alt="Habbify Logo" className="h-16 md:h-20 lg:h-24 object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-105 transition-transform duration-300" />
                </div>

                {/* SINGLE LARGE TOP CONTAINER CARD */}
                <div 
                    className="backdrop-blur-md rounded-[32px] p-6 md:p-10 shadow-xl border mb-8 relative transition-colors duration-300"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                    {/* Welcome Header */}
                    <div className="flex items-center gap-5 mb-8">
                        {/* Avatar */}
                        <div className="relative group cursor-pointer shrink-0 w-20 h-20" onClick={() => document.getElementById('avatar-upload')?.click()}>
                            {visibleAvatar && (visibleAvatar.startsWith('http') || visibleAvatar.startsWith('data:')) ? (
                                <img 
                                    src={visibleAvatar} 
                                    className="w-20 h-20 rounded-full object-cover border-4 shadow-sm"
                                    style={{ borderColor: 'var(--color-border)' }} 
                                    alt="Profile"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.nextElementSibling) {
                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }
                                    }} 
                                />
                            ) : null}
                            <div 
                                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-purple-500 shadow-sm border-4"
                                style={{ display: (visibleAvatar && (visibleAvatar.startsWith('http') || visibleAvatar.startsWith('data:'))) ? 'none' : 'flex', backgroundColor: 'color-mix(in srgb, var(--color-background) 70%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                            >
                                {currentProfile?.avatar && currentProfile.avatar.length <= 4 ? currentProfile.avatar : (currentProfile?.name?.charAt(0).toUpperCase() || '👤')}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera className="text-white w-7 h-7" />
                            </div>
                            <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </div>

                        {/* Welcome Text */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-1 tracking-tight" style={{ color: 'var(--color-text)' }}>
                                Welcome back, {currentProfile?.name}!
                            </h2>
                            <p className="text-sm font-medium opacity-75" style={{ color: 'var(--color-text)' }}>Keep building your streaks and level up</p>
                        </div>
                    </div>

                    {/* AI Search Bar */}
                    <div className="relative max-w-4xl mb-8">
                        <div 
                            className="rounded-full p-2 pl-6 flex items-center gap-3 shadow-inner border transition-colors"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 80%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                        >
                            <Sparkles className="text-purple-500 shrink-0 animate-pulse" size={20} />
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="What do you want to achieve? (e.g. Get an internship at NVIDIA)"
                                className="flex-1 bg-transparent text-base border-none outline-none focus:outline-none focus:ring-0 shadow-none"
                                style={{ color: 'var(--color-text)', border: 'none', background: 'transparent', boxShadow: 'none', outline: 'none' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && aiPrompt.trim()) {
                                        onNavigate('journeyPlanner', aiPrompt);
                                    }
                                }}
                            />
                            <button
                                onClick={() => aiPrompt.trim() && onNavigate('journeyPlanner', aiPrompt)}
                                disabled={!aiPrompt.trim()}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-7 py-3 rounded-full font-bold flex items-center gap-2 transition hover:scale-105 active:scale-95 shadow-md shrink-0"
                            >
                                Plan it <ArrowRight size={18} />
                            </button>
                        </div>
                        <div className="mt-3 flex justify-end mr-4">
                            <button
                                onClick={() => onNavigate('journeyDashboard')}
                                className="text-purple-500 hover:text-purple-600 text-sm font-semibold flex items-center gap-1.5 transition hover:underline"
                            >
                                View Active Journeys <Target size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Stat Cards Grid INSIDE top container */}
                    {currentProfile && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {/* Stat Card 1 */}
                            <div 
                                className="rounded-[20px] p-5 border flex items-center justify-between hover:shadow-md transition-all"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70" style={{ color: 'var(--color-text)' }}>Total XP</p>
                                    <p className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-text)' }}>{currentProfile.xp}</p>
                                    <p className="text-xs mt-0.5 font-medium opacity-60" style={{ color: 'var(--color-text)' }}>Keep going!</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                                    <Zap size={22} className="text-purple-500" />
                                </div>
                            </div>

                            {/* Stat Card 2 */}
                            <div 
                                className="rounded-[20px] p-5 border flex items-center justify-between hover:shadow-md transition-all"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70" style={{ color: 'var(--color-text)' }}>Current level</p>
                                    <p className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-text)' }}>{currentProfile.level}</p>
                                    <p className="text-xs mt-0.5 font-medium opacity-60" style={{ color: 'var(--color-text)' }}>Level up soon!</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-500/30">
                                    <Trophy size={22} className="text-cyan-500" />
                                </div>
                            </div>

                            {/* Stat Card 3 */}
                            <div 
                                className="rounded-[20px] p-5 border flex items-center justify-between hover:shadow-md transition-all"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70" style={{ color: 'var(--color-text)' }}>Active habits</p>
                                    <p className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-text)' }}>{habits.filter(h => h.isActive && !h.isArchived).length}</p>
                                    <p className="text-xs mt-0.5 font-medium opacity-60" style={{ color: 'var(--color-text)' }}>In progress</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                    <Flame size={22} className="text-emerald-500" />
                                </div>
                            </div>

                            {/* Stat Card 4 */}
                            <div 
                                className="rounded-[20px] p-5 border flex items-center justify-between hover:shadow-md transition-all"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70" style={{ color: 'var(--color-text)' }}>Active goals</p>
                                    <p className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-text)' }}>{goals.filter(g => !g.completed).length}</p>
                                    <p className="text-xs mt-0.5 font-medium opacity-60" style={{ color: 'var(--color-text)' }}>To complete</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
                                    <Target size={22} className="text-rose-500" />
                                </div>
                            </div>

                            {/* Stat Card 5 */}
                            <div 
                                className="rounded-[20px] p-5 border flex items-center justify-between hover:shadow-md transition-all"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70" style={{ color: 'var(--color-text)' }}>Total streaks</p>
                                    <p className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-text)' }}>{routines.reduce((sum, r) => sum + (r.streak || 0), 0)}</p>
                                    <p className="text-xs mt-0.5 font-medium opacity-60" style={{ color: 'var(--color-text)' }}>Across routines</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                                    <Repeat size={22} className="text-purple-500" />
                                </div>
                            </div>

                            {/* Stat Card 6 */}
                            <div 
                                className="rounded-[20px] p-5 border flex items-center justify-between hover:shadow-md transition-all"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70" style={{ color: 'var(--color-text)' }}>Net balance</p>
                                    <p className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-text)' }}>
                                        {(() => {
                                            const net = financeEntries.reduce((sum, e) => e.type === 'income' ? sum + e.amount : sum - e.amount, 0);
                                            const sym = settings?.currencySymbol || '$';
                                            return net < 0 ? `-${sym}${Math.abs(net).toFixed(0)}` : `${sym}${net.toFixed(0)}`;
                                        })()}
                                    </p>
                                    <p className="text-xs mt-0.5 font-medium opacity-60" style={{ color: 'var(--color-text)' }}>Tracked balance</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center shrink-0 border border-teal-500/30">
                                    <Zap size={22} className="text-teal-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Thought of the Day INSIDE top container */}
                    <div 
                        className="rounded-[20px] p-5 border flex flex-col md:flex-row items-start md:items-center gap-4 justify-between"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 50%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-start gap-4 flex-1">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                                <Quote className="text-amber-500" size={22} />
                            </div>
                            <div>
                                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                    Thought of the Day
                                </p>
                                <p className="text-base italic font-semibold leading-relaxed" style={{ color: 'var(--color-text)' }}>"{thought.text}"</p>
                                <p className="text-xs mt-1.5 font-bold opacity-75" style={{ color: 'var(--color-text)' }}>— {thought.author}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefreshThought}
                            disabled={isAiThoughtLoading}
                            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition border shadow-sm"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 90%, var(--color-background))', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                        >
                            <RefreshCw size={14} className={isAiThoughtLoading ? "animate-spin text-amber-500" : "text-amber-500"} />
                            {isAiThoughtLoading ? "Reflecting..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* Today's Habits Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Today's Habits</h3>
                        <p className="text-sm mt-1 font-medium opacity-75" style={{ color: 'var(--color-text)' }}>Complete your daily habits to build streaks</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-full flex items-center gap-2 transition hover:shadow-lg hover:-translate-y-0.5 active:scale-95 font-semibold text-sm"
                    >
                        <Plus size={18} />
                        <span>Add Habit</span>
                    </button>
                </div>

                {/* Habit Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {loading ? (
                        <div className="col-span-full text-center py-12">
                            <p className="font-medium text-lg animate-pulse opacity-75" style={{ color: 'var(--color-text)' }}>Loading habits...</p>
                        </div>
                    ) : habits.length === 0 ? (
                        <div 
                            className="col-span-full backdrop-blur-md rounded-[24px] border shadow-lg p-12 text-center flex flex-col items-center"
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 70%, var(--color-surface))' }}>
                                <Flame size={32} className="text-purple-500" />
                            </div>
                            <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>No habits yet</p>
                            <p className="mb-6 font-medium opacity-75" style={{ color: 'var(--color-text)' }}>Create your first one and start building your streak!</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-full font-semibold transition shadow-md hover:-translate-y-0.5"
                            >
                                Create First Habit
                            </button>
                        </div>
                    ) : (
                        habits.map((habit) => {
                            const isCompleted = !canCompleteHabit(habit.id);
                            const canUndo = canUndoCompletion(habit.id);

                            return (
                                <div
                                    key={habit.id}
                                    className="backdrop-blur-md rounded-[24px] p-5 shadow-lg relative group transition-all duration-300 hover:-translate-y-1 flex flex-col"
                                    style={{ backgroundColor: 'var(--color-surface)', border: `2px solid ${habit.color}` }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 pr-3">
                                            <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>{habit.name}</h4>
                                            <p className="text-sm leading-snug line-clamp-2 opacity-75" style={{ color: 'var(--color-text)' }}>{habit.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to archive "${habit.name}"? It will be removed from your daily list but its progress will be saved in Statistics.`)) {
                                                        updateHabit(habit.id, { isArchived: true, isActive: false });
                                                        toast.success(`"${habit.name}" archived. View it in Stats!`);
                                                    }
                                                }}
                                                className="hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                                                style={{ color: 'var(--color-text)', backgroundColor: 'color-mix(in srgb, var(--color-background) 80%, var(--color-surface))' }}
                                                title="Archive Habit"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="text-4xl drop-shadow-sm transition-transform group-hover:scale-110">
                                                {habit.icon}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${
                                            habit.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                                            habit.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                                            'bg-red-500/20 text-red-500'
                                        }`}>
                                            {habit.difficulty}
                                        </span>
                                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide bg-blue-500/20 text-blue-500">
                                            {habit.category}
                                        </span>
                                    </div>

                                    <div 
                                        className="grid grid-cols-2 gap-3 mb-5 p-3.5 rounded-2xl border mt-auto"
                                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 70%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                                    >
                                        <div>
                                            <p className="text-[10px] font-bold uppercase mb-1 opacity-70" style={{ color: 'var(--color-text)' }}>Current Streak</p>
                                            <div className="flex items-center gap-1.5">
                                                <Flame size={18} className="text-orange-500" />
                                                <span className="text-xl font-black" style={{ color: 'var(--color-text)' }}>{habit.currentStreak}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase mb-1 opacity-70" style={{ color: 'var(--color-text)' }}>Best Streak</p>
                                            <div className="flex items-center gap-1.5">
                                                <Trophy size={18} className="text-purple-500" />
                                                <span className="text-xl font-black" style={{ color: 'var(--color-text)' }}>{habit.longestStreak}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleCompleteHabit(habit.id, habit.name)}
                                            disabled={isCompleted}
                                            className="flex-1 py-3 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                            style={
                                                isCompleted 
                                                    ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', border: '2px solid #22C55E', cursor: 'not-allowed' }
                                                    : { backgroundColor: habit.color, color: '#FFFFFF', border: '2px solid transparent', boxShadow: `0 4px 12px ${habit.color}40` }
                                            }
                                        >
                                            {isCompleted ? (
                                                <>
                                                    <Check size={18} strokeWidth={3} />
                                                    Done today
                                                </>
                                            ) : (
                                                '✓ Complete'
                                            )}
                                        </button>
                                        
                                        {canUndo && (
                                            <button
                                                onClick={() => handleUndoCompletion(habit.id, habit.name)}
                                                className="px-4 py-3 rounded-[16px] text-sm font-bold bg-slate-700/50 text-slate-300 border-2 border-slate-600 hover:border-slate-500 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95"
                                                title="Undo today's completion"
                                            >
                                                <RotateCcw size={16} strokeWidth={2.5} />
                                                Undo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sparky Bubble */}
                <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
                    {showSparkyBubble && (
                        <div className="mb-4 max-w-sm bg-white rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-[#E8ECF4] relative group">
                            <button
                                onClick={() => setShowSparkyBubble(false)}
                                className="absolute top-3 right-3 p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-[#1E293B] hover:bg-slate-100 transition-colors"
                            >
                                <X size={14} />
                            </button>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#7C5CFC] rounded-2xl flex items-center justify-center shadow-lg shrink-0 relative animate-pulse">
                                    <div className="absolute inset-0 bg-[#7C5CFC] rounded-2xl blur-md opacity-40"></div>
                                    <Sparkles size={24} className="text-white relative z-10" />
                                </div>
                                <div className="pr-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7C5CFC]">Sparky • Hype Companion</span>
                                    <p className="text-[#1E293B] text-sm font-semibold leading-snug mt-1">
                                        "{sparkyMessage || "Hey! I'm Sparky, your hype buddy! Complete your habits today and let's crush it! ⚡️"}"
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={triggerSparkyPepTalk}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C5CFC] text-xs font-bold transition active:scale-95"
                                >
                                    <Sparkles size={14} className="text-amber-500" /> Hype Me!
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
