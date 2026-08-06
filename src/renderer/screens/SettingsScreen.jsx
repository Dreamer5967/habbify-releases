import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils';
import { ChevronLeft, Bell, Moon, Volume2, Lock, User, LogOut, Download, Palette, Cloud, Globe, Calendar, RotateCcw, Trash2, HelpCircle, Sparkles } from 'lucide-react';
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
    { name: 'calibrated', label: 'Calibration', icon: '🎯' },
];
export default function SettingsScreen({ onBack }) {
    var _a;
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
        emailNotifications: false,
        appleHealth: false,
        googleFit: false,
        appleCalendar: false,
    });
    // Profile edit state
    const [profileEdits, setProfileEdits] = useState({
        username: (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.username) || '',
        bio: (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.bio) || '',
        avatarUrl: (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.photoURL) || '',
    });
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [purgeConfirm, setPurgeConfirm] = useState('');
    const handlePurgeHabits = () => {
        if (purgeConfirm === 'habits') {
            useHabitStore.getState().purgeAllHabits();
            toast.success('All habits purged');
            setPurgeConfirm('');
        }
        else {
            setPurgeConfirm('habits');
        }
    };
    const handlePurgeAll = () => {
        var _a;
        if (purgeConfirm === 'all') {
            const profileId = (_a = useProfileStore.getState().currentProfile) === null || _a === void 0 ? void 0 : _a.id;
            useHabitStore.getState().purgeAllHabits();
            useRoutineStore.getState().setRoutines([]);
            if (profileId)
                localStorage.setItem(`routines_${profileId}`, JSON.stringify([]));
            useGoalStore.getState().setGoals([]);
            if (profileId)
                localStorage.setItem(`goals_${profileId}`, JSON.stringify([]));
            useFinanceStore.getState().setEntries([]);
            if (profileId)
                localStorage.setItem(`finance_${profileId}`, JSON.stringify([]));
            useJournalStore.getState().setEntries([]);
            if (profileId)
                localStorage.setItem(`journal_${profileId}`, JSON.stringify([]));
            toast.success('All data purged');
            setPurgeConfirm('');
        }
        else {
            setPurgeConfirm('all');
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
        // Load settings from localStorage
        const saved = localStorage.getItem('user_settings');
        if (saved) {
            setLocalSettings(JSON.parse(saved));
        }
        // Load custom theme colors if they exist
        if (settings === null || settings === void 0 ? void 0 : settings.customTheme) {
            setCustomColors(settings.customTheme);
        }
        setSavedCustomThemes(loadSavedCustomThemes());
    }, [settings]);
    const syncCreatorFromCurrentTheme = () => {
        const activeThemeColors = getThemeColors((settings === null || settings === void 0 ? void 0 : settings.theme) || 'dashboard', settings === null || settings === void 0 ? void 0 : settings.customTheme);
        setCustomColors(activeThemeColors);
        setCustomThemeName((settings === null || settings === void 0 ? void 0 : settings.theme) === 'custom' ? 'My Custom Theme' : `${(settings === null || settings === void 0 ? void 0 : settings.theme) ? settings.theme.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') : 'Current'} Copy`);
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
        }
        catch (error) {
            toast.error('Failed to logout');
        }
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
        }
        catch (error) {
            console.error('Sync failed:', error);
            const errorMessage = (error === null || error === void 0 ? void 0 : error.message) || 'Failed to sync data. Please check connection.';
            if (errorMessage.includes('No user logged in')) {
                toast.error('You are not signed in. Please sign in with Google first.');
            }
            else {
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
                icsContent.push('RRULE:FREQ=DAILY;COUNT=30'); // Limit to 30 days to avoid calendar spam
            }
            else if (habit.frequency === 'weekly') {
                icsContent.push('RRULE:FREQ=WEEKLY;COUNT=12'); // Limit to 12 weeks
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
        toast.success(`Successfully exported for ${type === 'apple' ? 'Apple' : 'Windows'} Calendar!`);
    };
    const exportData = () => {
        const data = {
            user: {
                email: user === null || user === void 0 ? void 0 : user.email,
                displayName: user === null || user === void 0 ? void 0 : user.displayName,
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
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900", children: [_jsxs("div", { className: "flex items-center gap-4 p-6 border-b border-slate-700/50", children: [_jsx("button", { onClick: onBack, className: "p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(ChevronLeft, { size: 24, className: "text-slate-400" }) }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "Settings" })] }), _jsx("div", { className: "flex-1 overflow-auto p-6", children: _jsxs("div", { className: "space-y-6 max-w-2xl", children: [
        _jsx("div", { className: "bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl space-y-3 animate-fade-in", children: _jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-3 bg-purple-500/20 rounded-2xl border border-purple-400/30", children: _jsx(HelpCircle, { size: 24, className: "text-purple-300" }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-bold text-white flex items-center gap-2", children: ["Know More About Habbify", _jsx(Sparkles, { size: 16, className: "text-amber-400 animate-pulse" })] }), _jsx("p", { className: "text-purple-200/80 text-xs font-medium", children: "Detailed instruction palette & feature guide for all tools" })] })] }), _jsx("button", { onClick: () => setShowGuideModal(true), className: "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-extrabold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 shrink-0", children: "Explore Guide 📖" })] }) }),
        updateReady && (_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-xl flex items-center justify-between border border-blue-400/30 animate-fade-in", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-xl font-bold text-white mb-1 flex items-center gap-2", children: [_jsx(Download, { size: 22, className: "animate-bounce" }), "Update Available!"] }), _jsxs("p", { className: "text-blue-100 text-sm", children: ["A new version ", updateVersion ? `(v${updateVersion})` : '', " has been downloaded and is ready to install."] })] }), _jsx("button", { onClick: () => {
                                        if (window.electron && window.electron.installUpdate) {
                                            window.electron.installUpdate();
                                        }
                                    }, className: "bg-white text-blue-900 font-bold px-6 py-3 rounded-xl shadow hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all", children: "Install & Restart" })] })), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 space-y-4", children: [_jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [_jsx(Palette, { size: 20 }), "Theme Customization"] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400 block mb-3", children: "Preset Themes" }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2", children: PRESET_THEMES.map((theme) => (_jsxs("button", { onClick: () => handleThemeChange(theme.name), className: `p-3 rounded-2xl transition hover:scale-105 active:scale-95 text-center text-xs font-medium ${(settings === null || settings === void 0 ? void 0 : settings.theme) === theme.name
                                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`, children: [_jsx("div", { className: "text-lg mb-1", children: theme.icon }), theme.label] }, theme.name))) })] }), _jsxs("div", { className: "border-t border-slate-700/50 pt-4", children: [_jsxs("button", { onClick: () => {
                                                const nextOpen = !showCustomTheme;
                                                setShowCustomTheme(nextOpen);
                                                if (nextOpen) {
                                                    syncCreatorFromCurrentTheme();
                                                }
                                            }, className: "w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [showCustomTheme ? 'Hide' : 'Show', " Custom Theme Creator"] }), showCustomTheme && (_jsxs("div", { className: "mt-4 space-y-4 p-4 bg-slate-900 rounded-2xl", children: [_jsx("p", { className: "text-sm text-slate-400", children: "Start from the current theme, then tune and save your own version." }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400 block mb-2", children: "Theme Name" }), _jsx("input", { type: "text", value: customThemeName, onChange: (e) => setCustomThemeName(e.target.value), placeholder: "My Pink Mist", className: "w-full bg-slate-700 text-white rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" })] }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: Object.entries(customColors).map(([key, value]) => (_jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400 capitalize block mb-2", children: key }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: value, onChange: (e) => handleCustomThemeChange(key, e.target.value), className: "w-12 h-10 rounded cursor-pointer" }), _jsx("input", { type: "text", value: value, onChange: (e) => handleCustomThemeChange(key, e.target.value), className: "flex-1 bg-slate-700 text-white rounded px-3 py-2 text-sm font-mono" })] })] }, key))) }), _jsxs("div", { className: "p-4 rounded-2xl border-2 border-slate-700/50 space-y-2", children: [_jsx("p", { className: "text-xs text-slate-400", children: "Preview" }), _jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(customColors).slice(0, 4).map(([key, value]) => (_jsx("div", { className: "px-3 py-1 rounded text-white text-xs font-medium", style: { backgroundColor: value }, children: key }, key))) })] }), _jsx("button", { onClick: applyCustomTheme, className: "w-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white font-semibold py-2.5 px-4 rounded-2xl transition hover:scale-105 active:scale-95", children: "Save Theme" })] })), savedCustomThemes.length > 0 && (_jsxs("div", { className: "mt-4 space-y-3 border-t border-slate-700/50 pt-4", children: [_jsx("label", { className: "text-sm text-slate-400 block", children: "Your Saved Themes" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: savedCustomThemes.map((savedTheme) => (_jsxs("div", { className: "rounded-2xl border border-slate-700/50 bg-slate-900 p-3 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold", children: savedTheme.name }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Saved ", new Date(savedTheme.createdAt).toLocaleDateString()] })] }), _jsx("button", { onClick: () => removeSavedTheme(savedTheme.name), className: "text-xs text-slate-400 hover:text-red-300 transition-colors", children: "Remove" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(savedTheme.colors).slice(0, 4).map(([key, value]) => (_jsx("span", { className: "px-2 py-1 rounded-full text-[10px] font-semibold text-white", style: { backgroundColor: value }, children: key }, key))) }), _jsx("button", { onClick: () => applySavedTheme(savedTheme), className: "w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2 rounded-xl transition", children: "Apply" })] }, savedTheme.name))) })] }))] }), _jsx("div", { className: "mt-4 pt-4 border-t border-slate-700/50 flex justify-end", children: _jsxs("button", { onClick: () => {
                                            handleThemeChange('dashboard');
                                            updateSettings({ customTheme: undefined });
                                        }, className: "flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-300 text-sm", children: [_jsx(RotateCcw, { size: 16 }), "Reset to Default Theme"] }) })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 space-y-4", children: [_jsxs("h2", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [_jsx(User, { size: 20 }), "Account"] }), user && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400", children: "Email" }), _jsx("div", { className: "w-full bg-slate-700 text-white rounded px-3 py-2 mt-1 text-sm opacity-75", children: user.email })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400", children: "Display Name" }), _jsx("input", { type: "text", value: user.displayName || '', disabled: true, className: "w-full bg-slate-700 text-white rounded px-3 py-2 mt-1 opacity-75" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400", children: "Username" }), _jsx("input", { type: "text", value: profileEdits.username, onChange: (e) => setProfileEdits({ ...profileEdits, username: e.target.value }), className: "w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" }), checkingUsername && _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Checking availability\u2026" }), usernameAvailable === false && _jsx("p", { className: "text-xs text-red-400 mt-1", children: "Username already taken" }), usernameAvailable && _jsx("p", { className: "text-xs text-green-400 mt-1", children: "Username is available" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400", children: "Bio" }), _jsx("textarea", { value: profileEdits.bio, onChange: (e) => setProfileEdits({ ...profileEdits, bio: e.target.value }), className: "w-full bg-slate-700 text-white rounded px-3 py-2 mt-1", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-slate-400", children: "Avatar URL" }), _jsx("input", { type: "text", value: profileEdits.avatarUrl, onChange: (e) => setProfileEdits({ ...profileEdits, avatarUrl: e.target.value }), className: "w-full bg-slate-700 text-white rounded px-3 py-2 mt-1" })] }), _jsx("button", { onClick: async () => {
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
                                                }
                                                catch (e) {
                                                    toast.error('Failed to update profile');
                                                }
                                            }, className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-2xl mt-3", children: "Save Profile" })] }))] }), _jsx(FeatureGuideModal, { isOpen: showGuideModal, onClose: () => setShowGuideModal(false) })] }) })] }));
}
