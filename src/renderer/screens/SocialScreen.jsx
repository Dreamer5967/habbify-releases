import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Trophy, Users, Search, Bell, Share2, Loader2, Check, X, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import HeatmapGrid from '../components/HeatmapGrid';
import ChatWindow from '../components/ChatWindow';
import { toast } from 'sonner';

export default function SocialScreen({ onBack }) {
    const { currentProfile } = useProfileStore();
    const { 
        userProfile, 
        globalLeaderboard, 
        friendsLeaderboard, 
        activities, 
        loading, 
        feedLoading,
        fetchGlobalLeaderboard, 
        getFriendsLeaderboard, 
        fetchGlobalFeed,
        searchUsersByUsername,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        updateUserProfile
    } = useAuthStore();

    const { habits } = useHabitStore();

    const [activeTab, setActiveTab] = useState('feed');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [chatFriend, setChatFriend] = useState(null);

    // Guard safe arrays to prevent blank screen crashes
    const safeHabits = habits || [];
    const safeGlobalLeaderboard = globalLeaderboard || [];
    const safeFriendsLeaderboard = friendsLeaderboard || [];
    const safeActivities = activities || [];

    // Sync profile level/xp to authStore & cloud user profile
    useEffect(() => {
        if (currentProfile && userProfile) {
            if (userProfile.xp !== currentProfile.xp || userProfile.level !== currentProfile.level) {
                updateUserProfile({ xp: currentProfile.xp || 0, level: currentProfile.level || 1 });
            }
        }
        loadData();
        loadGlobalFeed();
    }, [currentProfile?.xp, currentProfile?.level]);

    const loadData = async () => {
        try {
            await fetchGlobalLeaderboard();
            await getFriendsLeaderboard();
            if (userProfile?.incomingRequests?.length) {
                const requestsData = await Promise.all(
                    userProfile.incomingRequests.map(uid => useAuthStore.getState().getUserProfileByUid(uid))
                );
                setIncomingRequests(requestsData.filter(Boolean));
            } else {
                setIncomingRequests([]);
            }
        } catch (e) {
            console.error('Failed to load social data:', e);
        }
    };

    const loadGlobalFeed = async () => {
        try {
            await fetchGlobalFeed();
        } catch (e) {
            console.error('Failed to load global feed:', e);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchUsersByUsername(searchQuery.trim());
            setSearchResults(results || []);
        } catch (e) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async (targetUid) => {
        try {
            await sendFriendRequest(targetUid);
            toast.success('Friend request sent!');
            loadData();
        } catch (error) {
            toast.error(error?.message || 'Failed to send request');
        }
    };

    const handleAcceptRequest = async (senderUid) => {
        try {
            await acceptFriendRequest(senderUid);
            toast.success('Friend request accepted!');
            loadData();
        } catch (error) {
            toast.error('Failed to accept request');
        }
    };

    const handleRejectRequest = async (senderUid) => {
        try {
            await rejectFriendRequest(senderUid);
            toast.info('Friend request ignored');
            loadData();
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    const handleRemoveFriend = async (friendUid) => {
        if (!confirm('Are you sure you want to remove this friend?')) return;
        try {
            await removeFriend(friendUid);
            toast.info('Friend removed');
            loadData();
        } catch (error) {
            toast.error('Failed to remove friend');
        }
    };

    const maxStreak = safeHabits.reduce((max, h) => Math.max(max, h?.currentStreak || 0), 0);
    const totalCompletions = safeHabits.reduce((sum, h) => sum + (h?.totalCompletions || 0), 0);

    const handleShare = () => {
        if (!currentProfile) return;
        const text = `🏆 I'm Level ${currentProfile.level || 1} on Habbify! Streak: ${maxStreak} days. Track habits with me!`;
        if (navigator.share) {
            navigator.share({ title: 'My Habbify Progress', text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text);
            toast.success('Copied stats to clipboard!');
        }
    };

    const displayList = activeTab === 'global' ? safeGlobalLeaderboard : safeFriendsLeaderboard;
    const pendingCount = userProfile?.incomingRequests?.length || 0;

    const heatmapData = useMemo(() => {
        const data = {};
        safeHabits.forEach(h => {
            if (h && h.completionHistory && Array.isArray(h.completionHistory)) {
                h.completionHistory.forEach(date => {
                    data[date] = (data[date] || 0) + 1;
                });
            }
        });
        return data;
    }, [safeHabits]);

    const renderAvatar = (name = 'User', avatarUrl = null, sizeClass = "w-10 h-10") => {
        if (avatarUrl) {
            return <img src={avatarUrl} alt={name} className={`${sizeClass} rounded-full object-cover border border-slate-700/50 shrink-0 shadow-sm`} />;
        }
        return (
            <div className={`${sizeClass} rounded-full bg-blue-500/20 text-blue-400 font-bold text-base flex items-center justify-center border border-blue-500/30 shrink-0`}>
                {(name || 'U').charAt(0).toUpperCase()}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-slate-700/50">
                <button onClick={onBack} className="p-2 hover:bg-slate-800/50 backdrop-blur-sm rounded-2xl transition hover:scale-105 active:scale-95">
                    <ChevronLeft size={24} className="text-slate-400" />
                </button>
                <h1 className="text-2xl font-bold text-white">Social & Friends</h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* User Stats Card */}
                    {currentProfile && (
                        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-4">
                                {renderAvatar(currentProfile.name, currentProfile.photoURL || currentProfile.avatar, "w-14 h-14")}
                                <div>
                                    <h2 className="text-xl font-bold">{currentProfile.name}</h2>
                                    <p className="text-xs text-blue-200">Level {currentProfile.level || 1} • {currentProfile.xp || 0} XP</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4 bg-black/20 p-3 rounded-xl backdrop-blur-sm">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{currentProfile.level || 1}</div>
                                    <div className="text-xs text-blue-200 font-medium">Level</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{maxStreak}</div>
                                    <div className="text-xs text-blue-200 font-medium">Best Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{totalCompletions}</div>
                                    <div className="text-xs text-blue-200 font-medium">Completions</div>
                                </div>
                            </div>
                            <button
                                onClick={handleShare}
                                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 px-4 rounded-xl transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mb-4 text-sm"
                            >
                                <Share2 size={18} /> Share Achievement
                            </button>
                            <div className="pt-3 border-t border-white/20">
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-blue-200">Contribution Heatmap</h3>
                                <HeatmapGrid data={heatmapData} />
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-2 bg-slate-800/50 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-xl transition hover:scale-105 active:scale-95 ${
                                activeTab === 'feed' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Share2 size={14} className="inline mr-1.5" /> Feed
                        </button>
                        <button
                            onClick={() => setActiveTab('global')}
                            className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-xl transition hover:scale-105 active:scale-95 ${
                                activeTab === 'global' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Trophy size={14} className="inline mr-1.5" /> Global
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-xl transition hover:scale-105 active:scale-95 ${
                                activeTab === 'friends' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Users size={14} className="inline mr-1.5" /> Friends
                        </button>
                        <button
                            onClick={() => setActiveTab('add')}
                            className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-xl transition hover:scale-105 active:scale-95 ${
                                activeTab === 'add' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Search size={14} className="inline mr-1.5" /> Find
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-xl transition hover:scale-105 active:scale-95 relative ${
                                activeTab === 'requests' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Bell size={14} className="inline mr-1.5" /> Requests
                            {pendingCount > 0 && (
                                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </button>
                    </div>

                    {/* Feed Tab */}
                    {activeTab === 'feed' ? (
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Live Activity Feed</h2>
                                <button onClick={loadGlobalFeed} className="text-xs text-blue-400 hover:underline">
                                    Refresh
                                </button>
                            </div>
                            {feedLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={28} className="text-blue-500 animate-spin" />
                                </div>
                            ) : safeActivities.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">No recent activity yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {safeActivities.map(activity => (
                                        <div key={activity.id} className="bg-slate-800/60 border border-slate-700/40 p-3.5 rounded-xl flex gap-3 items-center">
                                            {renderAvatar(activity.profileName, activity.photoURL || activity.avatar)}
                                            <div>
                                                <p className="text-sm text-white">
                                                    <span className="font-bold text-blue-400">{activity.profileName}</span> {activity.action}{' '}
                                                    <span className="font-semibold text-slate-200">{activity.targetName}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'requests' ? (
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Bell size={20} className="text-yellow-400" /> Friend Requests
                                </h2>
                                <button onClick={loadData} className="text-xs text-blue-400 hover:underline">Refresh</button>
                            </div>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={28} className="text-blue-500 animate-spin" />
                                </div>
                            ) : incomingRequests.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">No pending friend requests.</div>
                            ) : (
                                <div className="space-y-3">
                                    {incomingRequests.map((reqUser) => (
                                        <div key={reqUser.uid} className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/40 rounded-xl gap-3">
                                            <div className="flex items-center gap-3">
                                                {renderAvatar(reqUser.name, reqUser.photoURL || reqUser.avatar)}
                                                <div>
                                                    <h3 className="font-bold text-white text-sm">{reqUser.name}</h3>
                                                    <p className="text-xs text-slate-400">@{reqUser.username || 'user'} • Level {reqUser.level || 1}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAcceptRequest(reqUser.uid)}
                                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                                                >
                                                    <Check size={14} /> Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(reqUser.uid)}
                                                    className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                                                >
                                                    <X size={14} /> Ignore
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'add' ? (
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 space-y-4">
                            <h2 className="text-lg font-bold text-white">Find Friends</h2>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search by username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-slate-700/60 text-white px-4 py-2 rounded-xl text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search
                                </button>
                            </form>
                            <div className="space-y-3 pt-2">
                                {searchResults.length === 0 && searchQuery && !isSearching && (
                                    <p className="text-slate-400 text-center py-4 text-sm">No users found matching "{searchQuery}"</p>
                                )}
                                {searchResults.map((searchUser) => {
                                    const isSelf = searchUser.uid === userProfile?.uid;
                                    const isFriend = userProfile?.friends?.includes(searchUser.uid);
                                    const requestSent = userProfile?.outgoingRequests?.includes(searchUser.uid);
                                    const requestReceived = userProfile?.incomingRequests?.includes(searchUser.uid);
                                    return (
                                        <div key={searchUser.uid} className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/40 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                {renderAvatar(searchUser.name, searchUser.photoURL || searchUser.avatar)}
                                                <div>
                                                    <h3 className="font-bold text-white text-sm">{searchUser.name}</h3>
                                                    <p className="text-xs text-slate-400">@{searchUser.username || 'user'} • Level {searchUser.level || 1}</p>
                                                </div>
                                            </div>
                                            {isSelf ? (
                                                <span className="text-xs text-slate-500 font-semibold px-3 py-1">You</span>
                                            ) : isFriend ? (
                                                <span className="text-xs text-blue-400 font-semibold px-3 py-1 flex items-center gap-1">
                                                    <Users size={14} /> Friends
                                                </span>
                                            ) : requestSent ? (
                                                <span className="text-xs text-yellow-400 font-semibold px-3 py-1 bg-yellow-500/10 rounded-xl border border-yellow-500/20">Pending</span>
                                            ) : requestReceived ? (
                                                <button
                                                    onClick={() => handleAcceptRequest(searchUser.uid)}
                                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                                                >
                                                    Accept
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSendRequest(searchUser.uid)}
                                                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition"
                                                    title="Send Friend Request"
                                                >
                                                    <UserPlus size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Leaderboards (Global & Friends) */
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    {activeTab === 'global' ? <Trophy size={20} className="text-yellow-400" /> : <Users size={20} className="text-blue-400" />}
                                    {activeTab === 'global' ? 'Global Leaderboard' : 'Friends Leaderboard'}
                                </h2>
                                <button onClick={loadData} className="text-xs text-blue-400 hover:underline">Refresh</button>
                            </div>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 size={28} className="text-blue-500 animate-spin" />
                                </div>
                            ) : displayList.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    {activeTab === 'friends' ? "You haven't added any friends yet!" : "No data available."}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {displayList.map((entry, index) => {
                                        const rank = index + 1;
                                        return (
                                            <div
                                                key={entry.uid}
                                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                                    rank === 1
                                                        ? 'bg-yellow-500/10 border-yellow-500/30'
                                                        : rank === 2
                                                        ? 'bg-slate-800/70 border-slate-700/60'
                                                        : rank === 3
                                                        ? 'bg-amber-500/10 border-amber-500/30'
                                                        : 'bg-slate-800/40 border-slate-700/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-lg font-bold w-6 text-center font-mono text-slate-300">
                                                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                                                    </div>
                                                    {renderAvatar(entry.name, entry.photoURL || entry.avatar)}
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                                            {entry.name}
                                                            {entry.uid === userProfile?.uid && (
                                                                <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">You</span>
                                                            )}
                                                        </h3>
                                                        <p className="text-xs text-slate-400">@{entry.username || 'user'} • Level {entry.level || 1}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-blue-400">{entry.xp || 0}</div>
                                                        <div className="text-[10px] text-slate-400 font-semibold">XP</div>
                                                    </div>
                                                    {activeTab === 'friends' && entry.uid !== userProfile?.uid && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setChatFriend({ id: entry.uid, name: entry.name, avatar: entry.photoURL || entry.avatar })}
                                                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                                                            >
                                                                <MessageCircle size={14} /> Chat
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveFriend(entry.uid)}
                                                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition"
                                                                title="Remove Friend"
                                                            >
                                                                <UserMinus size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Chat Modal */}
            {chatFriend && (
                <ChatWindow
                    friendName={chatFriend.name}
                    friendId={chatFriend.id}
                    friendAvatar={chatFriend.avatar}
                    onClose={() => setChatFriend(null)}
                />
            )}
        </div>
    );
}
