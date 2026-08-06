import { useEffect, useRef } from 'react';
import { getTrueDate } from '../utils/timeUtils';
import { useHabitStore } from '../store/habitStore';
import { toast } from 'sonner';
export default function NotificationManager() {
    const { habits } = useHabitStore();
    const notifiedHabits = useRef(new Set());
    useEffect(() => {
        // Request permission for native notifications
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);
    useEffect(() => {
        // Check every minute if any habit is due
        const intervalId = setInterval(() => {
            if (!('Notification' in window) || Notification.permission !== 'granted')
                return;
            const now = getTrueDate();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTimeString = `${currentHour}:${currentMinute}`;
            const today = now.toISOString().split('T')[0];
            habits.forEach(habit => {
                if (!habit.isActive || habit.isArchived)
                    return;
                // Already completed today?
                if (habit.lastCompletedDate === today)
                    return;
                // Has a reminder time?
                if (!habit.reminderTime)
                    return;
                const habitUniqueId = `${habit.id}-${today}`;
                if (habit.reminderTime === currentTimeString && !notifiedHabits.current.has(habitUniqueId)) {
                    // Trigger Native Notification
                    new Notification('Habbify Reminder', {
                        body: `Time for your habit: ${habit.name}! ${habit.icon}`,
                        icon: '/icon.png' // Fallback icon if needed
                    });
                    toast.info(`Reminder: Time for ${habit.name}!`);
                    notifiedHabits.current.add(habitUniqueId);
                }
            });
        }, 60000); // 1 minute
        return () => clearInterval(intervalId);
    }, [habits]);
    return null; // Headless component
}
