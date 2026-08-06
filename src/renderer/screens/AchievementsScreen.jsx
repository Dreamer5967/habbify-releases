import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ChevronLeft, Trophy, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAchievementStore, BADGE_DEFINITIONS } from '../store/achievementStore';
import { useProfileStore } from '../store/profileStore';
export default function AchievementsScreen({ onBack }) {
    const { currentProfile } = useProfileStore();
    const { achievements, unlockedBadges, loadAchievements, getTotalPoints } = useAchievementStore();
    const [allBadges, setAllBadges] = useState([]);
    useEffect(() => {
        if (currentProfile) {
            loadAchievements(currentProfile.id);
        }
    }, [currentProfile, loadAchievements]);
    useEffect(() => {
        const badges = Object.entries(BADGE_DEFINITIONS).map(([key, badge]) => {
            var _a;
            return ({
                id: key,
                ...badge,
                unlocked: unlockedBadges.includes(key),
                unlockedDate: (_a = achievements.find(a => a.criteria === badge.criteria)) === null || _a === void 0 ? void 0 : _a.unlockedAt,
            });
        });
        setAllBadges(badges);
    }, [unlockedBadges, achievements]);
    const totalPoints = getTotalPoints();
    const unlockedCount = unlockedBadges.length;
    const nextLevelPoints = (Math.floor(totalPoints / 100) + 1) * 100;
    const progressPercentage = (totalPoints / nextLevelPoints) * 100;
    const renderIcon = (badge) => {
        const IconComp = LucideIcons[badge.icon];
        if (IconComp) {
            return _jsx(IconComp, { size: 32, className: badge.unlocked ? 'text-white' : 'text-slate-500' });
        }
        return _jsx("div", { className: "text-3xl", children: badge.icon });
    };
    // Categories definition
    const categories = [
        { title: 'Streak Badges', filter: 'streak_' },
        { title: 'Completion Badges', filter: 'completions_' },
        { title: 'Level Badges', filter: 'level_' },
        { title: 'Habit Badges', filter: 'habits_' },
        { title: 'Special Badges', filter: ['focus_10', 'finance_50', 'friends_5', 'journal_20'] },
    ];
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900 text-slate-200", children: [_jsxs("div", { className: "flex items-center gap-4 p-6 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-xl z-10", children: [_jsx("button", { onClick: onBack, className: "p-2 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(ChevronLeft, { size: 24, className: "text-slate-300" }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Trophy, { className: "text-yellow-400", size: 28 }), _jsx("h1", { className: "text-2xl font-bold text-white tracking-wider", children: "Trophy Room" })] })] }), _jsx("div", { className: "flex-1 overflow-auto p-6 bg-slate-900", children: _jsxs("div", { className: "max-w-5xl mx-auto space-y-8", children: [_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-600" }), _jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest", children: "Collector Level" }), _jsxs("div", { className: "flex items-end gap-3 mb-4", children: [_jsx("span", { className: "text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-lg", children: totalPoints }), _jsxs("span", { className: "text-slate-400 font-medium mb-1", children: ["/ ", nextLevelPoints, " pts"] })] }), _jsx("div", { className: "w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50", children: _jsx("div", { className: "h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out", style: { width: `${progressPercentage}%` } }) })] }), _jsxs("div", { className: "flex gap-6 md:border-l md:border-slate-700/50 md:pl-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-2 mx-auto shadow-inner border border-slate-700/50/50", children: _jsx(Trophy, { size: 28, className: "text-yellow-400" }) }), _jsx("div", { className: "text-2xl font-bold text-white", children: unlockedCount }), _jsx("div", { className: "text-xs text-slate-400 font-medium mt-1", children: "UNLOCKED" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mb-2 mx-auto shadow-inner border border-slate-700/50", children: _jsx(Lock, { size: 28, className: "text-slate-500" }) }), _jsx("div", { className: "text-2xl font-bold text-slate-400", children: allBadges.length - unlockedCount }), _jsx("div", { className: "text-xs text-slate-500 font-medium mt-1", children: "LOCKED" })] })] })] })] }), _jsx("div", { className: "space-y-8 pb-8", children: categories.map((category) => {
                                const categoryBadges = allBadges.filter(b => {
                                    if (Array.isArray(category.filter)) {
                                        return category.filter.includes(b.criteria);
                                    }
                                    return b.criteria.startsWith(category.filter);
                                });
                                if (categoryBadges.length === 0)
                                    return null;
                                return (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50", children: [_jsxs("h2", { className: "text-lg font-bold text-white mb-6 flex items-center gap-4", children: [_jsx("div", { className: "h-px bg-slate-700 flex-1" }), _jsx("span", { className: "tracking-widest uppercase text-xs text-slate-400", children: category.title }), _jsx("div", { className: "h-px bg-slate-700 flex-1" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: categoryBadges.map(badge => {
                                                const borderColor = badge.color ? badge.color.replace('bg-', 'border-') : 'border-yellow-500/50';
                                                return (_jsxs("div", { className: `relative rounded-2xl p-4 text-center transition-all duration-300 transform ${badge.unlocked
                                                        ? `bg-slate-800/50 backdrop-blur-sm border-2 ${borderColor} shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:z-10`
                                                        : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 grayscale opacity-60 hover:opacity-80 hover:grayscale-0'}`, children: [!badge.unlocked && (_jsx("div", { className: "absolute top-2 right-2 bg-slate-900 rounded-full p-1 border border-slate-700/50 shadow-lg", children: _jsx(Lock, { size: 12, className: "text-slate-400" }) })), _jsx("div", { className: `mb-3 flex items-center justify-center w-14 h-14 mx-auto rounded-full ${badge.unlocked
                                                                ? (badge.color || 'bg-yellow-500/20')
                                                                : 'bg-slate-700'} ${badge.unlocked ? 'shadow-inner' : ''}`, children: renderIcon(badge) }), _jsx("h3", { className: `font-bold text-[13px] mb-1 leading-tight ${badge.unlocked ? 'text-white' : 'text-slate-400'}`, children: badge.name }), _jsx("p", { className: "text-[11px] text-slate-400 mb-3 h-8 line-clamp-2 leading-tight", children: badge.description }), _jsxs("div", { className: `text-[10px] font-bold py-1 px-2 rounded-full inline-block ${badge.unlocked
                                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                                : 'bg-slate-700 text-slate-500'}`, children: ["+", badge.points, " XP"] }), badge.unlockedDate && (_jsxs("div", { className: "text-[9px] font-bold tracking-wider text-emerald-400 mt-3 bg-emerald-400/10 py-1 rounded", children: ["\u2713 ", new Date(badge.unlockedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })] }))] }, badge.id));
                                            }) })] }, category.title));
                            }) })] }) })] }));
}
