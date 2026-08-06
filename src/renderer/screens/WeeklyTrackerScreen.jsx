import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { toast } from 'sonner';
export default function WeeklyTrackerScreen() {
    const { habits, updateHabit } = useHabitStore();
    const { currentProfile } = useProfileStore();
    const [currentDate, setCurrentDate] = useState(getTrueDate());
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
    // Calculate weekly stats - memoized to prevent infinite loops
    const weeklyStats = useMemo(() => {
        let totalCompleted = 0;
        let totalCount = 0;
        const byHabit = [];
        habits.forEach((habit, index) => {
            let habitCompleted = 0;
            const habitTotal = 7;
            weekDays.forEach((day) => {
                const dateStr = day.toISOString().split('T')[0];
                if (habit.lastCompletedDate === dateStr) {
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
    const isCompletedOnDate = (habit, dateStr) => {
        return habit.lastCompletedDate === dateStr;
    };
    const handleToggleCompletion = (habit, dateStr) => {
        const isCurrentlyCompleted = isCompletedOnDate(habit, dateStr);
        if (isCurrentlyCompleted) {
            updateHabit(habit.id, {
                currentStreak: Math.max(0, habit.currentStreak - 1),
                totalCompletions: Math.max(0, habit.totalCompletions - 1),
                lastCompletedDate: undefined,
            });
            toast.info(`Undid: ${habit.name}`);
        }
        else {
            const today = getTrueTodayString();
            const isTodayDate = dateStr === today;
            if (isTodayDate) {
                updateHabit(habit.id, {
                    currentStreak: habit.currentStreak + 1,
                    longestStreak: Math.max(habit.longestStreak, habit.currentStreak + 1),
                    totalCompletions: habit.totalCompletions + 1,
                    lastCompletedDate: dateStr,
                });
                toast.success(`Completed: ${habit.name}`);
            }
            else {
                updateHabit(habit.id, {
                    lastCompletedDate: dateStr,
                });
                toast.success(`Marked: ${habit.name}`);
            }
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
        return (_jsxs("div", { className: "w-full h-full flex flex-col min-h-[350px]", children: [_jsx("div", { className: "flex-1 flex items-end justify-start md:justify-around gap-6 px-4 pb-6 overflow-x-auto no-scrollbar pt-10", children: sortedHabits.map((habit) => (_jsxs("div", { className: "flex flex-col items-center gap-2 flex-shrink-0 w-16", children: [_jsxs("div", { className: "text-xs font-bold text-slate-300 mb-2", children: [habit.percentage, "%"] }), _jsxs("div", { className: "w-full bg-slate-700 rounded-t-lg relative group flex items-end justify-center", children: [_jsx("div", { className: "w-full rounded-t-lg transition-all duration-300 hover:opacity-80", style: {
                                            height: `${Math.max(4, (habit.percentage / 100) * maxHeight)}px`,
                                            backgroundColor: habit.color,
                                        } }), _jsxs("div", { className: "absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700/50 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition hover:scale-105 active:scale-95 pointer-events-none z-50", children: [habit.completed, "/", habit.total] })] }), _jsxs("div", { className: "text-center w-full", children: [_jsx("div", { className: "text-2xl", children: habit.icon }), _jsxs("div", { className: "text-xs text-slate-400 mt-1 truncate", children: ["#", habit.index] })] })] }, habit.habitId))) }), _jsx("div", { className: "border-t border-slate-700/50 pt-4 px-4 mt-2 overflow-y-auto max-h-32 no-scrollbar", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: sortedHabits.map((habit) => (_jsxs("div", { className: "flex items-center gap-2 text-sm min-w-0", children: [_jsx("div", { className: "w-3 h-3 rounded-full flex-shrink-0", style: { backgroundColor: habit.color } }), _jsxs("span", { className: "text-slate-300 truncate", title: `${habit.index} ${habit.habitName}`, children: ["#", habit.index, " ", habit.habitName] })] }, habit.habitId))) }) })] }));
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", children: [_jsx("header", { className: "bg-slate-800/50 backdrop-blur-sm backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 py-4", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Weekly Tracker" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Click boxes to mark habits complete/incomplete" })] }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-6 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("button", { onClick: handlePrevWeek, className: "p-2 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95 text-slate-300 hover:text-white", children: _jsx(ChevronLeft, { size: 24 }) }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-slate-400 text-sm", children: "Week of" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [formatDate(weekStart), " - ", formatDate(weekDays[6])] })] }), _jsx("button", { onClick: handleNextWeek, className: "p-2 hover:bg-slate-700 rounded-2xl transition hover:scale-105 active:scale-95 text-slate-300 hover:text-white", children: _jsx(ChevronRight, { size: 24 }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8", children: [_jsxs("div", { className: "lg:col-span-1 space-y-4", children: [_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Overall Completion" }), _jsxs("p", { className: "text-4xl font-bold text-green-400", children: [weeklyStats.percentage, "%"] }), _jsxs("p", { className: "text-slate-400 text-xs mt-2", children: [weeklyStats.completed, "/", weeklyStats.total] })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Active Habits" }), _jsx("p", { className: "text-4xl font-bold text-blue-400", children: habits.length }), _jsx("p", { className: "text-slate-400 text-xs mt-2", children: "being tracked" })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6", children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "Best Streak" }), _jsx("p", { className: "text-4xl font-bold text-purple-400", children: Math.max(0, ...habits.map((h) => h.longestStreak)) }), _jsx("p", { className: "text-slate-400 text-xs mt-2", children: "days" })] })] }), _jsx("div", { className: "lg:col-span-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8", children: habits.length === 0 ? (_jsx("div", { className: "h-80 flex items-center justify-center text-slate-400", children: _jsx("p", { children: "No habits to display" }) })) : (_jsx(BarChart, {})) })] }), habits.length === 0 ? (_jsx("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center", children: _jsx("p", { className: "text-slate-400", children: "No habits to track. Create one to get started!" }) })) : (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 overflow-x-auto", children: [_jsxs("div", { className: "grid grid-cols-[200px_repeat(7,1fr)] md:grid-cols-[250px_repeat(7,1fr)] gap-2 mb-4 min-w-[700px]", children: [_jsx("div", { className: "col-span-1" }), weekDays.map((day, index) => (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs font-semibold text-slate-300", children: getDayName(day) }), _jsx("p", { className: `text-xs font-bold ${isToday(day) ? 'text-blue-400' : 'text-slate-400'}`, children: formatDate(day).split(' ')[1] })] }, index)))] }), _jsx("div", { className: "space-y-2 min-w-[700px]", children: habits.map((habit, index) => (_jsxs("div", { className: "grid grid-cols-[200px_repeat(7,1fr)] md:grid-cols-[250px_repeat(7,1fr)] gap-2 items-center py-2 px-3 border-b border-slate-700/50 last:border-b-0 rounded", style: {
                                        backgroundColor: `${habit.color}10`,
                                        borderLeft: `4px solid ${habit.color}`,
                                    }, children: [_jsxs("div", { className: "col-span-1 flex items-center gap-2 min-w-0", children: [_jsx("span", { className: "text-lg", children: habit.icon }), _jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "text-xs font-semibold text-white truncate", children: ["#", index + 1] }), _jsx("p", { className: "text-xs text-slate-400 truncate", children: habit.name })] })] }), weekDays.map((day, dayIndex) => {
                                            const dateStr = day.toISOString().split('T')[0];
                                            const completed = isCompletedOnDate(habit, dateStr);
                                            const today = isToday(day);
                                            return (_jsx("div", { className: "flex justify-center", children: _jsx("button", { onClick: () => handleToggleCompletion(habit, dateStr), className: `w-8 h-8 rounded flex items-center justify-center text-xs font-semibold transition hover:scale-105 active:scale-95 cursor-pointer border-2`, style: completed
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
                                                            }, title: completed ? 'Click to undo' : 'Click to complete', children: completed ? '✓' : '-' }) }, dayIndex));
                                        })] }, habit.id))) }), _jsxs("div", { className: "grid grid-cols-[200px_repeat(7,1fr)] md:grid-cols-[250px_repeat(7,1fr)] gap-2 mt-4 pt-4 border-t border-slate-700/50 min-w-[700px]", children: [_jsx("div", { className: "col-span-1", children: _jsx("p", { className: "text-xs font-semibold text-slate-300", children: "Total" }) }), weekDays.map((day, index) => {
                                        const dateStr = day.toISOString().split('T')[0];
                                        const dayCompleted = habits.filter((h) => isCompletedOnDate(h, dateStr)).length;
                                        return (_jsx("div", { className: "flex justify-center", children: _jsxs("p", { className: "text-xs font-semibold text-green-400", children: [dayCompleted, "/", habits.length] }) }, index));
                                    })] })] }))] })] }));
}
