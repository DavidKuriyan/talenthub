'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMessageHistory, sendMessage, subscribeToMessages, deleteMessage } from '@/lib/realtime';

interface Message {
    id: string;
    sender_id: string;
    sender_role?: 'organization' | 'engineer';
    content: string;
    created_at: string;
    is_system_message?: boolean;
    deleted_by?: string[] | null;
}

interface ChatWindowProps {
    matchId: string;
    currentUserId: string;
    currentUserName?: string;
    otherUserName?: string;
    currentUserRole?: 'organization' | 'engineer';
}

/**
 * @feature REALTIME_CHAT
 * @aiNote Premium Chat Window. 
 * Fixes alignment, timestamps, and realtime sync issues.
 */
export default function ChatWindow({
    matchId,
    currentUserId,
    currentUserName = 'You',
    otherUserName = 'Participant',
    currentUserRole = 'organization'
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                setIsLoading(true);
                const history = await fetchMessageHistory(matchId);
                setMessages(history as Message[]);
                setTimeout(scrollToBottom, 100);
            } catch (err) {
                console.error("Failed load history", err);
                setError("Reload to see history");
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, [matchId, scrollToBottom]);

    useEffect(() => {
        if (!currentUserId || !matchId) return;

        const unsubscribe = subscribeToMessages(
            matchId,
            (newMsg) => {
                setMessages((prev) => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg as Message];
                });
                setTimeout(scrollToBottom, 100);
            },
            {
                onMessageUpdate: (updatedMsg) => {
                    setMessages((prev) =>
                        prev.map(m => m.id === updatedMsg.id ? updatedMsg as Message : m)
                    );
                },
                onMessageDelete: (deletedId) => {
                    setMessages((prev) => prev.filter(m => m.id !== deletedId));
                },
                currentUserId
            }
        );

        return () => {
            unsubscribe();
        };
    }, [matchId, scrollToBottom, currentUserId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        try {
            setIsSending(true);
            const content = newMessage;
            setNewMessage('');

            // Optimistic update
            const tempId = 'temp-' + Date.now();
            const tempMsg: Message = {
                id: tempId,
                sender_id: currentUserId,
                sender_role: currentUserRole,
                content: content.trim(),
                created_at: new Date().toISOString(),
                match_id: matchId
            } as any;

            setMessages(prev => [...prev, tempMsg]);
            setTimeout(scrollToBottom, 10);

            await sendMessage(matchId, currentUserId, content, currentUserRole);

            // Remove temp message will happen when real one arrives via realtime
            // But if realtime is slow, we might see duplicates if we don't handle it
        } catch (err) {
            setError("Send failed");
            // Remove temp msg on failure
            setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteMessage(messageId, currentUserId);
            setMessages((prev) => prev.filter(m => m.id !== messageId));
            setContextMenu(null);
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleTouchStart = (messageId: string, e: React.TouchEvent) => {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            setContextMenu({ x: touch.clientX, y: touch.clientY, messageId });
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleContextMenu = (messageId: string, e: React.MouseEvent) => {
        e.preventDefault();
        const msg = messages.find(m => m.id === messageId);
        if (msg?.sender_id === currentUserId) {
            setContextMenu({ x: e.clientX, y: e.clientY, messageId });
        }
    };

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-zinc-900 items-center justify-center p-8">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-500 font-medium animate-pulse">Syncing matches...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-white/5 text-2xl">
                        💬
                    </div>
                    <div>
                        <h3 className="font-black text-white tracking-tight">{otherUserName}</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Real-time Active</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => router.push(`/${currentUserRole}/interviews?matchId=${matchId}`)}
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-xs transition-all border border-white/5 flex items-center gap-2"
                >
                    📹 Join Call
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                        <div className="text-8xl mb-6">📡</div>
                        <p className="text-white text-xl font-black">Waiting for signal...</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUserId;
                        const showMeta = index === 0 || messages[index - 1].sender_id !== msg.sender_id;

                        // Fallback role detection if missing in DB
                        const role = msg.sender_role || (isMe ? currentUserRole : (currentUserRole === 'engineer' ? 'organization' : 'engineer'));

                        if (msg.is_system_message) {
                            return (
                                <div key={msg.id} className="flex justify-center py-2">
                                    <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-white/5">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={msg.id}
                                className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}
                                onContextMenu={(e) => handleContextMenu(msg.id, e)}
                                onTouchStart={(e) => handleTouchStart(msg.id, e)}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                    {showMeta && !isMe && (
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">
                                            {otherUserName}
                                        </span>
                                    )}

                                    <div className={`relative px-5 py-4 shadow-2xl transition-all duration-300 ${isMe
                                            ? (role === 'organization' ? 'bg-indigo-600' : 'bg-emerald-600') + ' text-white rounded-[2rem] rounded-tr-sm'
                                            : 'bg-zinc-800 text-zinc-100 rounded-[2rem] rounded-tl-sm border border-white/5'
                                        }`}>
                                        <p className="text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </p>

                                        {/* Timestamp - ALWAYS VISIBLE as requested */}
                                        <div className={`mt-2 flex items-center gap-2 ${isMe ? 'text-white/50' : 'text-zinc-500'}`}>
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </span>
                                            {isMe && <span className="text-[10px]">✔</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 md:p-6 border-t border-white/5 bg-zinc-900/50">
                <div className="flex gap-3 max-w-5xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Secure channel message..."
                        disabled={isSending}
                        className="flex-1 px-6 py-4 bg-zinc-800 border border-white/5 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm md:text-base font-bold shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                    >
                        {isSending ? '...' : (
                            <>
                                <span className="hidden sm:inline">Send</span>
                                <span className="text-xl">🚀</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Delete Menu */}
            {contextMenu && (
                <div
                    className="fixed z-[999] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[200px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={() => handleDeleteMessage(contextMenu.messageId)}
                        className="w-full px-6 py-4 text-left text-red-400 hover:bg-red-400/10 transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-3"
                    >
                        🗑️ Delete for me
                    </button>
                </div>
            )}
        </div>
    );
}
