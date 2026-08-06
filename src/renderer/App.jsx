import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import HomeScreen from './screens/HomeScreen';
import WeeklyTrackerScreen from './screens/WeeklyTrackerScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import ChallengesScreen from './screens/ChallengesScreen';
import JournalScreen from './screens/JournalScreen';
import SettingsScreen from './screens/SettingsScreen';
import SocialScreen from './screens/SocialScreen';
import LoginScreen from './screens/LoginScreen';
import { Home, TrendingUp, Trophy, Target, BookOpen, Settings, Users, Repeat, DollarSign, Flag, CalendarCheck, Moon, Sun, Timer, CalendarDays, Dumbbell, Compass, CheckSquare } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useGoalStore } from './store/goalStore';
import { useRoutineStore } from './store/routineStore';
import { useFinanceStore } from './store/financeStore';
import { applyTheme } from './utils/themeUtils';
import { useSettingsStore } from './store/settingsStore';
import { useHabitStore } from './store/habitStore';
import { useProfileStore } from './store/profileStore';
import { useAchievementStore } from './store/achievementStore';
import { useChallengeStore } from './store/challengeStore';
import { useJournalStore } from './store/journalStore';
import { loadTheme } from './utils/themeUtils';
import logoUrl from './assets/logo.png';
import CubeLoader from './components/CubeLoader';
import GoalTrackerScreen from './screens/GoalTrackerScreen';
import RoutineTrackerScreen from './screens/RoutineTrackerScreen';
import FinanceTrackerScreen from './screens/FinanceTrackerScreen';
import FocusTimerScreen from './screens/FocusTimerScreen';
import WeeklyReviewScreen from './screens/WeeklyReviewScreen';
import GymPlannerScreen from './screens/GymPlannerScreen';
import { useGymStore } from './store/gymStore';
import { useWeeklyReviewStore } from './store/weeklyReviewStore';
import { useJourneyStore } from './store/journeyStore';
import JourneyPlannerScreen from './screens/JourneyPlannerScreen';
import JourneyDashboardScreen from './screens/JourneyDashboardScreen';
import TodoScreen from './screens/TodoScreen';
import NotificationManager from './components/NotificationManager';
import TrayApp from './TrayApp';
import { useTodoStore } from './store/todoStore';
import { syncSatelliteTime } from './utils/timeUtils';
import BubbleBackground from './components/BubbleBackground';
export default function App() {
    if (window.location.hash === '#/tray') {
        return _jsx(TrayApp, {});
    }
    const { user, userProfile, loading, initializeAuth, loadUserData } = useAuthStore();
    const { settings, setSettings } = useSettingsStore();
    const { habits, setHabits, completeHabit } = useHabitStore();
    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved !== 'light'; // Default to dark mode
    });
    const toggleTheme = () => {
        var _a;
        const currentTheme = ((_a = settings) === null || _a === void 0 ? void 0 : _a.theme) || localStorage.getItem('theme') || 'dashboard';
        const darkThemes = ['dashboard', 'dark', 'midnight', 'black-hole', 'meteor-shower', 'arcane', 'gradient-sunset', 'gradient-midnight', 'gradient-ocean', 'gradient-forest', 'gradient-berry'];
        const isCurrentlyDark = darkThemes.includes(currentTheme);
        const newTheme = isCurrentlyDark ? 'light' : 'dark';

        setIsDarkMode(!isCurrentlyDark);
        useSettingsStore.getState().updateSettings({ theme: newTheme, customTheme: undefined });
    };
    const { setCurrentProfile } = useProfileStore();
    const [currentScreen, setCurrentScreen] = useState('home');
    const [journeyPrompt, setJourneyPrompt] = useState('');
    const [showSplash, setShowSplash] = useState(true);
    const [animateSplashOut, setAnimateSplashOut] = useState(false);
    // Initialize auth on mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);
    // Satellite Time Sync
    useEffect(() => {
        const tz = (settings === null || settings === void 0 ? void 0 : settings.nativeTimezone) || Intl.DateTimeFormat().resolvedOptions().timeZone;
        syncSatelliteTime(tz).catch(console.error);
    }, [settings === null || settings === void 0 ? void 0 : settings.nativeTimezone]);
    // Load cloud data when user is authenticated
    useEffect(() => {
        if (user && userProfile) {
            // Set the local profile store to match the cloud profile
            setCurrentProfile({
                id: userProfile.uid,
                name: userProfile.name,
                avatar: userProfile.photoURL,
                xp: userProfile.xp,
                level: userProfile.level,
                createdAt: userProfile.createdAt,
                updatedAt: userProfile.updatedAt
            });
            // Fetch the rest of the user data from Firestore and perform a smart merge
            loadUserData().then((cloudData) => {
                const currentHabits = useHabitStore.getState().habits;
                if (cloudData.habits && cloudData.habits.length > 0) {
                    // Merge local habits with cloud habits (prefer newer)
                    const habitMap = new Map();
                    currentHabits.forEach(h => habitMap.set(h.id, h));
                    cloudData.habits.forEach(h => {
                        const local = habitMap.get(h.id);
                        if (!local || (h.updatedAt && new Date(h.updatedAt) > new Date(local.updatedAt || 0))) {
                            habitMap.set(h.id, h);
                        }
                    });
                    setHabits(Array.from(habitMap.values()));
                }
                if (cloudData.achievements) {
                    useAchievementStore.getState().setAchievements(cloudData.achievements);
                }
                if (cloudData.challenges) {
                    useChallengeStore.getState().setChallenges(cloudData.challenges);
                }
                if (cloudData.journal) {
                    useJournalStore.getState().setEntries(cloudData.journal);
                }
                if (cloudData.profile) {
                    setCurrentProfile(cloudData.profile);
                }
                if (cloudData.settings) {
                    const localSavedTheme = localStorage.getItem('theme');
                    const localCustomTheme = localStorage.getItem('customTheme');
                    const mergedSettings = {
                        ...cloudData.settings,
                        theme: localSavedTheme || cloudData.settings.theme || 'dashboard',
                        customTheme: localCustomTheme ? JSON.parse(localCustomTheme) : cloudData.settings.customTheme
                    };
                    setSettings(mergedSettings);
                }
                // New trackers
                if (cloudData.goals) {
                    useGoalStore.getState().setGoals(cloudData.goals);
                }
                if (cloudData.routines) {
                    useRoutineStore.getState().setRoutines(cloudData.routines);
                }
                if (cloudData.finance) {
                    useFinanceStore.getState().setEntries(cloudData.finance);
                }
                if (cloudData.weeklyReviews) {
                    useWeeklyReviewStore.getState().setReviews(cloudData.weeklyReviews);
                }
                if (cloudData.journeys) {
                    useJourneyStore.getState().setJourneys(cloudData.journeys);
                }
                if (cloudData.todos) {
                    useTodoStore.getState().setTodos(cloudData.todos);
                }
                if (cloudData.gymPlan) {
                    localStorage.setItem(`gym_plan_${userProfile.uid}`, JSON.stringify(cloudData.gymPlan));
                    useGymStore.getState().loadPlan(userProfile.uid);
                }
            }).catch(console.error);
        }
    }, [user, userProfile, loadUserData, setCurrentProfile, setHabits, setSettings]);

    // Save all state on window beforeunload / application exit
    useEffect(() => {
        const handleBeforeUnload = () => {
            console.log('💾 Flushing all state to local persistence on exit...');
            const habits = useHabitStore.getState().habits;
            const settings = useSettingsStore.getState().settings;
            if (settings?.theme) {
                localStorage.setItem('theme', settings.theme);
                if (settings.customTheme) {
                    localStorage.setItem('customTheme', JSON.stringify(settings.customTheme));
                }
            }
            if (userProfile?.id) {
                localStorage.setItem(`habits_${userProfile.id}`, JSON.stringify(habits));
                if (settings) {
                    localStorage.setItem(`user_settings_${userProfile.id}`, JSON.stringify(settings));
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [userProfile]);

    // Load and apply theme (fallback if no settings yet)
    useEffect(() => {
        loadTheme();
    }, []);
    // Apply theme when settings change
    useEffect(() => {
        var _a;
        if (settings === null || settings === void 0 ? void 0 : settings.theme) {
            applyTheme(settings.theme, settings.customTheme);
            // Also apply to body for better effect
            document.body.style.background = ((_a = settings.customTheme) === null || _a === void 0 ? void 0 : _a.background) || 'var(--color-background)';
        }
    }, [settings === null || settings === void 0 ? void 0 : settings.theme, settings === null || settings === void 0 ? void 0 : settings.customTheme]);
    // Periodic cloud sync
    useEffect(() => {
        if (!user || !userProfile)
            return;
        const syncInterval = setInterval(() => {
            console.log('🔄 Performing periodic cloud sync...');
            const habits = useHabitStore.getState().habits;
            const currentSettings = useSettingsStore.getState().settings;
            const goals = useGoalStore.getState().goals;
            const routines = useRoutineStore.getState().routines;
            const finance = useFinanceStore.getState().entries;
            const journal = useJournalStore.getState().entries;
            const achievements = useAchievementStore.getState().achievements;
            const challenges = useChallengeStore.getState().challenges;
            const gymPlan = useGymStore.getState().plan;
            const weeklyReviews = useWeeklyReviewStore.getState().reviews;
            const journeys = useJourneyStore.getState().journeys;
            const todos = useTodoStore.getState().todos;
            useAuthStore.getState().syncLocalDataToFirestore({
                habits,
                settings: currentSettings,
                goals,
                routines,
                finance,
                journal,
                achievements,
                challenges,
                gymPlan,
                weeklyReviews,
                journeys,
                todos
            }).catch(console.error);
        }, 60000); // Sync every minute
        return () => clearInterval(syncInterval);
    }, [user, userProfile]);
    // Sync Habits to System Tray and handle Check-ins
    useEffect(() => {
        if (window.electron) {
            const today = new Date().toISOString().split('T')[0];
            const activeHabits = habits.filter(h => h.isActive && !h.isArchived);
            const trayData = activeHabits.map(h => ({
                id: h.id,
                name: h.name,
                completed: h.lastCompletedDate === today
            }));
            if (window.electron.updateTrayHabits) {
                window.electron.updateTrayHabits(trayData);
            }
        }
    }, [habits]);
    useEffect(() => {
        if (window.electron && window.electron.onTrayCheckIn) {
            window.electron.onTrayCheckIn((habitId) => {
                completeHabit(habitId);
                toast.success('Habit completed from System Tray!');
            });
        }
    }, [completeHabit]);
    // Listen for auto-updater events
    useEffect(() => {
        if (window.electron && window.electron.onUpdateReady) {
            window.electron.onUpdateReady((version) => {
                useSettingsStore.getState().setUpdateReady(true, version);
                // Also show a toast so they know without being in settings
                toast.info(`A new version (v${version}) is available! Go to Settings to install it.`, { duration: 10000 });
            });
        }
    }, []);
    const [isShrinking, setIsShrinking] = useState(false);
    const handleSplashComplete = () => {
        setIsShrinking(true);
        setTimeout(() => setShowSplash(false), 850);
    };
    if (loading) {
        return _jsx(CubeLoader, { text: "Habbify", subtext: "shuffling the cube" });
    }
    // Show login screen if not authenticated
    if (!user) {
        return _jsx(LoginScreen, {});
    }
    const handleBack = () => {
        setCurrentScreen('home');
    };
    return (_jsxs("div", { className: "flex h-screen bg-transparent overflow-hidden relative transition-colors duration-300", style: { color: 'var(--color-text)' }, children: [_jsx(BubbleBackground, { active: (settings === null || settings === void 0 ? void 0 : settings.theme) === 'bubble-pop' }), showSplash && (_jsx(CubeLoader, { text: "Habbify", subtext: "Better starts here.", isShrinking: isShrinking, onComplete: handleSplashComplete })), _jsx(NotificationManager, {}), _jsxs("nav", { className: "w-[88px] m-4 rounded-[24px] h-[calc(100vh-2rem)] backdrop-blur-md border shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col items-center py-4 gap-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-colors duration-300 relative z-10", style: { backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }, children: [_jsx("span", { className: "text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-60", style: { color: 'var(--color-text)' }, children: "Main" }), [
                        { key: 'home', icon: Home, label: 'Home' },
                        { key: 'journeyDashboard', icon: Compass, label: 'Journeys' },
                        { key: 'weekly', icon: CalendarCheck, label: 'Weekly' },
                        { key: 'stats', icon: TrendingUp, label: 'Stats' },
                        { key: 'review', icon: CalendarDays, label: 'Review' },
                        { key: 'achievements', icon: Trophy, label: 'Awards' },
                        { key: 'challenges', icon: Target, label: 'Challenges' },
                        { key: 'journal', icon: BookOpen, label: 'Journal' },
                        { key: 'social', icon: Users, label: 'Social' },
                    ].map(({ key, icon: Icon, label }) => (_jsxs("button", { onClick: () => setCurrentScreen(key), className: `group w-16 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-300 ${currentScreen === key
                            ? 'bg-purple-500/15 text-purple-500 font-bold shadow-sm'
                            : 'opacity-70 hover:opacity-100 hover:bg-purple-500/10'}`, style: currentScreen !== key ? { color: 'var(--color-text)' } : {}, title: label, children: [_jsx(Icon, { size: 20, className: "transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-3" }), _jsx("span", { className: "text-[10px] font-medium leading-tight transition-all duration-300", children: label })] }, key))), _jsx("div", { className: "w-10 h-px my-2 opacity-20", style: { backgroundColor: 'var(--color-text)' } }), _jsx("span", { className: "text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-60", style: { color: 'var(--color-text)' }, children: "Trackers" }), [
                        { key: 'goals', icon: Flag, label: 'Goals', activeClass: 'bg-purple-500/20 text-purple-500 shadow-lg shadow-purple-500/10 font-bold' },
                        { key: 'routines', icon: Repeat, label: 'Routines', activeClass: 'bg-cyan-500/20 text-cyan-500 shadow-lg shadow-cyan-500/10 font-bold' },
                        { key: 'finance', icon: DollarSign, label: 'Finance', activeClass: 'bg-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/10 font-bold' },
                        { key: 'focus', icon: Timer, label: 'Focus', activeClass: 'bg-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/10 font-bold' },
                        { key: 'todo', icon: CheckSquare, label: 'To-Do', activeClass: 'bg-sky-500/20 text-sky-500 shadow-sm shadow-sky-500/10 font-bold' },
                        { key: 'gym', icon: Dumbbell, label: 'Gym', activeClass: 'bg-orange-500/20 text-orange-500 shadow-sm shadow-orange-500/10 font-bold' },
                    ].map(({ key, icon: Icon, label, activeClass }) => (_jsxs("button", { onClick: () => setCurrentScreen(key), className: `group w-16 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-300 ${currentScreen === key
                            ? activeClass
                            : 'opacity-70 hover:opacity-100 hover:bg-purple-500/10'}`, style: currentScreen !== key ? { color: 'var(--color-text)' } : {}, title: label, children: [_jsx(Icon, { size: 20, className: "transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-3" }), _jsx("span", { className: "text-[10px] font-medium leading-tight transition-all duration-300", children: label })] }, key))), _jsx("div", { className: "flex-1" }), _jsx("div", { className: "w-10 h-px mb-2 opacity-20", style: { backgroundColor: 'var(--color-text)' } }), _jsxs("button", { onClick: toggleTheme, className: "group w-16 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-300 opacity-70 hover:opacity-100 hover:bg-purple-500/10", style: { color: 'var(--color-text)' }, title: "Toggle Theme", children: [isDarkMode ? _jsx(Sun, { size: 20, className: "transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110 text-amber-400" }) : _jsx(Moon, { size: 20, className: "transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110 text-indigo-500" }), _jsx("span", { className: "text-[10px] font-medium leading-tight transition-colors duration-300", children: "Theme" })] }), _jsxs("button", { onClick: () => setCurrentScreen('settings'), className: `group w-16 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-300 ${currentScreen === 'settings'
                            ? 'bg-purple-500/15 text-purple-500 font-bold shadow-sm'
                            : 'opacity-70 hover:opacity-100 hover:bg-purple-500/10'}`, style: currentScreen !== 'settings' ? { color: 'var(--color-text)' } : {}, title: "Settings", children: [_jsx(Settings, { size: 20, className: "transition-transform duration-500 group-hover:rotate-90" }), _jsx("span", { className: "text-[10px] font-medium leading-tight transition-colors duration-300", children: "Settings" })] })] }), _jsxs("div", { className: "flex-1 overflow-auto", children: [currentScreen === 'home' && _jsx(HomeScreen, { onNavigate: (screen, prompt) => {
                            if (prompt)
                                setJourneyPrompt(prompt);
                            setCurrentScreen(screen);
                        } }), currentScreen === 'weekly' && _jsx(WeeklyTrackerScreen, {}), currentScreen === 'stats' && _jsx(StatisticsScreen, {}), currentScreen === 'review' && _jsx(WeeklyReviewScreen, { onBack: handleBack }), currentScreen === 'achievements' && _jsx(AchievementsScreen, { onBack: handleBack }), currentScreen === 'challenges' && _jsx(ChallengesScreen, { onBack: handleBack }), currentScreen === 'journal' && _jsx(JournalScreen, { onBack: handleBack }), currentScreen === 'settings' && _jsx(SettingsScreen, { onBack: handleBack }), currentScreen === 'social' && _jsx(SocialScreen, { onBack: handleBack }), currentScreen === 'goals' && _jsx(GoalTrackerScreen, { onBack: handleBack }), currentScreen === 'routines' && _jsx(RoutineTrackerScreen, { onBack: handleBack }), currentScreen === 'finance' && _jsx(FinanceTrackerScreen, { onBack: handleBack }), currentScreen === 'focus' && _jsx(FocusTimerScreen, { onBack: handleBack }), currentScreen === 'todo' && _jsx(TodoScreen, { onBack: handleBack }), currentScreen === 'gym' && _jsx(GymPlannerScreen, { onBack: handleBack, onNavigateSettings: () => setCurrentScreen('settings') }), currentScreen === 'journeyPlanner' && _jsx(JourneyPlannerScreen, { onBack: handleBack, onComplete: () => setCurrentScreen('journeyDashboard'), initialPrompt: journeyPrompt }), currentScreen === 'journeyDashboard' && _jsx(JourneyDashboardScreen, { onBack: handleBack, onNavigate: (screen, prompt) => {
                            if (prompt)
                                setJourneyPrompt(prompt);
                            setCurrentScreen(screen);
                        } })] }), _jsx(Toaster, { position: "bottom-right", toastOptions: {
                    style: {
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                        padding: '16px',
                    },
                    className: 'backdrop-blur-xl',
                } })] }));
}
