import React, { useState } from 'react';
import { 
    X, Sparkles, Target, Flame, Repeat, DollarSign, Timer, 
    CheckSquare, Dumbbell, BookOpen, Trophy, Users, Globe, 
    Palette, Calendar, Cloud, Compass, TrendingUp, HelpCircle, ChevronRight, Zap
} from 'lucide-react';

const FEATURE_CATEGORIES = [
    { id: 'all', label: 'All Features' },
    { id: 'core', label: 'Core & AI' },
    { id: 'trackers', label: 'Life Trackers' },
    { id: 'analytics', label: 'Analytics & Rewards' },
    { id: 'custom', label: 'Sync & Themes' },
];

const FEATURES_LIST = [
    {
        category: 'core',
        title: 'Home Dashboard & Habit Streaks',
        icon: Flame,
        color: 'from-amber-500 to-orange-500',
        badge: 'Core Feature',
        summary: 'Your central command center for habit tracking, streak preservation, and XP leveling.',
        steps: [
            'Click "Add Habit" to create a new daily or weekly habit with custom icons and difficulty levels.',
            'Click "✓ Complete" on any habit card to log completion today and earn +50 XP.',
            'Keep your streaks alive! Complete habits daily to fill your streak counter.',
            'AI Sparky will automatically pop up with congratulatory pep talks on streak milestones.'
        ],
        tip: 'If you miss a day, completing a habit on day two triggers a special "Bounce Back" AI pep talk!'
    },
    {
        category: 'core',
        title: 'AI Journeys & Goal Roadmap Planner',
        icon: Compass,
        color: 'from-purple-500 to-indigo-500',
        badge: 'Groq AI Powered',
        summary: 'Turn ambitious life dreams into step-by-step actionable roadmaps in seconds.',
        steps: [
            'On the Home screen AI bar, type any goal (e.g., "Get an internship at NVIDIA" or "Learn Japanese in 6 months").',
            'Click "Plan it" to generate a complete multi-week roadmap with target milestones.',
            'Track your active journeys on the Journey Dashboard under Active, Planned, and Completed tabs.'
        ],
        tip: 'Each journey breaks complex goals into daily micro-habits that you can sync directly to your habits list.'
    },
    {
        category: 'trackers',
        title: 'Goal Tracker & Spreadsheets',
        icon: Target,
        color: 'from-pink-500 to-rose-500',
        badge: 'Spreadsheet Tracker',
        summary: 'Set target deadline goals with embedded daily check-in spreadsheets.',
        steps: [
            'Click "New Goal" in the Goal Tracker screen to set start and end dates.',
            'Click "View Tracker" on any goal card to open the interactive daily check-in grid.',
            'Check off daily progress cells to automatically update your goal completion percentage and earn +100 XP upon completion.'
        ],
        tip: 'Goal progress automatically calculates based on total days between start and end dates.'
    },
    {
        category: 'trackers',
        title: 'Routine Tracker',
        icon: Repeat,
        color: 'from-cyan-500 to-blue-500',
        badge: 'Streak Builder',
        summary: 'Build structured daily, weekly, or custom routines to form powerful positive routines.',
        steps: [
            'Create routines for morning rituals, evening wind-downs, or weekly reviews.',
            'Mark routines complete to increment your streak count (+50 XP per routine).',
            'View routine stats and daily completion charts in the built-in analytics drawer.'
        ],
        tip: 'Routines remain active even across timezones thanks to Satellite Timezone Sync.'
    },
    {
        category: 'trackers',
        title: 'Finance Tracker',
        icon: DollarSign,
        color: 'from-emerald-500 to-teal-500',
        badge: 'Budget Manager',
        summary: 'Log income and expenses with multi-currency support and visual pie charts.',
        steps: [
            'Add income or expense entries with categories like Food, Salary, Investment, or Bills.',
            'Select your preferred currency symbol ($, €, £, ₹, ¥, A$, C$) in Settings.',
            'View your Net Balance on the Home Screen and inspect Spending by Category pie charts in stats.'
        ],
        tip: 'Regularly logging transactions unlocks the "Wealth Builder" trophy badge!'
    },
    {
        category: 'trackers',
        title: 'Pomodoro Focus Timer',
        icon: Timer,
        color: 'from-rose-500 to-red-500',
        badge: 'Productivity Timer',
        summary: 'Deep work timer with customizable 25-minute Focus and 5-minute Break cycles.',
        steps: [
            'Press Start to begin your focus session with smooth circular SVG progress countdown.',
            'Upon completing a 25-minute focus block, earn +10 XP and receive a completion toast.',
            'Take a 5-minute break before automatically starting your next focus block.'
        ],
        tip: 'Completing 10 focus sessions unlocks the "Pomodoro Master" trophy!'
    },
    {
        category: 'trackers',
        title: 'To-Do List & Sparky AI Hype',
        icon: CheckSquare,
        color: 'from-sky-500 to-blue-600',
        badge: 'AI Hype Companion',
        summary: 'Manage daily tasks with progress ring indicators and AI Sparky pep-talk popups.',
        steps: [
            'Type tasks into the quick-add bar at the top of the To-Do screen.',
            'Check off completed tasks to advance your daily progress ring (+25 XP per task).',
            'Every 2 completed tasks, Sparky AI will pop up in the bottom right corner with hilarious encouragement!'
        ],
        tip: 'Click "Hype Me More!" inside Sparky\'s bubble to get instant AI motivation anytime.'
    },
    {
        category: 'trackers',
        title: 'Gym Planner & Workout AI',
        icon: Dumbbell,
        color: 'from-orange-500 to-amber-500',
        badge: 'AI Gym Coach',
        summary: 'Log exercise sets, reps, and weights or generate AI workout plans for your fitness goals.',
        steps: [
            'Log your workout sessions with detailed exercise sets, weights, and repetitions.',
            'Use the Workout AI generator to create personalized split routines (Push-Pull-Legs, Full Body, Upper-Lower).',
            'Track your total weight lifted and workout consistency over time.'
        ],
        tip: 'Groq AI provides 70 free calls. You can add your own Groq API key in Settings anytime.'
    },
    {
        category: 'analytics',
        title: '52-Week Heatmap & Statistics',
        icon: TrendingUp,
        color: 'from-green-500 to-emerald-600',
        badge: 'Analytics Engine',
        summary: 'GitHub-style 52-week contribution heatmap tracking your daily habit completions.',
        steps: [
            'Navigate to the Stats screen to inspect your 52-week activity heatmap.',
            'Darker green squares represent days with higher habit completions.',
            'Analyze weekly trends, completion rates, and routine streaks in interactive charts.'
        ],
        tip: 'Hover over any square in the heatmap grid to view exact completion counts and dates.'
    },
    {
        category: 'analytics',
        title: 'Reflective Journal',
        icon: BookOpen,
        color: 'from-indigo-500 to-purple-600',
        badge: 'Mental Wellness',
        summary: 'Log daily thoughts, mental reflections, mood emojis, and custom tags.',
        steps: [
            'Click "New Entry" in the Journal screen to reflect on your day.',
            'Select a mood emoji (😄 😊 😐 😔 😢), write your reflection, and add custom tags.',
            'Save your entry to earn +50 XP and build your mental reflection streak.'
        ],
        tip: 'Writing 20 journal entries unlocks the "Journal Keeper" trophy badge!'
    },
    {
        category: 'analytics',
        title: 'Awards, Trophies & Challenges',
        icon: Trophy,
        color: 'from-yellow-500 to-amber-600',
        badge: 'Gamification',
        summary: 'Trophy Room with glowing unlocked badges, total points, and monthly challenges.',
        steps: [
            'Visit the Awards screen to view your unlocked and locked trophy badges.',
            'Complete specific criteria (e.g., 10 focus sessions, 50 finance entries, 5 friends) to unlock badges.',
            'Join Monthly Challenges to earn bonus XP and climb the global leaderboard.'
        ],
        tip: 'Unlocked badges glow vibrantly in your digital Trophy Room!'
    },
    {
        category: 'analytics',
        title: 'Social & Global Leaderboard',
        icon: Users,
        color: 'from-blue-500 to-cyan-500',
        badge: 'Community',
        summary: 'Add friends, view friend streak feeds, and compete on the global leaderboard.',
        steps: [
            'Search usernames on the Social screen to send friend requests.',
            'View your friends\' live streaks and activity feeds.',
            'Climb the global XP leaderboard to become the #1 Habbify Legend!'
        ],
        tip: 'Adding 5 friends unlocks the "Social Butterfly" trophy!'
    },
    {
        category: 'custom',
        title: 'Satellite Timezone Sync',
        icon: Globe,
        color: 'from-teal-500 to-cyan-600',
        badge: 'Anti-Streak Loss',
        summary: 'Anchors your daily habit resets (midnight) to your native home timezone.',
        steps: [
            'In Settings under "Region & Localization", select your native home timezone.',
            'Habbify uses satellite timezone anchoring so traveling abroad will NEVER break your streaks.',
            'Daily resets occur strictly according to your selected home location.'
        ],
        tip: 'Perfect for frequent travelers or digital nomads!'
    },
    {
        category: 'custom',
        title: '24+ Themes & Custom Theme Creator',
        icon: Palette,
        color: 'from-fuchsia-500 to-pink-600',
        badge: 'Animated Themes',
        summary: 'Switch between 24+ preset themes or design your own custom color theme.',
        steps: [
            'In Settings under "Theme Customization", click any theme tile on 1-click to apply instantly.',
            'Enjoy animated themes like Monsoon (falling rain), Meteor Shower (falling stars), and Bubble Pop.',
            'Click "Show Custom Theme Creator" to pick custom primary, secondary, background, and surface colors!'
        ],
        tip: 'All themes dynamically adapt containers and text for optimal readability in Light & Dark modes.'
    },
    {
        category: 'custom',
        title: 'Calendar Sync & Data Backup',
        icon: Calendar,
        color: 'from-violet-500 to-purple-600',
        badge: 'Productivity Sync',
        summary: 'Export habit schedules to Apple/Windows Calendar (.ics) and download JSON backups.',
        steps: [
            'In Settings under "Productivity Integrations", click "Sync Now" to export an .ics calendar file.',
            'Import the .ics file into Apple Calendar, Google Calendar, or Outlook.',
            'Click "Export Data" under Data & Cloud to save a complete local JSON backup of your profile.'
        ],
        tip: 'Data automatically syncs to your Google Cloud Profile every 30 seconds when signed in.'
    }
];

export default function FeatureGuideModal({ isOpen, onClose }) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFeature, setExpandedFeature] = useState(null);

    if (!isOpen) return null;

    const filteredFeatures = FEATURES_LIST.filter(feature => {
        const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
        const matchesSearch = feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             feature.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div 
                className="relative w-full max-w-4xl max-h-[90vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
                {/* Header Banner */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white relative shrink-0">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition hover:scale-105 active:scale-95"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-300 animate-pulse" />
                            Master Feature Guide
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Know More About Habbify</h2>
                    <p className="text-purple-100 text-sm mt-1 max-w-2xl font-medium">
                        Explore every feature, AI capability, tracking module, and power-user secret in your habit operating system.
                    </p>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 md:p-6 border-b shrink-0 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
                    {/* Category Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden">
                        {FEATURE_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 hover:scale-105 active:scale-95 ${
                                    selectedCategory === cat.id
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'opacity-70 hover:opacity-100'
                                }`}
                                style={selectedCategory !== cat.id ? { backgroundColor: 'color-mix(in srgb, var(--color-background) 70%, var(--color-surface))' } : {}}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search features..."
                            className="w-full md:w-60 px-4 py-2 rounded-full text-xs font-medium focus:outline-none border transition"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 80%, var(--color-surface))', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        />
                    </div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {filteredFeatures.length === 0 ? (
                        <div className="text-center py-12">
                            <HelpCircle size={40} className="mx-auto mb-3 opacity-40" />
                            <p className="font-bold text-lg">No matching features found</p>
                            <p className="text-xs opacity-70 mt-1">Try adjusting your search query or category filter.</p>
                        </div>
                    ) : (
                        filteredFeatures.map((item, index) => {
                            const IconComponent = item.icon;
                            const isExpanded = expandedFeature === index;

                            return (
                                <div 
                                    key={index}
                                    className="rounded-2xl border p-5 transition-all duration-300 hover:shadow-md"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 40%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                                >
                                    <div 
                                        className="flex items-start gap-4 cursor-pointer"
                                        onClick={() => setExpandedFeature(isExpanded ? null : index)}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center shrink-0 text-white shadow-md`}>
                                            <IconComponent size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-extrabold text-lg leading-tight" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-500 border border-purple-500/30">
                                                    {item.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium opacity-80 leading-relaxed">{item.summary}</p>
                                        </div>
                                        <div className={`p-2 rounded-xl transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 80%, var(--color-surface))' }}>
                                            <ChevronRight size={18} className="opacity-60" />
                                        </div>
                                    </div>

                                    {/* Expanded Instructions */}
                                    {isExpanded && (
                                        <div className="mt-5 pt-4 border-t space-y-4 animate-fade-in" style={{ borderColor: 'var(--color-border)' }}>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-wider text-purple-500 mb-2 flex items-center gap-1.5">
                                                    <Zap size={14} /> How To Use
                                                </h4>
                                                <ol className="space-y-2 pl-4 list-decimal text-xs font-medium opacity-90 leading-relaxed">
                                                    {item.steps.map((step, idx) => (
                                                        <li key={idx} className="pl-1">{step}</li>
                                                    ))}
                                                </ol>
                                            </div>

                                            {item.tip && (
                                                <div 
                                                    className="p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium"
                                                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 70%, var(--color-surface))', borderColor: 'var(--color-border)' }}
                                                >
                                                    <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-bold text-amber-500">Pro Tip: </span>
                                                        <span className="opacity-90">{item.tip}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t flex items-center justify-between shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs opacity-60 font-medium">Habbify Master Guide • Version 2.5</p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition hover:scale-105 active:scale-95 shadow-md"
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
}
