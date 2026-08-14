import { useState, useEffect } from 'react';
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils';
import { 
    ChevronLeft, Bell, Moon, Volume2, Lock, User, LogOut, Download, Palette, 
    Cloud, Globe, Calendar, RotateCcw, Trash2, HelpCircle, Sparkles, Key, DollarSign, RefreshCw,
    Eye, EyeOff, Clipboard
} from 'lucide-react';
import FeatureGuideModal from '../components/FeatureGuideModal';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { useAchievementStore } from '../store/achievementStore';
import { useChallengeStore } from '../store/challengeStore';
import { useJournalStore } from '../store/journalStore';
import { useSettingsStore } from '../store/settingsStore';
import { useGoalStore } from '../store/goalStore';
import { useRoutineStore } from '../store/routineStore';
import { useFinanceStore } from '../store/financeStore';
import { applyTheme, deleteCustomThemePreset, getThemeColors, loadSavedCustomThemes, saveCustomThemePreset } from '../utils/themeUtils';
import { toast } from 'sonner';

const PRESET_THEMES = [
    { name: 'dashboard', label: 'Aesthetic', icon: '✨' },
    { name: 'light', label: 'Light', icon: '☀️' },
    { name: 'dark', label: 'Dark', icon: '🌙' },
    { name: 'ocean', label: 'Ocean', icon: '🌊' },
    { name: 'forest', label: 'Forest', icon: '🌲' },
    { name: 'sunset', label: 'Sunset', icon: '🌅' },
    { name: 'midnight', label: 'Midnight', icon: '🌃' },
    { name: 'berry', label: 'Berry', icon: '🫐' },
    { name: 'coral', label: 'Coral', icon: '🪸' },
    { name: 'mint', label: 'Mint', icon: '🌿' },
    { name: 'monsoon', label: 'Monsoon', icon: '🌧️' },
    { name: 'black-hole', label: 'Black Hole', icon: '🕳️' },
    { name: 'mochi', label: 'Mochi', icon: '🍡' },
    { name: 'tsunami', label: 'Tsunami', icon: '🌊' },
    { name: 'matcha', label: 'Matcha', icon: '🍵' },
    { name: 'bubble-pop', label: 'Bubble Pop', icon: '🫧' },
    { name: 'meteor-shower', label: 'Meteor Shower', icon: '🌠' },
    { name: 'arcane', label: 'Arcane', icon: '🔮' },
    { name: 'gradient-sunset', label: 'Gradient Sunset', icon: '🎨' },
    { name: 'gradient-midnight', label: 'Gradient Night', icon: '🎨' },
    { name: 'gradient-ocean', label: 'Gradient Ocean', icon: '🎨' },
    { name: 'gradient-forest', label: 'Gradient Forest', icon: '🎨' },
    { name: 'gradient-berry', label: 'Gradient Berry', icon: '🎨' },
    { name: 'strawberry', label: 'Strawberry', icon: '🍓' },
];

export default function SettingsScreen({ onBack }) {
    const { currentProfile } = useProfileStore();
    const { user, signOut, updateUserProfile, checkUsernameAvailability } = useAuthStore();
    const { settings, updateSettings, updateReady, updateVersion } = useSettingsStore();
    const { habits } = useHabitStore();
    const { achievements } = useAchievementStore();
    const { challenges } = useChallengeStore();
    const { journal } = useJournalStore();
    const { goals } = useGoalStore();
    const { routines } = useRoutineStore();
    const { entries: financeEntries } = useFinanceStore();

    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showCustomTheme, setShowCustomTheme] = useState(false);
    const [customThemeName, setCustomThemeName] = useState('My Calibration Theme');
    const [savedCustomThemes, setSavedCustomThemes] = useState([]);
    const [customColors, setCustomColors] = useState({
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#1F2937',
        success: '#10B981',
        danger: '#EF4444',
        border: '#E5E7EB',
    });

    const [localSettings, setLocalSettings] = useState({
        notifications: true,
        darkMode: true,
        soundEnabled: true,
        privateProfile: false,
    });

    const [profileEdits, setProfileEdits] = useState({
        username: currentProfile?.username || '',
        bio: currentProfile?.bio || '',
        avatarUrl: currentProfile?.photoURL || '',
    });

    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [purgeConfirm, setPurgeConfirm] = useState('');
    const [apiKeyInput, setApiKeyInput] = useState(settings?.groqApiKey || '');
    const [showApiKey, setShowApiKey] = useState(false);

    const handlePasteApiKey = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setApiKeyInput(text.trim());
                toast.success('Pasted API key from clipboard!');
            } else {
                toast.error('Clipboard is empty.');
            }
        } catch (err) {
            toast.error('Could not read clipboard. Please use Cmd+V / Ctrl+V.');
        }
    };

    // Debounced username availability check
    useEffect(() => {
        if (!profileEdits.username) {
            setUsernameAvailable(null);
            return;
        }
        const handler = setTimeout(async () => {
            setCheckingUsername(true);
            const available = await checkUsernameAvailability(profileEdits.username);
            setUsernameAvailable(available);
            setCheckingUsername(false);
        }, 500);
        return () => clearTimeout(handler);
    }, [profileEdits.username, checkUsernameAvailability]);

    useEffect(() => {
        const saved = localStorage.getItem('user_settings');
        if (saved) {
            setLocalSettings(JSON.parse(saved));
        }
        if (settings?.customTheme) {
            setCustomColors(settings.customTheme);
        }
        if (settings?.groqApiKey !== undefined) {
            setApiKeyInput(settings.groqApiKey);
        }
        setSavedCustomThemes(loadSavedCustomThemes());
    }, [settings]);

    const syncCreatorFromCurrentTheme = () => {
        const activeThemeColors = getThemeColors(settings?.theme || 'dashboard', settings?.customTheme);
        setCustomColors(activeThemeColors);
        setCustomThemeName(settings?.theme === 'custom' ? 'My Custom Theme' : `${settings?.theme ? settings.theme.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') : 'Current'} Copy`);
    };

    const handleToggle = (key) => {
        const newSettings = { ...localSettings, [key]: !localSettings[key] };
        setLocalSettings(newSettings);
        localStorage.setItem('user_settings', JSON.stringify(newSettings));
    };

    const handleThemeChange = (themeName) => {
        updateSettings({ theme: themeName });
        applyTheme(themeName);
        toast.success(`Theme changed to ${themeName}`);
    };

    const handleCustomThemeChange = (color, value) => {
        const updated = { ...customColors, [color]: value };
        setCustomColors(updated);
    };

    const applyCustomTheme = () => {
        const trimmedName = customThemeName.trim();
        if (!trimmedName) {
            toast.error('Please give your theme a name');
            return;
        }
        const savedTheme = {
            name: trimmedName,
            colors: customColors,
            createdAt: getTrueDate().toISOString(),
        };
        saveCustomThemePreset(savedTheme);
        setSavedCustomThemes(loadSavedCustomThemes());
        updateSettings({ customTheme: customColors, theme: 'custom' });
        applyTheme('custom', customColors);
        localStorage.setItem('active_custom_theme_name', trimmedName);
        toast.success(`Saved ${trimmedName}`);
    };

    const applySavedTheme = (savedTheme) => {
        setCustomThemeName(savedTheme.name);
        setCustomColors(savedTheme.colors);
        updateSettings({ customTheme: savedTheme.colors, theme: 'custom' });
        applyTheme('custom', savedTheme.colors);
        localStorage.setItem('active_custom_theme_name', savedTheme.name);
        toast.success(`Applied ${savedTheme.name}`);
    };

    const removeSavedTheme = (themeName) => {
        deleteCustomThemePreset(themeName);
        setSavedCustomThemes(loadSavedCustomThemes());
        toast.success(`Removed ${themeName}`);
    };

    const handleLogout = async () => {
        try {
            await signOut();
            toast.success('Logged out successfully');
            window.location.reload();
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    const handleSaveApiKey = () => {
        updateSettings({ groqApiKey: apiKeyInput.trim() || undefined });
        toast.success(apiKeyInput.trim() ? 'Groq AI API Key saved!' : 'API Key cleared.');
    };

    const handleSync = async () => {
        try {
            toast.info('Syncing to cloud...');
            const habitsData = useHabitStore.getState().habits;
            const settingsData = useSettingsStore.getState().settings;
            const goalsData = useGoalStore.getState().goals;
            const routinesData = useRoutineStore.getState().routines;
            const financeData = useFinanceStore.getState().entries;
            const journalData = useJournalStore.getState().entries;
            const achievementsData = useAchievementStore.getState().achievements;
            const challengesData = useChallengeStore.getState().challenges;

            await useAuthStore.getState().syncLocalDataToFirestore({
                habits: habitsData,
                settings: settingsData,
                goals: goalsData,
                routines: routinesData,
                finance: financeData,
                journal: journalData,
                achievements: achievementsData,
                challenges: challengesData
            });
            toast.success('Data synced successfully!');
        } catch (error) {
            console.error('Sync failed:', error);
            const errorMessage = error?.message || 'Failed to sync data.';
            if (errorMessage.includes('No user logged in')) {
                toast.error('You are not signed in. Please sign in with Google first.');
            } else {
                toast.error(`Sync error: ${errorMessage}`);
            }
        }
    };

    const handleCalendarSync = (type) => {
        const activeHabits = habits.filter(h => h.isActive && !h.isArchived);
        if (activeHabits.length === 0) {
            toast.error('No active habits to sync!');
            return;
        }

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Habbify//Calendar Sync//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        const today = new Date();
        const dtstamp = today.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        activeHabits.forEach((habit) => {
            const start = new Date(today);
            start.setHours(9, 0, 0, 0);
            const end = new Date(today);
            end.setHours(10, 0, 0, 0);

            const dtstart = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const dtend = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:habbify-${habit.id}@habbify.app`);
            icsContent.push(`DTSTAMP:${dtstamp}`);
            icsContent.push(`DTSTART:${dtstart}`);
            icsContent.push(`DTEND:${dtend}`);
            icsContent.push(`SUMMARY:${habit.icon || ''} ${habit.name}`);
            icsContent.push(`DESCRIPTION:${habit.description || 'Habbify Habit'}`);
            if (habit.frequency === 'daily') {
                icsContent.push('RRULE:FREQ=DAILY;COUNT=30');
            } else if (habit.frequency === 'weekly') {
                icsContent.push('RRULE:FREQ=WEEKLY;COUNT=12');
            }
            icsContent.push('END:VEVENT');
        });

        icsContent.push('END:VCALENDAR');

        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `habbify-${type}-schedule.ics`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported calendar file for ${type === 'apple' ? 'Apple' : 'Windows'} Calendar!`);
    };

    const exportData = () => {
        const data = {
            user: {
                email: user?.email,
                displayName: user?.displayName,
            },
            habits,
            achievements,
            challenges,
            journal,
            goals,
            routines,
            financeEntries,
            exportDate: getTrueDate().toISOString(),
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `habbify-backup-${getTrueTodayString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Data exported successfully');
    };

    const handlePurgeHabits = () => {
        if (purgeConfirm === 'habits') {
            useHabitStore.getState().purgeAllHabits();
            toast.success('All habits purged');
            setPurgeConfirm('');
        } else {
            setPurgeConfirm('habits');
        }
    };

    const handlePurgeAll = () => {
        if (purgeConfirm === 'all') {
            const profileId = useProfileStore.getState().currentProfile?.id;
            useHabitStore.getState().purgeAllHabits();
            useRoutineStore.getState().setRoutines([]);
            if (profileId) localStorage.setItem(`routines_${profileId}`, JSON.stringify([]));
            useGoalStore.getState().setGoals([]);
            if (profileId) localStorage.setItem(`goals_${profileId}`, JSON.stringify([]));
            useFinanceStore.getState().setEntries([]);
            if (profileId) localStorage.setItem(`finance_${profileId}`, JSON.stringify([]));
            useJournalStore.getState().setEntries([]);
            if (profileId) localStorage.setItem(`journal_${profileId}`, JSON.stringify([]));
            toast.success('All data purged');
            setPurgeConfirm('');
        } else {
            setPurgeConfirm('all');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-slate-700/50">
                <button onClick={onBack} className="p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95">
                    <ChevronLeft size={24} className="text-slate-400" />
                </button>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>

            {/* Main scrollable body */}
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                <div className="space-y-6 max-w-2xl mx-auto pb-12">
                    
                    {/* Know More Banner */}
                    <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl space-y-3 animate-fade-in">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-400/30">
                                    <HelpCircle size={24} className="text-purple-300" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        Know More About Habbify <Sparkles size={16} className="text-amber-400 animate-pulse" />
                                    </h2>
                                    <p className="text-purple-200/80 text-xs font-medium">Detailed instruction palette & feature guide for all tools</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowGuideModal(true)}
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-extrabold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 shrink-0"
                            >
                                Explore Guide 📖
                            </button>
                        </div>
                    </div>

                    {/* Habbify Website Info Card */}
                    <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
                                <Globe size={22} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    Habbify Official Website
                                </h3>
                                <p className="text-slate-300 text-xs mt-0.5">
                                    Check the official Habbify website for news, documentation, and releases.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (window.electron && window.electron.openExternal) {
                                    window.electron.openExternal('https://github.com/Dreamer5967/habbify-releases');
                                } else {
                                    window.open('https://github.com/Dreamer5967/habbify-releases', '_blank');
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 flex items-center gap-1.5"
                        >
                            Visit Website 🌐
                        </button>
                    </div>

                    {/* Theme Customization */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Palette size={20} className="text-purple-400" /> Theme Customization
                        </h2>
                        <div>
                            <label className="text-sm text-slate-400 block mb-3">Preset Themes</label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {PRESET_THEMES.map((theme) => (
                                    <button
                                        key={theme.name}
                                        onClick={() => handleThemeChange(theme.name)}
                                        className={`p-3 rounded-2xl transition hover:scale-105 active:scale-95 text-center text-xs font-medium ${
                                            settings?.theme === theme.name
                                                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                    >
                                        <div className="text-lg mb-1">{theme.icon}</div>
                                        {theme.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Theme Creator */}
                        <div className="border-t border-slate-700/50 pt-4">
                            <button
                                onClick={() => {
                                    const nextOpen = !showCustomTheme;
                                    setShowCustomTheme(nextOpen);
                                    if (nextOpen) syncCreatorFromCurrentTheme();
                                }}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-2xl transition hover:scale-105 active:scale-95"
                            >
                                {showCustomTheme ? 'Hide' : 'Show'} Custom Theme Creator
                            </button>
                            {showCustomTheme && (
                                <div className="mt-4 space-y-4 p-4 bg-slate-900 rounded-2xl border border-slate-700/50">
                                    <p className="text-sm text-slate-400">Start from the current theme, then tune and save your own version.</p>
                                    <div>
                                        <label className="text-sm text-slate-400 block mb-2">Theme Name</label>
                                        <input
                                            type="text"
                                            value={customThemeName}
                                            onChange={(e) => setCustomThemeName(e.target.value)}
                                            placeholder="My Pink Mist"
                                            className="w-full bg-slate-700 text-white rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(customColors).map(([key, value]) => (
                                            <div key={key}>
                                                <label className="text-sm text-slate-400 capitalize block mb-2">{key}</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={value}
                                                        onChange={(e) => handleCustomThemeChange(key, e.target.value)}
                                                        className="w-12 h-10 rounded cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={value}
                                                        onChange={(e) => handleCustomThemeChange(key, e.target.value)}
                                                        className="flex-1 bg-slate-700 text-white rounded px-3 py-2 text-sm font-mono"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={applyCustomTheme}
                                        className="w-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white font-semibold py-2.5 px-4 rounded-2xl transition hover:scale-105 active:scale-95"
                                    >
                                        Save Theme
                                    </button>
                                </div>
                            )}

                            {/* Saved Custom Themes */}
                            {savedCustomThemes.length > 0 && (
                                <div className="mt-4 space-y-3 border-t border-slate-700/50 pt-4">
                                    <label className="text-sm text-slate-400 block">Your Saved Themes</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {savedCustomThemes.map((savedTheme) => (
                                            <div key={savedTheme.name} className="rounded-2xl border border-slate-700/50 bg-slate-900 p-3 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-white font-semibold">{savedTheme.name}</p>
                                                        <p className="text-xs text-slate-500">Saved {new Date(savedTheme.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <button onClick={() => removeSavedTheme(savedTheme.name)} className="text-xs text-slate-400 hover:text-red-300 transition-colors">
                                                        Remove
                                                    </button>
                                                </div>
                                                <button onClick={() => applySavedTheme(savedTheme)} className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2 rounded-xl transition">
                                                    Apply
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
                            <button
                                onClick={() => {
                                    handleThemeChange('dashboard');
                                    updateSettings({ customTheme: undefined });
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-300 text-sm"
                            >
                                <RotateCcw size={16} /> Reset to Default Theme
                            </button>
                        </div>
                    </div>

                    {/* General Preferences */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Globe size={20} className="text-blue-400" /> Preferences
                        </h2>
                        
                        {/* Week Starts On */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                            <div>
                                <p className="text-white font-medium text-sm">First Day of Week</p>
                                <p className="text-xs text-slate-400">Controls weekly tracker & charts alignment</p>
                            </div>
                            <select
                                value={settings?.weekStartsOn || 'monday'}
                                onChange={(e) => updateSettings({ weekStartsOn: e.target.value })}
                                className="bg-slate-700 text-white px-3 py-1.5 rounded-xl text-sm border border-slate-600 focus:outline-none"
                            >
                                <option value="monday">Monday</option>
                                <option value="sunday">Sunday</option>
                            </select>
                        </div>

                        {/* Currency Symbol */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                            <div>
                                <p className="text-white font-medium text-sm">Currency Symbol</p>
                                <p className="text-xs text-slate-400">Used for net balance & finance tracking</p>
                            </div>
                            <select
                                value={settings?.currencySymbol || '$'}
                                onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
                                className="bg-slate-700 text-white px-3 py-1.5 rounded-xl text-sm border border-slate-600 focus:outline-none"
                            >
                                <option value="$">$ (USD)</option>
                                <option value="₹">₹ (INR)</option>
                                <option value="€">€ (EUR)</option>
                                <option value="£">£ (GBP)</option>
                                <option value="¥">¥ (JPY)</option>
                                <option value="C$">C$ (CAD)</option>
                                <option value="A$">A$ (AUD)</option>
                            </select>
                        </div>

                        {/* Groq AI Key */}
                        <div className="py-2 border-b border-slate-700/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium text-sm flex items-center gap-1.5">
                                        <Key size={16} className="text-amber-400" /> Groq AI API Key
                                    </p>
                                    <p className="text-xs text-slate-400">Add your own API key for unlimited AI Coach & Journey Planning</p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${settings?.groqApiKey ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {settings?.groqApiKey ? 'Configured' : `${settings?.freeAiCallsRemaining || 0} Free Calls Left`}
                                </span>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                                <div className="relative flex-1 min-w-[200px]">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        placeholder="gsk_..."
                                        value={apiKeyInput}
                                        onChange={(e) => setApiKeyInput(e.target.value)}
                                        onPaste={(e) => {
                                            const pasted = e.clipboardData.getData('text');
                                            if (pasted) setApiKeyInput(pasted.trim());
                                        }}
                                        className="w-full bg-slate-700 text-white rounded-xl pl-3 pr-10 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                        title={showApiKey ? "Hide Key" : "Show Key"}
                                    >
                                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePasteApiKey}
                                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 border border-slate-600 hover:text-white"
                                    title="Paste API Key from Clipboard"
                                >
                                    <Clipboard size={15} /> Paste
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveApiKey}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md"
                                >
                                    Save Key
                                </button>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Notifications</span>
                                <input type="checkbox" checked={localSettings.notifications} onChange={() => handleToggle('notifications')} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Sound FX</span>
                                <input type="checkbox" checked={localSettings.soundEnabled} onChange={() => handleToggle('soundEnabled')} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Private Profile</span>
                                <input type="checkbox" checked={localSettings.privateProfile} onChange={() => handleToggle('privateProfile')} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <User size={20} className="text-green-400" /> Account
                        </h2>
                        {user ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-slate-400">Email</label>
                                    <div className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 mt-1 text-sm opacity-75">{user.email}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Display Name</label>
                                    <input type="text" value={user.displayName || ''} disabled className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 mt-1 opacity-75" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Username</label>
                                    <input
                                        type="text"
                                        value={profileEdits.username}
                                        onChange={(e) => setProfileEdits({ ...profileEdits, username: e.target.value })}
                                        className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 mt-1 text-sm"
                                    />
                                    {checkingUsername && <p className="text-xs text-slate-400 mt-1">Checking availability…</p>}
                                    {usernameAvailable === false && <p className="text-xs text-red-400 mt-1">Username already taken</p>}
                                    {usernameAvailable && <p className="text-xs text-green-400 mt-1">Username is available</p>}
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Bio</label>
                                    <textarea
                                        value={profileEdits.bio}
                                        onChange={(e) => setProfileEdits({ ...profileEdits, bio: e.target.value })}
                                        className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 mt-1 text-sm"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Avatar URL</label>
                                    <input
                                        type="text"
                                        value={profileEdits.avatarUrl}
                                        onChange={(e) => setProfileEdits({ ...profileEdits, avatarUrl: e.target.value })}
                                        className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 mt-1 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            await updateUserProfile({
                                                username: profileEdits.username,
                                                bio: profileEdits.bio,
                                                photoURL: profileEdits.avatarUrl || undefined,
                                            });
                                            if (currentProfile) {
                                                useProfileStore.getState().updateProfile(currentProfile.id, {
                                                    avatar: profileEdits.avatarUrl || undefined,
                                                    photoURL: profileEdits.avatarUrl || undefined,
                                                });
                                            }
                                            toast.success('Profile updated successfully');
                                        } catch (e) {
                                            toast.error('Failed to update profile');
                                        }
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-2xl mt-3 transition hover:scale-105 active:scale-95"
                                >
                                    Save Profile
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">Sign in with Google to sync your profile & friends.</p>
                        )}
                    </div>

                    {/* Data & Backup Synchronization */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Cloud size={20} className="text-sky-400" /> Data & Sync
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={handleSync}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-2xl transition hover:scale-105 active:scale-95"
                            >
                                <RefreshCw size={18} /> Sync Cloud Now
                            </button>
                            <button
                                onClick={exportData}
                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-2xl transition hover:scale-105 active:scale-95"
                            >
                                <Download size={18} /> Export Backup JSON
                            </button>
                        </div>
                        <div className="border-t border-slate-700/50 pt-3">
                            <label className="text-xs text-slate-400 block mb-2">Export Schedule to Calendar (.ICS)</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCalendarSync('apple')}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-2 px-3 rounded-xl transition"
                                >
                                    🍏 Apple Calendar
                                </button>
                                <button
                                    onClick={() => handleCalendarSync('windows')}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-2 px-3 rounded-xl transition"
                                >
                                    📅 Windows / Outlook
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone & Reset */}
                    <div className="bg-red-950/30 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-red-900/40">
                        <h2 className="text-lg font-semibold text-red-300 flex items-center gap-2">
                            <Trash2 size={20} className="text-red-400" /> Danger Zone
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={handlePurgeHabits}
                                className="bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-800/50 font-semibold py-2.5 px-4 rounded-2xl transition hover:scale-105 active:scale-95 text-sm"
                            >
                                {purgeConfirm === 'habits' ? 'Confirm Purge Habits?' : 'Purge All Habits'}
                            </button>
                            <button
                                onClick={handlePurgeAll}
                                className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-2xl transition hover:scale-105 active:scale-95 text-sm"
                            >
                                {purgeConfirm === 'all' ? 'Confirm Purge EVERYTHING?' : 'Purge All App Data'}
                            </button>
                        </div>
                    </div>

                    {/* Log Out */}
                    {user && (
                        <div className="pt-2">
                            <button
                                onClick={handleLogout}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-red-400 font-bold py-3 px-4 rounded-2xl border border-slate-700 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <LogOut size={20} /> Sign Out Account
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <FeatureGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
        </div>
    );
}
