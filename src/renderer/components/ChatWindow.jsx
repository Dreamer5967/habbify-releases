import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
export default function ChatWindow({ friendName, friendId, onClose }) {
    const [inputText, setInputText] = useState('');
    const { messages, loading, openChat, sendMessage, closeChat } = useChatStore();
    const currentUserId = useAuthStore((state) => { var _a; return (_a = state.user) === null || _a === void 0 ? void 0 : _a.uid; });
    const messagesEndRef = useRef(null);
    useEffect(() => {
        openChat(friendId, friendName);
        return () => {
            closeChat();
        };
    }, [friendId, friendName, openChat, closeChat]);
    const scrollToBottom = () => {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim())
            return;
        await sendMessage(inputText);
        setInputText('');
    };
    return (_jsxs("div", { className: "fixed bottom-4 right-4 w-80 h-96 bg-slate-800 rounded-t-2xl rounded-bl-2xl rounded-br-md shadow-2xl border border-slate-700 flex flex-col z-50 animate-slide-up", children: [_jsxs("div", { className: "flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/90 rounded-t-2xl", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold", children: friendName.charAt(0).toUpperCase() }), _jsx("span", { className: "font-semibold text-white", children: friendName })] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-white transition rounded-full p-1 hover:bg-slate-700", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar", children: [loading ? (_jsx("div", { className: "flex justify-center items-center h-full", children: _jsx("span", { className: "text-slate-500", children: "Loading messages..." }) })) : messages.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-500 gap-2", children: [_jsx(MessageCircle, { size: 32, className: "opacity-50" }), _jsxs("p", { className: "text-sm", children: ["Say hi to ", friendName, "!"] })] })) : (messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (_jsxs("div", { className: `flex flex-col ${isMe ? 'items-end' : 'items-start'}`, children: [_jsx("div", { className: `px-3 py-2 rounded-2xl max-w-[85%] ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-slate-700 text-white rounded-bl-sm'}`, children: _jsx("p", { className: "text-sm break-words", children: msg.text }) }), _jsx("span", { className: "text-[10px] text-slate-500 mt-1 px-1", children: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }, msg.id));
                    })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "p-3 border-t border-slate-700 bg-slate-800/90", children: _jsxs("form", { onSubmit: handleSend, className: "flex gap-2", children: [_jsx("input", { type: "text", value: inputText, onChange: (e) => setInputText(e.target.value), placeholder: "Type a message...", className: "flex-1 bg-slate-900 text-white text-sm px-3 py-2 rounded-full border border-slate-700 focus:outline-none focus:border-blue-500" }), _jsx("button", { type: "submit", disabled: !inputText.trim(), className: "bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-2 rounded-full transition flex-shrink-0", children: _jsx(Send, { size: 16 }) })] }) })] }));
}
