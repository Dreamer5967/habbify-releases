import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';

export default function ChatWindow({ friendName, friendId, friendAvatar, onClose }) {
    const [inputText, setInputText] = useState('');
    const { messages, loading, openChat, sendMessage, closeChat } = useChatStore();
    const currentUserId = useAuthStore((state) => state.user?.uid) || useProfileStore((state) => state.currentProfile?.id);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (friendId && friendName) {
            openChat(friendId, friendName);
        }
        return () => {
            closeChat();
        };
    }, [friendId, friendName, openChat, closeChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        await sendMessage(inputText);
        setInputText('');
    };

    return (
        <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-[420px] bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col z-50 animate-slide-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_90%,var(--color-border))]">
                <div className="flex items-center gap-3">
                    {friendAvatar ? (
                        <img src={friendAvatar} alt={friendName} className="w-9 h-9 rounded-full object-cover border border-slate-600/50 shadow-sm" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/30">
                            {(friendName || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <span className="font-bold text-white text-sm block leading-tight">{friendName}</span>
                        <span className="text-[10px] text-green-400 font-medium">● Online</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition rounded-xl p-1.5 hover:bg-slate-700/50">
                    <X size={18} />
                </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <span className="text-xs text-slate-400 animate-pulse">Connecting chat...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <MessageCircle size={36} className="opacity-40 text-blue-400" />
                        <p className="text-xs font-medium text-center">Say hi to {friendName}! 👋</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs font-medium shadow-sm ${
                                        isMe
                                            ? 'bg-blue-600 text-white rounded-br-xs'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-xs'
                                    }`}
                                >
                                    <p className="break-words leading-relaxed">{msg.text}</p>
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1 px-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_95%,var(--color-border))]">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Message ${friendName}...`}
                        className="flex-1 bg-slate-900/80 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white p-2.5 rounded-xl transition flex-shrink-0"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
