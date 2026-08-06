import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, Settings } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { toast } from 'sonner';
export default function FocusTimerScreen({ onBack }) {
    const [focusDuration, setFocusDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus');
    const [sessionCount, setSessionCount] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [tempFocus, setTempFocus] = useState(focusDuration);
    const [tempBreak, setTempBreak] = useState(breakDuration);
    const { addXP, currentProfile } = useProfileStore();
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        else if (isActive && timeLeft === 0) {
            setIsActive(false);
            if (mode === 'focus') {
                if (currentProfile) {
                    addXP(currentProfile.id, 10);
                }
                toast.success("Focus session complete! +10 XP");
                setSessionCount((prev) => prev + 1);
                setMode('break');
                setTimeLeft(breakDuration * 60);
            }
            else {
                toast.success("Break complete! Ready to focus?");
                setMode('focus');
                setTimeLeft(focusDuration * 60);
            }
        }
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [isActive, timeLeft, mode, addXP, currentProfile, focusDuration, breakDuration]);
    const toggleTimer = () => {
        setIsActive(!isActive);
    };
    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'focus') {
            setTimeLeft(focusDuration * 60);
        }
        else {
            setTimeLeft(breakDuration * 60);
        }
    };
    const handleSaveSettings = () => {
        setFocusDuration(tempFocus);
        setBreakDuration(tempBreak);
        if (!isActive) {
            setTimeLeft(mode === 'focus' ? tempFocus * 60 : tempBreak * 60);
        }
        setShowSettings(false);
    };
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    // Circular progress calculations
    const totalTime = mode === 'focus' ? focusDuration * 60 : breakDuration * 60;
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    const radius = 140;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    return (_jsxs("div", { className: "flex flex-col min-h-screen bg-[var(--color-background)] text-[var(--color-text)] font-sans p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("button", { onClick: onBack, className: "p-2 bg-[var(--color-surface)] rounded-full hover:bg-black/20 transition-colors", children: _jsx(ChevronLeft, { size: 24 }) }), _jsx("h1", { className: "text-xl font-semibold tracking-wide", children: "Focus Timer" }), _jsx("button", { onClick: () => {
                            setTempFocus(focusDuration);
                            setTempBreak(breakDuration);
                            setShowSettings(true);
                        }, className: "p-2 bg-[var(--color-surface)] rounded-full hover:bg-black/20 transition-colors", children: _jsx(Settings, { size: 20 }) })] }), _jsxs("div", { className: "flex flex-col items-center justify-center flex-1 pb-16", children: [_jsxs("div", { className: "mb-10 flex flex-col items-center", children: [_jsx("span", { className: `text-lg font-medium px-4 py-1.5 rounded-full mb-3 bg-[var(--color-surface)] ${mode === 'focus' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary)]'}`, children: mode === 'focus' ? 'Focus Mode' : 'Break Mode' }), _jsxs("span", { className: "opacity-80 font-medium", children: ["Sessions completed: ", sessionCount] })] }), _jsxs("div", { className: "relative flex items-center justify-center w-[320px] h-[320px] mb-16 group", children: [_jsxs("svg", { className: "absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl", children: [_jsx("circle", { cx: "160", cy: "160", r: radius, className: "stroke-[var(--color-surface)]", strokeWidth: "12", fill: "transparent" }), _jsx("circle", { cx: "160", cy: "160", r: radius, className: `transition-all duration-1000 ease-linear ${mode === 'focus' ? 'stroke-[var(--color-primary)]' : 'stroke-[var(--color-secondary)]'}`, strokeWidth: "12", fill: "transparent", strokeDasharray: circumference, strokeDashoffset: strokeDashoffset, strokeLinecap: "round" })] }), _jsx("div", { className: "flex flex-col items-center z-10", children: _jsx("span", { className: "text-7xl font-bold tracking-wider font-mono", children: formatTime(timeLeft) }) })] }), _jsxs("div", { className: "flex items-center gap-8", children: [_jsx("button", { onClick: toggleTimer, className: `flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.3)] ${isActive
                                    ? 'bg-[var(--color-accent)] text-white hover:opacity-90'
                                    : 'bg-[var(--color-primary)] text-white hover:opacity-90'}`, children: isActive ? _jsx(Pause, { size: 32, fill: "currentColor" }) : _jsx(Play, { size: 32, fill: "currentColor", className: "ml-2" }) }), _jsx("button", { onClick: resetTimer, className: "flex items-center justify-center w-14 h-14 bg-[var(--color-surface)] rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg opacity-80 hover:opacity-100", children: _jsx(RotateCcw, { size: 24 }) })] })] }), showSettings && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in", children: _jsxs("div", { className: "bg-[var(--color-surface)] rounded-3xl p-8 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[var(--color-border)]", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "Timer Settings" }), _jsxs("div", { className: "space-y-6 mb-8", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2 opacity-80", children: "Focus Duration (minutes)" }), _jsx("input", { type: "number", min: "1", max: "120", value: tempFocus, onChange: (e) => setTempFocus(Number(e.target.value) || 1), className: "w-full bg-black/20 border border-[var(--color-border)] rounded-2xl px-4 py-3 outline-none focus:border-[var(--color-primary)] text-lg transition-colors" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2 opacity-80", children: "Break Duration (minutes)" }), _jsx("input", { type: "number", min: "1", max: "60", value: tempBreak, onChange: (e) => setTempBreak(Number(e.target.value) || 1), className: "w-full bg-black/20 border border-[var(--color-border)] rounded-2xl px-4 py-3 outline-none focus:border-[var(--color-primary)] text-lg transition-colors" })] })] }), _jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("button", { onClick: () => setShowSettings(false), className: "flex-1 py-3 rounded-2xl bg-black/20 hover:bg-black/40 transition-colors font-medium", children: "Cancel" }), _jsx("button", { onClick: handleSaveSettings, className: "flex-1 py-3 rounded-2xl bg-[var(--color-primary)] text-white hover:opacity-90 hover:shadow-lg transition-all font-medium", children: "Save Changes" })] })] }) }))] }));
}
