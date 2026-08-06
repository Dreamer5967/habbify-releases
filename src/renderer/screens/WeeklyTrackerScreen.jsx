import { useState, useMemo } from 'react';
import { getTrueDate } from '../utils/timeUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { toast } from 'sonner';

export default function WeeklyTrackerScreen() {
    const { habits, updateHabit } = useHabitStore();
    const { currentProfile } = useProfileStore();
    const [currentDate, setCurrentDate] = useState(getTrueDate());

    // Helper for YYYY-MM-DD in local time
    const formatLocalDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Get start of week (Monday)
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, [weekStart]);

    const isCompletedOnDate = (habit, dateStr) => {
        if (habit.completionHistory && Array.isArray(habit.completionHistory)) {
            return habit.completionHistory.includes(dateStr);
        }
        return habit.lastCompletedDate === dateStr;
    };

    // Calculate weekly stats
    const weeklyStats = useMemo(() => {
        let totalCompleted = 0;
        let totalCount = 0;
        const byHabit = [];

        habits.forEach((habit, index) => {
            let habitCompleted = 0;
            const habitTotal = 7;

            weekDays.forEach((day) => {
                const dateStr = formatLocalDate(day);
                if (isCompletedOnDate(habit, dateStr)) {
                    habitCompleted++;
                    totalCompleted++;
                }
                totalCount++;
            });

            const percentage = Math.round((habitCompleted / habitTotal) * 100);
            byHabit.push({
                habitId: habit.id,
                habitName: habit.name,
                icon: habit.icon,
                completed: habitCompleted,
                total: habitTotal,
                percentage,
                color: habit.color,
                index: index + 1,
            });
        });

        const overallPercentage = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0;
        return { completed: totalCompleted, total: totalCount, percentage: overallPercentage, byHabit };
    }, [habits, weekDays]);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const isToday = (date) => {
        const today = getTrueDate();
        return date.toDateString() === today.toDateString();
    };

    const handleToggleCompletion = (habit, dateStr) => {
        const isCurrentlyCompleted = isCompletedOnDate(habit, dateStr);
        const existingHistory = habit.completionHistory || (habit.lastCompletedDate ? [habit.lastCompletedDate] : []);

        if (isCurrentlyCompleted) {
            const newHistory = existingHistory.filter(d => d !== dateStr);
            const newLastDate = newHistory.length > 0 ? [...newHistory].sort().pop() : undefined;
            updateHabit(habit.id, {
                completionHistory: newHistory,
                lastCompletedDate: newLastDate,
                totalCompletions: Math.max(0, (habit.totalCompletions || 1) - 1),
            });
            toast.info(`Undid: ${habit.name}`);
        } else {
            const newHistory = Array.from(new Set([...existingHistory, dateStr])).sort();
            const newLastDate = newHistory[newHistory.length - 1];
            updateHabit(habit.id, {
                completionHistory: newHistory,
                lastCompletedDate: newLastDate,
                totalCompletions: (habit.totalCompletions || 0) + 1,
            });
            toast.success(`Completed: ${habit.name}`);
        }
    };

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const BarChart = () => {
        const maxHeight = 160;
        const sortedHabits = [...weeklyStats.byHabit].sort((a, b) => b.percentage - a.percentage);
        return (
            <div className="w-full h-full flex flex-col min-h-[350px]">
                <div className="flex-1 flex items-end justify-start md:justify-around gap-6 px-4 pb-6 overflow-x-auto no-scrollbar pt-10">
                    {sortedHabits.map((habit) => (
                        <div key={habit.habitId} className="flex flex-col items-center gap-2 flex-shrink-0 w-16">
                            <div className="text-xs font-bold text-slate-300 mb-2">{habit.percentage}%</div>
                            <div className="w-full bg-slate-700 rounded-t-lg relative group flex items-end justify-center">
                                <div
                                    className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80"
                                    style={{
                                        height: `${Math.max(4, (habit.percentage / 100) * maxHeight)}px`,
                                        backgroundColor: habit.color,
                                    }}
                                />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700/50 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition hover:scale-105 active:scale-95 pointer-events-none z-50">
                                    {habit.completed}/{habit.total}
                                </div>
                            </div>
                            <div className="text-center w-full">
                                <div className="text-2xl">{habit.icon}</div>
                                <div className="text-xs text-slate-400 mt-1 truncate">#{habit.index}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-t border-slate-700/50 pt-4 px-4 mt-2 overflow-y-auto max-h-32 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sortedHabits.map((habit) => (
                            <div key={habit.habitId} className="flex items-center gap-2 text-sm min-w-0">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                                <span className="text-slate-300 truncate" title={`${habit.index} ${habit.habitName}`}>
                                    #{habit.index} {habit.habitName}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-white">Weekly Tracker</h1>
                    <p className="text-slate-400 text-sm">Click boxes to mark habits complete/incomplete across any day</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Week Navigation Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={handlePrevWeek}
                        className="p-2 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95 text-slate-300 hover:text-white"
                        title="Previous Week"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                        <p className="text-slate-400 text-sm">Week of</p>
                        <p className="text-2xl font-bold text-white">
                            {formatDate(weekStart)} - {formatDate(weekDays[6])}
                        </p>
                    </div>
                    <button
                        onClick={handleNextWeek}
                        className="p-2 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95 text-slate-300 hover:text-white"
                        title="Next Week"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Overall Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                            <p className="text-slate-400 text-sm mb-2">Overall Completion</p>
                            <p className="text-4xl font-bold text-green-400">{weeklyStats.percentage}%</p>
                            <p className="text-slate-400 text-xs mt-2">{weeklyStats.completed}/{weeklyStats.total}</p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                            <p className="text-slate-400 text-sm mb-2">Active Habits</p>
                            <p className="text-4xl font-bold text-blue-400">{habits.length}</p>
                            <p className="text-slate-400 text-xs mt-2">being tracked</p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                            <p className="text-slate-400 text-sm mb-2">Best Streak</p>
                            <p className="text-4xl font-bold text-purple-400">{Math.max(0, ...habits.map((h) => h.longestStreak))}</p>
                            <p className="text-slate-400 text-xs mt-2">days</p>
                        </div>
                    </div>
                    <div className="lg:col-span-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                        {habits.length === 0 ? (
                            <div className="h-80 flex items-center justify-center text-slate-400">
                                <p>No habits to display</p>
                            </div>
                        ) : (
                            <BarChart />
                        )}
                    </div>
                </div>

                {/* Weekly Habit Spreadsheet */}
                {habits.length === 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
                        <p className="text-slate-400">No habits to track. Create one to get started!</p>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 overflow-x-auto">
                        <div className="grid grid-cols-[200px_repeat(7,1fr)] md:grid-cols-[250px_repeat(7,1fr)] gap-2 mb-4 min-w-[700px]">
                            <div className="col-span-1" />
                            {weekDays.map((day, index) => (
                                <div key={index} className="text-center">
                                    <p className="text-xs font-semibold text-slate-300">{getDayName(day)}</p>
                                    <p className={`text-xs font-bold ${isToday(day) ? 'text-blue-400' : 'text-slate-400'}`}>
                                        {formatDate(day).split(' ')[1]}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 min-w-[700px]">
                            {habits.map((habit, index) => (
                                <div
                                    key={habit.id}
                                    className="grid grid-cols-[200px_repeat(7,1fr)] md:grid-cols-[250px_repeat(7,1fr)] gap-2 items-center py-2 px-3 border-b border-slate-700/50 last:border-b-0 rounded"
                                    style={{
                                        backgroundColor: `${habit.color}10`,
                                        borderLeft: `4px solid ${habit.color}`,
                                    }}
                                >
                                    <div className="col-span-1 flex items-center gap-2 min-w-0">
                                        <span className="text-lg">{habit.icon}</span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-white truncate">#{index + 1}</p>
                                            <p className="text-xs text-slate-400 truncate">{habit.name}</p>
                                        </div>
                                    </div>
                                    {weekDays.map((day, dayIndex) => {
                                        const dateStr = formatLocalDate(day);
                                        const completed = isCompletedOnDate(habit, dateStr);
                                        const today = isToday(day);
                                        return (
                                            <div key={dayIndex} className="flex justify-center">
                                                <button
                                                    onClick={() => handleToggleCompletion(habit, dateStr)}
                                                    className="w-8 h-8 rounded flex items-center justify-center text-xs font-semibold transition hover:scale-105 active:scale-95 cursor-pointer border-2"
                                                    style={
                                                        completed
                                                            ? {
                                                                  backgroundColor: `${habit.color}40`,
                                                                  borderColor: habit.color,
                                                                  color: habit.color,
                                                              }
                                                            : today
                                                                ? {
                                                                      backgroundColor: '#3b82f620',
                                                                      borderColor: '#3b82f6',
                                                                      color: '#93c5fd',
                                                                  }
                                                                : {
                                                                      backgroundColor: '#475569',
                                                                      borderColor: '#334155',
                                                                      color: '#64748b',
                                                                  }
                                                    }
                                                    title={completed ? 'Click to undo' : 'Click to complete'}
                                                >
                                                    {completed ? '✓' : '-'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-[200px_repeat(7,1fr)] md:grid-cols-[250px_repeat(7,1fr)] gap-2 mt-4 pt-4 border-t border-slate-700/50 min-w-[700px]">
                            <div className="col-span-1">
                                <p className="text-xs font-semibold text-slate-300">Total</p>
                            </div>
                            {weekDays.map((day, index) => {
                                const dateStr = formatLocalDate(day);
                                const dayCompleted = habits.filter((h) => isCompletedOnDate(h, dateStr)).length;
                                return (
                                    <div key={index} className="flex justify-center">
                                        <p className="text-xs font-semibold text-green-400">
                                            {dayCompleted}/{habits.length}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
