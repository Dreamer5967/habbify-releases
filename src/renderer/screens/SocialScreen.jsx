import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, Share2, Trophy, Users, Search, UserPlus, Loader2, Bell, Check, X, UserMinus, MessageCircle } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { useActivityStore } from '../store/activityStore';
import HeatmapGrid from '../components/HeatmapGrid';
import ChatWindow from '../components/ChatWindow';
import { toast } from 'sonner';
export default function SocialScreen({ onBack }) {
    var _a;
    const { currentProfile } = useProfileStore();
    const { habits } = useHabitStore();
    const { getLeaderboard, getFriendsLeaderboard, searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, getIncomingRequestsProfiles, userProfile } = useAuthStore();
    const { activities, loadGlobalFeed, loading: feedLoading } = useActivityStore();
    const [activeTab, setActiveTab] = useState('feed');
    const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
    const [friendsLeaderboard, setFriendsLeaderboard] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [chatFriend, setChatFriend] = useState(null);
    useEffect(() => {
        loadData();
        loadGlobalFeed();
    }, []);
    const loadData = async () => {
        setLoading(true);
        try {
            const global = await getLeaderboard();
            setGlobalLeaderboard(global);
            const friends = await getFriendsLeaderboard();
            setFriendsLeaderboard(friends);
            const requests = await getIncomingRequestsProfiles();
            setIncomingRequests(requests);
        }
        catch (error) {
            toast.error('Failed to load social data');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSearch = async (e) => {
        if (e)
            e.preventDefault();
        if (!searchQuery.trim())
            return;
        setIsSearching(true);
        try {
            const results = await searchUsers(searchQuery.trim());
            setSearchResults(results);
        }
        catch (error) {
            toast.error('Search failed');
        }
        finally {
            setIsSearching(false);
        }
    };
    const handleSendRequest = async (friendId) => {
        if (friendId === (userProfile === null || userProfile === void 0 ? void 0 : userProfile.uid)) {
            toast.error("You can't add yourself!");
            return;
        }
        try {
            await sendFriendRequest(friendId);
            toast.success('Friend request sent!');
            loadData();
        }
        catch (error) {
            toast.error('Failed to send request');
        }
    };
    const handleAcceptRequest = async (friendId) => {
        try {
            await acceptFriendRequest(friendId);
            toast.success('Friend request accepted!');
            loadData();
        }
        catch (error) {
            toast.error('Failed to accept request');
        }
    };
    const handleRejectRequest = async (friendId) => {
        try {
            await rejectFriendRequest(friendId);
            toast.success('Friend request rejected');
            loadData();
        }
        catch (error) {
            toast.error('Failed to reject request');
        }
    };
    const handleRemoveFriend = async (friendId) => {
        if (!window.confirm('Are you sure you want to remove this friend?'))
            return;
        try {
            await removeFriend(friendId);
            toast.success('Friend removed');
            loadData();
        }
        catch (error) {
            toast.error('Failed to remove friend');
        }
    };
    const activeHabitsCount = habits.filter(h => h.isActive && !h.isArchived).length;
    const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);
    const maxStreak = Math.max(...habits.map(h => h.longestStreak), 0);
    const handleShare = () => {
        if (currentProfile) {
            const stats = `I'm on a ${maxStreak}-day streak with ${activeHabitsCount} active habits on Habbify! 🎯 Level ${currentProfile.level}`;
            navigator.clipboard.writeText(stats);
            toast.success('Stats copied to clipboard! Share them anywhere.');
        }
    };
    const displayList = activeTab === 'global' ? globalLeaderboard : friendsLeaderboard;
    const pendingCount = ((_a = userProfile === null || userProfile === void 0 ? void 0 : userProfile.incomingRequests) === null || _a === void 0 ? void 0 : _a.length) || 0;
    const heatmapData = useMemo(() => {
        const data = {};
        habits.forEach(h => {
            if (h.completionHistory) {
                h.completionHistory.forEach(date => {
                    data[date] = (data[date] || 0) + 1;
                });
            }
        });
        return data;
    }, [habits]);
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900", children: [_jsxs("div", { className: "flex items-center gap-4 p-6 border-b border-slate-700/50", children: [_jsx("button", { onClick: onBack, className: "p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx(ChevronLeft, { size: 24, className: "text-slate-400" }) }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "Social" })] }), _jsx("div", { className: "flex-1 overflow-auto p-6", children: _jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [currentProfile && (_jsxs("div", { className: "bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Your Stats" }), _jsxs("div", { className: "grid grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: currentProfile.level }), _jsx("div", { className: "text-sm opacity-90", children: "Level" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: maxStreak }), _jsx("div", { className: "text-sm opacity-90", children: "Best Streak" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: totalCompletions }), _jsx("div", { className: "text-sm opacity-90", children: "Completions" })] })] }), _jsxs("button", { onClick: handleShare, className: "w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mb-4", children: [_jsx(Share2, { size: 20 }), "Share Achievement"] }), _jsxs("div", { className: "pt-4 border-t border-white/20", children: [_jsx("h3", { className: "text-sm font-semibold mb-2 opacity-90", children: "Your Contribution Heatmap" }), _jsx(HeatmapGrid, { data: heatmapData })] })] })), _jsxs("div", { className: "flex flex-wrap gap-2 bg-slate-800/50 backdrop-blur-sm p-1 rounded-2xl", children: [_jsxs("button", { onClick: () => setActiveTab('feed'), className: `flex-1 min-w-[80px] py-2 text-sm font-semibold rounded-md transition hover:scale-105 active:scale-95 ${activeTab === 'feed' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`, children: [_jsx(Share2, { size: 16, className: "inline mr-1" }), " Feed"] }), _jsxs("button", { onClick: () => setActiveTab('global'), className: `flex-1 min-w-[80px] py-2 text-sm font-semibold rounded-md transition hover:scale-105 active:scale-95 ${activeTab === 'global' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`, children: [_jsx(Trophy, { size: 16, className: "inline mr-1" }), " Global"] }), _jsxs("button", { onClick: () => setActiveTab('friends'), className: `flex-1 min-w-[80px] py-2 text-sm font-semibold rounded-md transition hover:scale-105 active:scale-95 ${activeTab === 'friends' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`, children: [_jsx(Users, { size: 16, className: "inline mr-1" }), " Friends"] }), _jsxs("button", { onClick: () => setActiveTab('add'), className: `flex-1 min-w-[80px] py-2 text-sm font-semibold rounded-md transition hover:scale-105 active:scale-95 ${activeTab === 'add' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`, children: [_jsx(Search, { size: 16, className: "inline mr-1" }), " Find"] }), _jsxs("button", { onClick: () => setActiveTab('requests'), className: `flex-1 min-w-[80px] py-2 text-sm font-semibold rounded-md transition hover:scale-105 active:scale-95 relative ${activeTab === 'requests' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`, children: [_jsx(Bell, { size: 16, className: "inline mr-1" }), " Requests", pendingCount > 0 && (_jsx("span", { className: "absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" }))] })] }), activeTab === 'feed' ? (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Live Feed" }), _jsx("button", { onClick: loadGlobalFeed, className: "text-slate-400 hover:text-white transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx("span", { className: "text-sm", children: "Refresh" }) })] }), feedLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx(Loader2, { size: 32, className: "text-blue-500 animate-spin" }) })) : activities.length === 0 ? (_jsx("div", { className: "text-center py-8 text-slate-400", children: "No recent activity. Be the first!" })) : (_jsx("div", { className: "space-y-4", children: activities.map(activity => (_jsxs("div", { className: "bg-slate-700/50 p-4 rounded-2xl flex gap-4 items-center", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg shrink-0", children: activity.profileName.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsxs("p", { className: "text-white", children: [_jsx("span", { className: "font-semibold text-blue-400", children: activity.profileName }), " ", activity.action, " ", _jsx("span", { className: "font-medium text-slate-200", children: activity.targetName })] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] })] }, activity.id))) }))] })) : activeTab === 'requests' ? (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-xl font-semibold text-white flex items-center gap-2", children: [_jsx(Bell, { size: 24, className: "text-yellow-400" }), "Friend Requests"] }), _jsx("button", { onClick: loadData, className: "text-slate-400 hover:text-white transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx("span", { className: "text-sm", children: "Refresh" }) })] }), loading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx(Loader2, { size: 32, className: "text-blue-500 animate-spin" }) })) : incomingRequests.length === 0 ? (_jsx("div", { className: "text-center py-8 text-slate-400", children: "No pending friend requests." })) : (_jsx("div", { className: "space-y-3", children: incomingRequests.map((user) => (_jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-700/50 rounded-2xl gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg", children: user.name.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-white", children: user.name }), _jsxs("p", { className: "text-sm text-slate-400", children: ["@", user.username || 'user', " \u2022 Level ", user.level] })] })] }), _jsxs("div", { className: "flex items-center gap-2 w-full sm:w-auto", children: [_jsxs("button", { onClick: () => handleAcceptRequest(user.uid), className: "flex-1 sm:flex-none flex items-center justify-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(Check, { size: 16 }), " Accept"] }), _jsxs("button", { onClick: () => handleRejectRequest(user.uid), className: "flex-1 sm:flex-none flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: [_jsx(X, { size: 16 }), " Ignore"] })] })] }, user.uid))) }))] })) : activeTab === 'add' ? (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 animate-fade-in", children: [_jsx("h2", { className: "text-xl font-semibold text-white mb-4", children: "Find Friends" }), _jsxs("form", { onSubmit: handleSearch, className: "flex gap-2 mb-6", children: [_jsx("input", { type: "text", placeholder: "Search by username...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "flex-1 bg-slate-700 text-white px-4 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("button", { type: "submit", disabled: isSearching, className: "bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-2xl transition hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2", children: isSearching ? _jsx(Loader2, { size: 20, className: "animate-spin" }) : _jsx(Search, { size: 20 }) })] }), _jsxs("div", { className: "space-y-3", children: [searchResults.length === 0 && searchQuery && !isSearching && (_jsxs("p", { className: "text-slate-400 text-center py-4", children: ["No users found matching\"", searchQuery, "\""] })), searchResults.map((user) => {
                                            var _a, _b, _c;
                                            const isSelf = user.uid === (userProfile === null || userProfile === void 0 ? void 0 : userProfile.uid);
                                            const isFriend = (_a = userProfile === null || userProfile === void 0 ? void 0 : userProfile.friends) === null || _a === void 0 ? void 0 : _a.includes(user.uid);
                                            const requestSent = (_b = userProfile === null || userProfile === void 0 ? void 0 : userProfile.outgoingRequests) === null || _b === void 0 ? void 0 : _b.includes(user.uid);
                                            const requestReceived = (_c = userProfile === null || userProfile === void 0 ? void 0 : userProfile.incomingRequests) === null || _c === void 0 ? void 0 : _c.includes(user.uid);
                                            return (_jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-700/50 rounded-2xl", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg", children: user.name.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-white", children: user.name }), _jsxs("p", { className: "text-sm text-slate-400", children: ["@", user.username || 'user', " \u2022 Level ", user.level] })] })] }), isSelf ? (_jsx("span", { className: "text-sm text-slate-500 px-3 py-1", children: "You" })) : isFriend ? (_jsxs("span", { className: "text-sm text-blue-400 px-3 py-1 flex items-center gap-1", children: [_jsx(Users, { size: 16 }), " Friends"] })) : requestSent ? (_jsx("span", { className: "text-sm text-yellow-500 px-3 py-1 bg-yellow-500/10 rounded-2xl", children: "Pending" })) : requestReceived ? (_jsxs("button", { onClick: () => handleAcceptRequest(user.uid), className: "bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-2xl transition hover:scale-105 active:scale-95 text-sm flex items-center gap-1", children: [_jsx(Check, { size: 16 }), " Accept"] })) : (_jsx("button", { onClick: () => handleSendRequest(user.uid), className: "p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-2xl transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", title: "Send Friend Request", children: _jsx(UserPlus, { size: 20 }) }))] }, user.uid));
                                        })] })] })) : (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-xl font-semibold text-white flex items-center gap-2", children: [activeTab === 'global' ? _jsx(Trophy, { size: 24, className: "text-yellow-400" }) : _jsx(Users, { size: 24, className: "text-blue-400" }), activeTab === 'global' ? 'Global Leaderboard' : 'Friends Leaderboard'] }), _jsx("button", { onClick: loadData, className: "text-slate-400 hover:text-white transition hover:scale-105 active:scale-95 hover:scale-105 active:scale-95", children: _jsx("span", { className: "text-sm", children: "Refresh" }) })] }), loading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx(Loader2, { size: 32, className: "text-blue-500 animate-spin" }) })) : displayList.length === 0 ? (_jsx("div", { className: "text-center py-8 text-slate-400", children: activeTab === 'friends' ? "You haven't added any friends yet!" : "No data available." })) : (_jsx("div", { className: "space-y-3", children: displayList.map((entry, index) => {
                                        const rank = index + 1;
                                        return (_jsxs("div", { className: `group flex items-center justify-between p-3 rounded-2xl transition-all duration-300 hover:shadow-lg ${rank === 1
                                                ? 'bg-yellow-500/20 border border-yellow-500/30'
                                                : rank === 2
                                                    ? 'bg-slate-700/50 border border-slate-700/50'
                                                    : rank === 3
                                                        ? 'bg-orange-500/20 border border-orange-500/30'
                                                        : 'bg-slate-700 border border-transparent'}`, children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "text-2xl font-bold w-8 text-center", children: rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank }), _jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-white flex items-center gap-2", children: [entry.name, entry.uid === (userProfile === null || userProfile === void 0 ? void 0 : userProfile.uid) && (_jsx("span", { className: "text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full", children: "You" }))] }), _jsxs("p", { className: "text-sm text-slate-400", children: ["@", entry.username || 'user', " \u2022 Level ", entry.level] })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-lg font-bold text-blue-400", children: entry.xp }), _jsx("div", { className: "text-xs text-slate-400", children: "XP" })] }), activeTab === 'friends' && entry.uid !== (userProfile === null || userProfile === void 0 ? void 0 : userProfile.uid) && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setChatFriend({ id: entry.uid, name: entry.name }), className: "flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-2xl text-xs font-semibold transition hover:scale-105 active:scale-95 shadow-sm", title: "Chat with friend", children: [_jsx(MessageCircle, { size: 14 }), "Chat"] }), _jsx("button", { onClick: () => handleRemoveFriend(entry.uid), className: "p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition hover:scale-105 active:scale-95", title: "Remove Friend", children: _jsx(UserMinus, { size: 16 }) })] }))] })] }, entry.uid));
                                    }) }))] }))] }) }), chatFriend && (_jsx(ChatWindow, { friendName: chatFriend.name, friendId: chatFriend.id, onClose: () => setChatFriend(null) }))] }));
}
