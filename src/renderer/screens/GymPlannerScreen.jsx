import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, Plus, Dumbbell, Trash2, Send, Bot, Sparkles, User, Settings as SettingsIcon, Check, Activity, TrendingUp, Utensils, Trophy, Search, BookOpen, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { useGymStore } from '../store/gymStore';
import { useSettingsStore } from '../store/settingsStore';
import { toast } from 'sonner';
import muscleMapImg from '../assets/muscle_map.png';

const GLOBAL_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// ─── Exercise Library Data ─────────────────────────────────────────────────
const EXERCISE_LIBRARY = [
  // Chest
  { name: 'Barbell Bench Press', muscle: 'Chest', equipment: 'Barbell', sets: '4', reps: '8' },
  { name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell', sets: '3', reps: '10' },
  { name: 'Decline Bench Press', muscle: 'Chest', equipment: 'Barbell', sets: '3', reps: '10' },
  { name: 'Cable Fly', muscle: 'Chest', equipment: 'Cable', sets: '3', reps: '12' },
  { name: 'Push-Up', muscle: 'Chest', equipment: 'Bodyweight', sets: '3', reps: '15' },
  { name: 'Dumbbell Fly', muscle: 'Chest', equipment: 'Dumbbell', sets: '3', reps: '12' },
  { name: 'Pec Deck Machine', muscle: 'Chest', equipment: 'Machine', sets: '3', reps: '12' },
  // Back
  { name: 'Deadlift', muscle: 'Back', equipment: 'Barbell', sets: '4', reps: '5' },
  { name: 'Pull-Up', muscle: 'Back', equipment: 'Bodyweight', sets: '4', reps: '8' },
  { name: 'Barbell Row', muscle: 'Back', equipment: 'Barbell', sets: '4', reps: '8' },
  { name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cable', sets: '3', reps: '12' },
  { name: 'Seated Cable Row', muscle: 'Back', equipment: 'Cable', sets: '3', reps: '12' },
  { name: 'Single-Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell', sets: '3', reps: '10' },
  { name: 'T-Bar Row', muscle: 'Back', equipment: 'Barbell', sets: '3', reps: '10' },
  { name: 'Chest-Supported Row', muscle: 'Back', equipment: 'Machine', sets: '3', reps: '12' },
  // Shoulders
  { name: 'Overhead Press', muscle: 'Shoulders', equipment: 'Barbell', sets: '4', reps: '8' },
  { name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equipment: 'Dumbbell', sets: '3', reps: '10' },
  { name: 'Lateral Raise', muscle: 'Shoulders', equipment: 'Dumbbell', sets: '4', reps: '15' },
  { name: 'Front Raise', muscle: 'Shoulders', equipment: 'Dumbbell', sets: '3', reps: '12' },
  { name: 'Rear Delt Fly', muscle: 'Shoulders', equipment: 'Dumbbell', sets: '3', reps: '15' },
  { name: 'Face Pull', muscle: 'Shoulders', equipment: 'Cable', sets: '3', reps: '15' },
  { name: 'Arnold Press', muscle: 'Shoulders', equipment: 'Dumbbell', sets: '3', reps: '10' },
  // Biceps
  { name: 'Barbell Curl', muscle: 'Biceps', equipment: 'Barbell', sets: '3', reps: '10' },
  { name: 'Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbell', sets: '3', reps: '12' },
  { name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbell', sets: '3', reps: '12' },
  { name: 'Preacher Curl', muscle: 'Biceps', equipment: 'Barbell', sets: '3', reps: '10' },
  { name: 'Incline Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbell', sets: '3', reps: '12' },
  { name: 'Cable Curl', muscle: 'Biceps', equipment: 'Cable', sets: '3', reps: '12' },
  // Triceps
  { name: 'Tricep Pushdown', muscle: 'Triceps', equipment: 'Cable', sets: '3', reps: '12' },
  { name: 'Skull Crusher', muscle: 'Triceps', equipment: 'Barbell', sets: '3', reps: '10' },
  { name: 'Dips', muscle: 'Triceps', equipment: 'Bodyweight', sets: '3', reps: '12' },
  { name: 'Overhead Tricep Extension', muscle: 'Triceps', equipment: 'Dumbbell', sets: '3', reps: '12' },
  { name: 'Close Grip Bench Press', muscle: 'Triceps', equipment: 'Barbell', sets: '3', reps: '8' },
  { name: 'Cable Overhead Extension', muscle: 'Triceps', equipment: 'Cable', sets: '3', reps: '12' },
  // Forearms
  { name: 'Barbell Wrist Curl', muscle: 'Forearms', equipment: 'Barbell', sets: '3', reps: '15' },
  { name: 'Reverse Barbell Curl', muscle: 'Forearms', equipment: 'Barbell', sets: '3', reps: '12' },
  { name: 'Farmer Carry', muscle: 'Forearms', equipment: 'Dumbbell', sets: '3', reps: '60s' },
  // Legs
  { name: 'Back Squat', muscle: 'Legs', equipment: 'Barbell', sets: '4', reps: '8' },
  { name: 'Leg Press', muscle: 'Legs', equipment: 'Machine', sets: '4', reps: '12' },
  { name: 'Walking Lunge', muscle: 'Legs', equipment: 'Dumbbell', sets: '3', reps: '12' },
  { name: 'Leg Extension', muscle: 'Legs', equipment: 'Machine', sets: '3', reps: '15' },
  { name: 'Hack Squat', muscle: 'Legs', equipment: 'Machine', sets: '3', reps: '10' },
  { name: 'Bulgarian Split Squat', muscle: 'Legs', equipment: 'Dumbbell', sets: '3', reps: '10' },
  { name: 'Romanian Deadlift', muscle: 'Hamstrings', equipment: 'Barbell', sets: '3', reps: '10' },
  { name: 'Leg Curl', muscle: 'Hamstrings', equipment: 'Machine', sets: '3', reps: '12' },
  { name: 'Nordic Curl', muscle: 'Hamstrings', equipment: 'Bodyweight', sets: '3', reps: '6' },
  { name: 'Stiff-Leg Deadlift', muscle: 'Hamstrings', equipment: 'Barbell', sets: '3', reps: '10' },
  { name: 'Calf Raise', muscle: 'Calves', equipment: 'Machine', sets: '4', reps: '20' },
  { name: 'Seated Calf Raise', muscle: 'Calves', equipment: 'Machine', sets: '3', reps: '20' },
  // Glutes
  { name: 'Hip Thrust', muscle: 'Glutes', equipment: 'Barbell', sets: '4', reps: '10' },
  { name: 'Glute Bridge', muscle: 'Glutes', equipment: 'Bodyweight', sets: '3', reps: '15' },
  { name: 'Cable Kickback', muscle: 'Glutes', equipment: 'Cable', sets: '3', reps: '15' },
  { name: 'Sumo Deadlift', muscle: 'Glutes', equipment: 'Barbell', sets: '3', reps: '8' },
  // Core
  { name: 'Plank', muscle: 'Core', equipment: 'Bodyweight', sets: '3', reps: '60s' },
  { name: 'Crunch', muscle: 'Core', equipment: 'Bodyweight', sets: '3', reps: '20' },
  { name: 'Russian Twist', muscle: 'Core', equipment: 'Bodyweight', sets: '3', reps: '20' },
  { name: 'Hanging Leg Raise', muscle: 'Core', equipment: 'Bodyweight', sets: '3', reps: '15' },
  { name: 'Cable Crunch', muscle: 'Core', equipment: 'Cable', sets: '3', reps: '15' },
  { name: 'Ab Wheel Rollout', muscle: 'Core', equipment: 'Equipment', sets: '3', reps: '10' },
  { name: 'Dead Bug', muscle: 'Core', equipment: 'Bodyweight', sets: '3', reps: '10' },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Legs', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

const MUSCLE_COLORS = {
  Chest: '#237371',       // Dark Teal / Cyan-Green
  Back: '#7f5539',        // Cocoa Brown / Lats & Traps
  Shoulders: '#2e8b87',   // Teal-Green / Deltoids
  Biceps: '#8ac926',      // Bright Lime Green
  Triceps: '#2d6a4f',     // Forest Green
  Forearms: '#228fa8',    // Cyan / Turquoise
  Legs: '#d62828',        // Bright Red / Quads
  Hamstrings: '#b5179e',  // Magenta / Purple
  Glutes: '#1d4ed8',      // Royal Blue
  Calves: '#0077b6',      // Deep Teal-Blue
  Core: '#f77f00',        // Warm Orange / Abs
};

// ─── Muscle keyword → muscle group mapping ────────────────────────────────
const KEYWORD_MAP = [
  { keywords: ['bench', 'chest', 'fly', 'pec', 'push-up', 'pushup'], muscle: 'Chest' },
  { keywords: ['row', 'pull', 'deadlift', 'lat', 'pulldown', 't-bar', 'chin'], muscle: 'Back' },
  { keywords: ['press', 'lateral', 'rear delt', 'face pull', 'arnold', 'shoulder', 'overhead'], muscle: 'Shoulders' },
  { keywords: ['bicep', 'hammer', 'preacher'], muscle: 'Biceps' },
  { keywords: ['tricep', 'pushdown', 'dip', 'skull', 'extension', 'close grip'], muscle: 'Triceps' },
  { keywords: ['forearm', 'wrist', 'reverse curl', 'wrist curl', 'farmer'], muscle: 'Forearms' },
  { keywords: ['squat', 'leg press', 'lunge', 'quad', 'hack squat', 'leg extension', 'split squat', 'leg'], muscle: 'Legs' },
  { keywords: ['hamstring', 'rdl', 'leg curl', 'romanian', 'nordic', 'stiff-leg'], muscle: 'Hamstrings' },
  { keywords: ['hip thrust', 'glute', 'sumo', 'kickback'], muscle: 'Glutes' },
  { keywords: ['calf', 'calf raise', 'seated calf'], muscle: 'Calves' },
  { keywords: ['crunch', 'plank', 'ab', 'core', 'sit-up', 'russian twist', 'leg raise', 'rollout', 'dead bug'], muscle: 'Core' },
];

function getMusclesFromExercises(exercises) {
  const muscles = new Set();
  exercises.forEach(ex => {
    const nameLower = ex.name.toLowerCase();
    KEYWORD_MAP.forEach(({ keywords, muscle }) => {
      if (keywords.some(k => nameLower.includes(k))) muscles.add(muscle);
    });
  });
  return muscles;
}

// ─── Direct Muscle Map Image Renderer ───────────────────────────────────────
function MuscleBodyMap() {
  return (
    <div className="flex flex-col items-center justify-center p-3 w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl shadow-xl">
      <img
        src={muscleMapImg}
        alt="Anatomical Muscle Map"
        className="w-full max-w-md h-auto block select-none rounded-xl object-contain"
      />
    </div>
  );
}

// ─── Exercise Library Panel ───────────────────────────────────────────────
function ExerciseLibrary({ plan, onAddExercise }) {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedDay, setSelectedDay] = useState(plan?.days?.[0]?.id || '');

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter(ex => {
      const matchMuscle = selectedMuscle === 'All' || ex.muscle === selectedMuscle;
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      return matchMuscle && matchSearch;
    });
  }, [search, selectedMuscle]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2 border-b border-slate-700/50">
        {/* Day selector */}
        <select
          value={selectedDay}
          onChange={e => setSelectedDay(e.target.value)}
          className="w-full bg-slate-700 text-white text-sm rounded-xl px-3 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
        >
          {plan?.days?.map(d => (
            <option key={d.id} value={d.id}>{d.dayName}</option>
          ))}
        </select>
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-slate-700 text-white text-sm rounded-xl pl-8 pr-3 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        {/* Muscle filter chips */}
        <div className="flex flex-wrap gap-1">
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              onClick={() => setSelectedMuscle(mg)}
              className={`text-xs px-2 py-0.5 rounded-full transition ${selectedMuscle === mg ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              {mg}
            </button>
          ))}
        </div>
      </div>
      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-8">No exercises found</div>
        )}
        {filtered.map((ex, i) => (
          <div key={i} className="flex items-center gap-2 bg-slate-700/40 rounded-xl p-2 hover:bg-slate-700/70 transition group">
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{ex.name}</p>
              <div className="flex gap-1 mt-0.5">
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: (MUSCLE_COLORS[ex.muscle] || '#64748b') + '33', color: MUSCLE_COLORS[ex.muscle] || '#94a3b8' }}>
                  {ex.muscle}
                </span>
                <span className="text-xs text-slate-500">{ex.equipment}</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (!selectedDay) { toast.error('Select a day first'); return; }
                onAddExercise(selectedDay, { name: ex.name, sets: ex.sets, reps: ex.reps, weight: 'BW' });
                toast.success(`Added ${ex.name}!`);
              }}
              className="shrink-0 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition opacity-0 group-hover:opacity-100"
              title="Add to day"
            >
              <Plus size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function GymPlannerScreen({ onBack, onNavigateSettings }) {
  const { currentProfile } = useProfileStore();
  const { plan, loadPlan, addDay, removeDay, updateDayDescription, addExercise, removeExercise, updateExercise, toggleExerciseCompletion, setFullPlan, checkAndUpdatePR } = useGymStore();
  const { settings, updateSettings } = useSettingsStore();

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm your AI Fitness Coach. 🏋️‍♂️\n\n1. Chat with me to design or tweak your workout routine.\n2. When you're happy with the plan, say: **\"Put this plan into my gym planner\"** (or click the quick button below).\n3. I'll automatically organize it across all your days with exercises and nutrition guidance!"
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('ai'); // 'ai' | 'library'
  const [selectedDayForMap, setSelectedDayForMap] = useState(null);
  const [showPRs, setShowPRs] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (currentProfile) loadPlan(currentProfile.id);
  }, [currentProfile, loadPlan]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (plan?.days?.length && !selectedDayForMap) {
      setSelectedDayForMap(plan.days[0].id);
    }
  }, [plan]);

  // Compute muscle highlights
  const selectedDay = plan?.days?.find(d => d.id === selectedDayForMap);
  const activeMuscles = useMemo(() => getMusclesFromExercises(selectedDay?.exercises || []), [selectedDay]);
  const allPlanMuscles = useMemo(() => getMusclesFromExercises(plan?.days?.flatMap(d => d.exercises) || []), [plan]);

  const personalRecords = plan?.personalRecords || {};
  const prEntries = Object.entries(personalRecords);

  const totalExercises = plan?.days?.reduce((acc, d) => acc + d.exercises.length, 0) || 0;
  const completedExercises = plan?.days?.reduce((acc, d) => acc + d.exercises.filter(e => e.completed).length, 0) || 0;
  const progressPercent = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  const strengthExercises = plan?.days?.flatMap(d => d.exercises).filter(e => {
    const match = e.reps.match(/\d+/);
    const r = match ? parseInt(match[0]) : NaN;
    return !isNaN(r) && r < 8;
  }) || [];
  const enduranceExercises = plan?.days?.flatMap(d => d.exercises).filter(e => {
    const match = e.reps.match(/\d+/);
    const r = match ? parseInt(match[0]) : NaN;
    return !isNaN(r) && r >= 8;
  }) || [];

  const completedStrength = strengthExercises.filter(e => e.completed).length;
  const completedEndurance = enduranceExercises.filter(e => e.completed).length;
  const strengthPercent = strengthExercises.length > 0 ? Math.round((completedStrength / strengthExercises.length) * 100) : 0;
  const endurancePercent = enduranceExercises.length > 0 ? Math.round((completedEndurance / enduranceExercises.length) * 100) : 0;

  const handleAddExercise = (dayId) => {
    addExercise(dayId, { name: 'New Exercise', sets: '3', reps: '10', weight: 'BW' });
  };

  const handleWeightChange = (dayId, exId, exName, newWeight) => {
    updateExercise(dayId, exId, { weight: newWeight });
    const isPR = checkAndUpdatePR(exName, newWeight);
    if (isPR) toast.success(`🏆 New PR! ${exName}: ${newWeight}`, { duration: 4000 });
  };

  const callGroqAPI = async (messages, apiKey) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages, temperature: 0.7 })
    });
    if (!response.ok) { const error = await response.json(); throw new Error(error.error?.message || 'API request failed'); }
    return response.json();
  };

  const handleSendMessage = async (overrideText) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : inputMessage;
    if (!textToSend.trim()) return;
    const userKey = settings?.groqApiKey;
    const freeCalls = settings?.freeAiCallsRemaining || 0;
    if (!userKey && freeCalls <= 0) { toast.error('Free AI calls exhausted. Configure your Groq API key in Settings.'); return; }

    const newUserMsg = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);

    const systemPrompt = {
      role: 'system',
      content: `You are an expert fitness coach AI in a gym planner app. IMPORTANT RULES:
1. When the user asks to create, generate, update, add, put, or finalize their gym plan (e.g. "put it in my planner", "add it to my days", "update my plan", "yes finalize it"), you MUST output ONLY a JSON block wrapped in \`\`\`json ... \`\`\` with this exact format:
{"dietGuide":{"title":"...","proteinText":"...","recoveryText":"..."},"days":[{"dayName":"Day 1 - Push","description":"Focus...","exercises":[{"name":"Bench Press","sets":"4","reps":"8","weight":"60kg"}]}]}
2. Rest days MUST still include an empty "exercises" array: {"dayName":"Day 3 - Rest","description":"Rest day...","exercises":[]}
3. All "sets", "reps", and "weight" values MUST be strings.
4. When outputting JSON, do NOT add any text before or after the JSON block.
5. Otherwise, converse normally as a fitness coach.`
    };

    // Sliding window: only send the last 8 messages to avoid token overflow on small models
    const recentMessages = updatedMessages.slice(-8);

    try {
      const apiKey = userKey || GLOBAL_GROQ_KEY;
      if (!apiKey) throw new Error('No API Key configured. Please add it in Settings.');
      const response = await callGroqAPI([systemPrompt, ...recentMessages], apiKey);
      const assistantMessage = response.choices[0].message.content;
      setMessages([...updatedMessages, { role: 'assistant', content: assistantMessage }]);
      if (!userKey) updateSettings({ freeAiCallsRemaining: Math.max(0, freeCalls - 1) });

      const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonStr = jsonMatch?.[1] || '';
      if (!jsonStr) {
        const fb = assistantMessage.indexOf('{');
        const lb = assistantMessage.lastIndexOf('}');
        if (fb !== -1 && lb > fb) jsonStr = assistantMessage.slice(fb, lb + 1);
      }
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          const days = Array.isArray(parsed) ? parsed : parsed.days;
          if (Array.isArray(days) && days.length > 0) {
            setFullPlan(days, parsed.dietGuide);
            toast.success('Gym plan updated by AI!');
          }
        } catch (e) { console.error('JSON parse fail', e); }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to connect to AI coach.');
      setMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please configure your Groq API key in Settings.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!plan) return <div className="h-full bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-xl transition">
            <ChevronLeft size={22} className="text-slate-400" />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="text-blue-400" size={20} /> Gym Planner
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPRs(v => !v)} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition ${showPRs ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            <Trophy size={16} /> PRs {prEntries.length > 0 && <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-1.5 rounded-full">{prEntries.length}</span>}
          </button>
          <button onClick={addDay} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-xl transition">
            <Plus size={16} /> Add Day
          </button>
        </div>
      </div>

      {/* PR Panel */}
      {showPRs && (
        <div className="mx-4 mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-yellow-400 font-bold flex items-center gap-2"><Trophy size={16} /> Personal Records</h3>
            <button onClick={() => setShowPRs(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
          </div>
          {prEntries.length === 0 ? (
            <p className="text-slate-400 text-sm">No PRs yet. Update a weight on a completed exercise to track your best!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {prEntries.map(([name, pr]) => (
                <div key={name} className="bg-slate-800 rounded-xl p-2.5 border border-yellow-500/20">
                  <p className="text-white text-xs font-semibold capitalize truncate">{name}</p>
                  <p className="text-yellow-400 text-sm font-bold">{pr.weight}</p>
                  <p className="text-slate-500 text-xs">{pr.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Plan + Muscle Map */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-5">

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Overall', pct: progressPercent, done: completedExercises, total: totalExercises, color: 'blue', Icon: TrendingUp },
                { label: 'Strength', pct: strengthPercent, done: completedStrength, total: strengthExercises.length, color: 'purple', Icon: Dumbbell },
                { label: 'Endurance', pct: endurancePercent, done: completedEndurance, total: enduranceExercises.length, color: 'emerald', Icon: Activity },
              ].map(({ label, pct, done, total, color, Icon }) => (
                <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon size={14} className={`text-${color}-400`} />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                  </div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xl font-bold text-white">{pct}%</span>
                    <span className="text-xs text-slate-500">{done}/{total}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className={`bg-${color}-500 h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Muscle Body Map Section */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-700/40">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity size={18} className="text-orange-400" /> Muscle Map & Targeted Groups
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Viewing Day:</span>
                  <select
                    value={selectedDayForMap || ''}
                    onChange={e => setSelectedDayForMap(e.target.value)}
                    className="bg-slate-700/90 text-white text-xs font-medium rounded-lg px-3 py-1.5 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    {plan.days.map(d => <option key={d.id} value={d.id}>{d.dayName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Box: Muscle Diagram Picture */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center">
                  <MuscleBodyMap />
                </div>

                {/* Right Box: Targeted Muscles & Color Index (Separated Box) */}
                <div className="lg:col-span-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
                  {/* Targeted Muscles Today */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                        Today's Targeted Muscles ({selectedDay?.dayName || 'Day'})
                      </h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {activeMuscles.size} Groups
                      </span>
                    </div>

                    {activeMuscles.size === 0 ? (
                      <div className="bg-slate-900/40 rounded-xl p-4 text-center border border-slate-700/40">
                        <p className="text-slate-400 text-sm font-medium">No exercises scheduled for this day.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Array.from(activeMuscles).map(muscle => {
                          const dayExs = selectedDay?.exercises?.filter(ex => {
                            const n = ex.name.toLowerCase();
                            return KEYWORD_MAP.find(k => k.muscle === muscle)?.keywords.some(kw => n.includes(kw));
                          }) || [];
                          const done = dayExs.filter(e => e.completed).length;
                          const pct = dayExs.length > 0 ? Math.round((done / dayExs.length) * 100) : 0;
                          const color = MUSCLE_COLORS[muscle] || '#f97316';

                          return (
                            <div key={muscle} className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-4 h-4 rounded-full flex-shrink-0 shadow-md border border-white/20" style={{ backgroundColor: color }} />
                                  <span className="text-sm font-bold text-white">{muscle}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-400">{done}/{dayExs.length} Done</span>
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${color}30`, color, border: `1px solid ${color}50` }}>
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-700/70 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-500 shadow-sm"
                                  style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Full Muscle Color Diagram Index */}
                  <div className="pt-4 border-t border-slate-700/60">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                      Muscle Diagram Color Index
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(MUSCLE_COLORS).map(([muscle, color]) => {
                        const isTargetedToday = activeMuscles.has(muscle);
                        return (
                          <div
                            key={muscle}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              isTargetedToday
                                ? 'bg-slate-700/90 border border-slate-600 text-white shadow-md'
                                : 'bg-slate-900/50 border border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm border border-white/10"
                                style={{ backgroundColor: color }}
                              />
                              <span className="truncate">{muscle}</span>
                            </div>
                            {isTargetedToday && (
                              <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40">
                                Target
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diet Guide */}
            {plan.dietGuide && (
              <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="text-orange-400" size={18} />
                  <h3 className="font-bold text-orange-400">{plan.dietGuide.title || 'Personalized Diet & Nutrition Guide'}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/50">
                    <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-1">Protein & Macros</h4>
                    <p className="text-xs text-slate-300">{plan.dietGuide.proteinText}</p>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/50">
                    <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-1">Hydration & Recovery</h4>
                    <p className="text-xs text-slate-300">{plan.dietGuide.recoveryText}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Days */}
            {plan.days.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700/50">
                <Dumbbell size={40} className="mx-auto mb-3 text-slate-600" />
                <p className="text-base">No days yet.</p>
                <p className="text-sm text-slate-500 mt-1">Click "Add Day" or ask the AI Coach to generate your split.</p>
              </div>
            )}

            {plan.days.map((day) => (
              <div key={day.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 shadow-lg group">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-white">{day.dayName}</h3>
                  <button onClick={() => removeDay(day.id)} className="text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-700 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
                <textarea
                  value={day.description}
                  onChange={(e) => updateDayDescription(day.id, e.target.value)}
                  placeholder="E.g., Focus on slow eccentrics, chest & triceps..."
                  className="w-full mb-3 bg-slate-700/50 text-white rounded-xl p-2 text-sm border border-slate-700/50 focus:border-blue-500 focus:outline-none resize-none h-14"
                />
                <div className="space-y-2">
                  {day.exercises.map((ex) => (
                    <div key={ex.id} className={`flex items-center gap-2 p-2 rounded-xl border ${ex.completed ? 'bg-slate-800/50 border-slate-700/30 opacity-70' : 'bg-slate-700/30 border-slate-700/50'}`}>
                      {/* Checkbox — isolated, no hover scale on parent */}
                      <button
                        onClick={() => toggleExerciseCompletion(day.id, ex.id, !ex.completed)}
                        className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border-2 transition-all ${ex.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 hover:border-green-400'}`}
                      >
                        {ex.completed && <Check size={12} />}
                      </button>
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => updateExercise(day.id, ex.id, { name: e.target.value })}
                        className={`flex-1 bg-transparent font-medium focus:outline-none focus:bg-slate-700 px-2 py-1 rounded ${ex.completed ? 'text-slate-400 line-through' : 'text-white'}`}
                        placeholder="Exercise name"
                      />
                      <input type="text" value={ex.sets} onChange={(e) => updateExercise(day.id, ex.id, { sets: e.target.value })}
                        className="w-12 bg-slate-700 text-center text-slate-300 text-sm focus:outline-none px-1 py-1 rounded" placeholder="Sets" />
                      <span className="text-slate-500 text-xs">×</span>
                      <input type="text" value={ex.reps} onChange={(e) => updateExercise(day.id, ex.id, { reps: e.target.value })}
                        className="w-14 bg-slate-700 text-center text-slate-300 text-sm focus:outline-none px-1 py-1 rounded" placeholder="Reps" />
                      <input
                        type="text"
                        value={ex.weight}
                        onChange={(e) => handleWeightChange(day.id, ex.id, ex.name, e.target.value)}
                        className="w-16 bg-slate-700 text-center text-emerald-400 text-sm focus:outline-none px-1 py-1 rounded"
                        placeholder="Weight"
                      />
                      <button onClick={() => removeExercise(day.id, ex.id)} className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => handleAddExercise(day.id)}
                    className="w-full py-2 border border-dashed border-slate-700/50 text-slate-400 rounded-xl hover:border-blue-500 hover:text-blue-400 transition flex items-center justify-center gap-2 text-sm">
                    <Plus size={14} /> Add Exercise
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-88 border-l border-slate-700/50 bg-slate-800/30 flex flex-col" style={{ width: '340px' }}>
          {/* Sidebar Tab Switcher */}
          <div className="flex border-b border-slate-700/50 shrink-0">
            <button
              onClick={() => setSidebarTab('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${sidebarTab === 'ai' ? 'text-purple-400 border-b-2 border-purple-500 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
            >
              <Sparkles size={15} /> AI Coach
            </button>
            <button
              onClick={() => setSidebarTab('library')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${sidebarTab === 'library' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
            >
              <BookOpen size={15} /> Library
            </button>
          </div>

          {/* AI Coach Tab */}
          {sidebarTab === 'ai' && (
            <>
              {/* Instructions & Status Banner */}
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-purple-950/40 via-slate-900 to-blue-950/40 border-b border-purple-500/20 text-xs space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                    <Sparkles size={13} className="text-purple-400" />
                    <span>How to Apply AI Plan</span>
                  </div>
                  {!settings?.groqApiKey && (
                    <div
                      className={`text-[10px] px-2 py-0.5 rounded-full cursor-pointer hover:bg-slate-700 transition flex items-center gap-1 ${(settings?.freeAiCallsRemaining || 0) === 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400 font-medium'}`}
                      onClick={onNavigateSettings} title="Free calls remaining"
                    >
                      {settings?.freeAiCallsRemaining || 0} calls left <SettingsIcon size={10} />
                    </div>
                  )}
                </div>
                <p className="text-slate-300 text-[11px] leading-snug">
                  1. Discuss your routine with the coach.<br />
                  2. Tell the coach <span className="text-purple-300 font-bold">"Put this plan into my gym planner"</span> or use the quick buttons below.<br />
                  3. The app will automatically populate all days & exercises!
                </p>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {messages.map((msg, idx) => {
                  const hasPlanJson = msg.role === 'assistant' && (msg.content.includes('```json') || (msg.content.includes('"days"') && msg.content.includes('"dayName"')));
                  return (
                    <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                        {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                      </div>
                      <div className={`p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-200 rounded-tl-none'}`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {hasPlanJson && (
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                const jm = msg.content.match(/```json\s*([\s\S]*?)\s*```/);
                                let str = jm?.[1] || '';
                                if (!str) {
                                  const fb = msg.content.indexOf('{');
                                  const lb = msg.content.lastIndexOf('}');
                                  if (fb !== -1 && lb > fb) str = msg.content.slice(fb, lb + 1);
                                }
                                const parsed = JSON.parse(str);
                                const days = Array.isArray(parsed) ? parsed : parsed.days;
                                if (Array.isArray(days) && days.length > 0) {
                                  setFullPlan(days, parsed.dietGuide);
                                  toast.success('Gym plan applied to planner!');
                                }
                              } catch (e) {
                                toast.error('Could not apply plan from message.');
                              }
                            }}
                            className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-xs shadow-md transition"
                          >
                            <Check size={14} /> Apply this Plan to Gym Planner
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shrink-0"><Bot size={14} className="text-white" /></div>
                    <div className="p-2.5 bg-slate-700 rounded-2xl rounded-tl-none flex items-center gap-1">
                      {[0, 0.2, 0.4].map((d, i) => <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Action Prompt Chips */}
              <div className="px-3 pt-2 pb-1 border-t border-slate-700/50 flex gap-1.5 overflow-x-auto custom-scrollbar shrink-0 bg-slate-900/40">
                <button
                  type="button"
                  onClick={() => handleSendMessage("Put this plan into my gym planner for all the days")}
                  className="whitespace-nowrap bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-purple-500/40 transition flex items-center gap-1 shrink-0"
                >
                  <Sparkles size={11} /> Apply Plan to Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("Create a 4-day Push Pull Legs split for muscle building")}
                  className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 transition shrink-0"
                >
                  4-Day PPL Split
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("Create a 5-day Cardio & Core lean out plan")}
                  className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 transition shrink-0"
                >
                  Cardio & Core
                </button>
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-700/50 shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Ask coach or type 'Put this plan in my gym planner'..."
                    className="flex-1 bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none resize-none"
                    rows={2}
                  />
                  <button onClick={() => handleSendMessage()} disabled={isTyping || !inputMessage.trim()}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50 shrink-0">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Library Tab */}
          {sidebarTab === 'library' && (
            <ExerciseLibrary plan={plan} onAddExercise={addExercise} />
          )}
        </div>
      </div>
    </div>
  );
}
