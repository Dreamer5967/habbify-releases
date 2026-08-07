import React, { useEffect, useState } from 'react';
import { ChevronLeft, Trophy, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAchievementStore, BADGE_DEFINITIONS } from '../store/achievementStore';
import { useProfileStore } from '../store/profileStore';
import { useHabitStore } from '../store/habitStore';
import { useJournalStore } from '../store/journalStore';
import { useFinanceStore } from '../store/financeStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function AchievementsScreen({ onBack }) {
    const { currentProfile } = useProfileStore();
    const { achievements, unlockedBadges, loadAchievements, checkAndUnlockBadges, getTotalPoints } = useAchievementStore();
    const { habits } = useHabitStore();
    const { entries: journalEntries } = useJournalStore();
    const { entries: financeEntries } = useFinanceStore();
    const { userProfile } = useAuthStore();

    const [allBadges, setAllBadges] = useState([]);

    useEffect(() => {
        if (currentProfile) {
            loadAchievements(currentProfile.id);

            const safeHabits = habits || [];
            const maxStreak = safeHabits.reduce((max, h) => Math.max(max, h?.currentStreak || 0), 0);
            const totalCompletions = safeHabits.reduce((sum, h) => sum + (h?.totalCompletions || 0), 0);
            const activeHabits = safeHabits.filter(h => h.isActive).length;

            const stats = {
                maxStreak,
                totalCompletions,
                currentLevel: currentProfile.level || 1,
                currentXp: currentProfile.xp || 0,
                activeHabits,
                journalCount: (journalEntries || []).length,
                financeCount: (financeEntries || []).length,
                friendsCount: (userProfile?.friends || []).length,
            };

            const newlyUnlocked = checkAndUnlockBadges(currentProfile.id, stats);
            if (newlyUnlocked && newlyUnlocked.length > 0) {
                newlyUnlocked.forEach(badgeId => {
                    const badgeDef = BADGE_DEFINITIONS[badgeId];
                    if (badgeDef) {
                        toast.success(`🏆 Badge Unlocked: ${badgeDef.name}! (+${badgeDef.points} pts)`);
                    }
                });
            }
        }
    }, [currentProfile, loadAchievements, checkAndUnlockBadges, habits, journalEntries, financeEntries, userProfile?.friends]);

    useEffect(() => {
        const badges = Object.entries(BADGE_DEFINITIONS).map(([key, badge]) => {
            const unlocked = unlockedBadges.includes(key);
            const unlockedItem = achievements.find(a => a.criteria === badge.criteria || a.id.startsWith(key));
            return {
                id: key,
                ...badge,
                unlocked,
                unlockedDate: unlockedItem?.unlockedAt,
            };
        });
        setAllBadges(badges);
    }, [unlockedBadges, achievements]);

    const totalPoints = getTotalPoints();
    const unlockedCount = unlockedBadges.length;
    const nextLevelPoints = (Math.floor(totalPoints / 100) + 1) * 100;
    const progressPercentage = Math.min(100, (totalPoints / nextLevelPoints) * 100);

    const renderIcon = (badge) => {
        const IconComp = LucideIcons[badge.icon];
        if (IconComp) {
            return <IconComp size={32} className={badge.unlocked ? 'text-white' : 'text-slate-500'} />;
        }
        return <div className="text-3xl">{badge.icon}</div>;
    };

    const categories = [
        { title: 'Streak Badges', filter: 'streak_' },
        { title: 'Completion Badges', filter: 'completions_' },
        { title: 'Level Badges', filter: 'level_' },
        { title: 'Habit Badges', filter: 'habits_' },
        { title: 'Special Badges', filter: ['focus_10', 'finance_50', 'friends_5', 'journal_20'] },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-xl z-10">
                <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95">
                    <ChevronLeft size={24} className="text-slate-300" />
                </button>
                <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-400" size={28} />
                    <h1 className="text-2xl font-bold text-white tracking-wider">Trophy Room</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6 bg-slate-900 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Level Progress Banner */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-600" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h2 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Collector Level</h2>
                                <div className="flex items-end gap-3 mb-4">
                                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-lg">
                                        {totalPoints}
                                    </span>
                                    <span className="text-slate-400 font-medium mb-1">/ {nextLevelPoints} pts</span>
                                </div>
                                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                                    <div
                                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-6 md:border-l md:border-slate-700/50 md:pl-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-2 mx-auto shadow-inner border border-slate-700/50">
                                        <Trophy size={28} className="text-yellow-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">{unlockedCount}</div>
                                    <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-1">UNLOCKED</div>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mb-2 mx-auto shadow-inner border border-slate-700/50">
                                        <Lock size={28} className="text-slate-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-400">{allBadges.length - unlockedCount}</div>
                                    <div className="text-[10px] text-slate-500 font-bold tracking-wider mt-1">LOCKED</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badge Categories Grid */}
                    <div className="space-y-8 pb-8">
                        {categories.map((category) => {
                            const categoryBadges = allBadges.filter(b => {
                                if (Array.isArray(category.filter)) {
                                    return category.filter.includes(b.criteria);
                                }
                                return b.criteria.startsWith(category.filter);
                            });
                            if (categoryBadges.length === 0) return null;
                            return (
                                <div key={category.title} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-4">
                                        <div className="h-px bg-slate-700 flex-1" />
                                        <span className="tracking-widest uppercase text-xs text-slate-400">{category.title}</span>
                                        <div className="h-px bg-slate-700 flex-1" />
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {categoryBadges.map(badge => {
                                            const borderColor = badge.color ? badge.color.replace('bg-', 'border-') : 'border-yellow-500/50';
                                            return (
                                                <div
                                                    key={badge.id}
                                                    className={`relative rounded-2xl p-4 text-center transition-all duration-300 transform ${
                                                        badge.unlocked
                                                            ? `bg-slate-800/50 backdrop-blur-sm border-2 ${borderColor} shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:z-10`
                                                            : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 grayscale opacity-60 hover:opacity-80 hover:grayscale-0'
                                                    }`}
                                                >
                                                    {!badge.unlocked && (
                                                        <div className="absolute top-2 right-2 bg-slate-900 rounded-full p-1 border border-slate-700/50 shadow-lg">
                                                            <Lock size={12} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`mb-3 flex items-center justify-center w-14 h-14 mx-auto rounded-full ${
                                                            badge.unlocked ? (badge.color || 'bg-yellow-500/20') : 'bg-slate-700'
                                                        } ${badge.unlocked ? 'shadow-inner' : ''}`}
                                                    >
                                                        {renderIcon(badge)}
                                                    </div>
                                                    <h3 className={`font-bold text-[13px] mb-1 leading-tight ${badge.unlocked ? 'text-white' : 'text-slate-400'}`}>
                                                        {badge.name}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400 mb-3 h-8 line-clamp-2 leading-tight">
                                                        {badge.description}
                                                    </p>
                                                    <div
                                                        className={`text-[10px] font-bold py-1 px-2 rounded-full inline-block ${
                                                            badge.unlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-500'
                                                        }`}
                                                    >
                                                        +{badge.points} XP
                                                    </div>
                                                    {badge.unlockedDate && (
                                                        <div className="text-[9px] font-bold tracking-wider text-emerald-400 mt-3 bg-emerald-400/10 py-1 rounded">
                                                            ✓ {new Date(badge.unlockedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
