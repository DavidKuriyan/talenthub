'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { fetchMessageHistory, sendMessage, subscribeToMessages, deleteMessage } from '@/lib/realtime';
import { MessageBubble } from './MessageBubble';

interface Message {
    id: string;
    match_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_system_message?: boolean;
    deleted_for?: string[] | null;
    read_at?: string | null;
    sender?: {
        full_name?: string;
        role?: string;
    };
}

interface ChatWindowProps {
    matchId: string;
    currentUserId: string;
    currentUserName?: string;
    otherUserName?: string;
    currentUserRole?: 'organization' | 'engineer';
    tenantId?: string; // Recommended for strict realtime isolation
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
    currentUserRole = 'organization',
    tenantId
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

                // Mark as read
                if (currentUserId) {
                    await (supabase as any).rpc("mark_messages_read", {
                        p_match_id: matchId,
                        p_user_id: currentUserId
                    });
                }
            } catch (err) {
                console.error("Failed load history", err);
                setError("Reload to see history");
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, [matchId, scrollToBottom, currentUserId]);

    useEffect(() => {
        if (!currentUserId || !matchId) return;

        const unsubscribe = subscribeToMessages(
            matchId,
            async (newMsg) => {
                setMessages((prev) => {
                    // 1. If exact ID exists, ignore
                    if (prev.find(m => m.id === newMsg.id)) return prev;

                    // 2. Identify and remove any matching temp message
                    // (Same content, same sender, temp ID)
                    const tempMatch = prev.find(m =>
                        m.id.startsWith('temp-') &&
                        m.content === newMsg.content &&
                        m.sender_id === newMsg.sender_id
                    );

                    let nextMessages = [...prev];
                    if (tempMatch) {
                        nextMessages = nextMessages.filter(m => m.id !== tempMatch.id);
                    }

                    return [...nextMessages, newMsg as Message];
                });
                setTimeout(scrollToBottom, 100);

                // Mark as read if not from me
                if (newMsg.sender_id !== currentUserId) {
                    await (supabase as any).rpc("mark_messages_read", {
                        p_match_id: matchId,
                        p_user_id: currentUserId
                    });
                }
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
                currentUserId,
                tenantId // Pass strict tenant filter
            }
        );

        return () => {
            unsubscribe();
        };
    }, [matchId, scrollToBottom, currentUserId, tenantId]);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const content = newMessage.trim();
        const tempId = 'temp-' + Date.now();

        try {
            setIsSending(true);
            setNewMessage('');

            // Optimistic update
            const tempMsg: any = {
                id: tempId,
                sender_id: currentUserId,
                content: content,
                created_at: new Date().toISOString(),
                match_id: matchId
            };


            setMessages(prev => [...prev, tempMsg]);
            setTimeout(scrollToBottom, 10);

            await sendMessage(matchId, currentUserId, content, currentUserRole);

            // Clean up temp message after short delay to allow realtime to arrive
            // Realtime usually arrives < 100ms. If we keep temp too long, we see dupes.
            // If we remove too fast, we see flicker.
            // Best approach: filtering happens in the subscription callback (id check)
            // But we also need to self-clean logic here just in case.
            setTimeout(() => {
                setMessages(prev => {
                    // If we find a real message with same content and approx same time, remove temp
                    const hasReal = prev.some(m => !m.id.startsWith('temp-') && m.content === content && m.sender_id === currentUserId);
                    if (hasReal) return prev.filter(m => m.id !== tempId);
                    return prev;
                });
            }, 2000);

        } catch (err) {
            setError("Send failed");
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setNewMessage(content); // Restore content
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteMessage(messageId, currentUserId);
            setMessages((prev) => prev.filter(m => m.id !== messageId));
            setContextMenu(null);
        } catch (err: any) {
            console.error("Delete failed:", err?.message || err);
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
                        // Soft Delete Check
                        if (msg.deleted_for && msg.deleted_for.includes(currentUserId)) {
                            return null;
                        }

                        // DEBUG: Check why alignment fails
                        if (index === 0) {
                            console.log(`[ChatWindow] Debug Alignment: Me=${currentUserId}, Sender=${msg.sender_id}, Match=${matchId}`);
                        }

                        const isMe = msg.sender_id === currentUserId;
                        const showMeta = index === 0 || messages[index - 1].sender_id !== msg.sender_id;

                        if (msg.is_system_message) {
                            return (
                                <div key={msg.id} className="flex justify-center py-2">
                                    <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-white/5">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        // STYLES based on the EXACT REQUIREMENTS:
                        // Me (Organization): Solid INDIGO gradient (RIGHT)
                        // Me (Engineer): Solid EMERALD gradient (RIGHT)
                        // Them (Organization): Dark Gray (zinc-800) + Indigo LEFT border (LEFT)
                        // Them (Engineer): Dark Gray (zinc-800) + Emerald LEFT border (LEFT)

                        // Styling logic delegated strictly to MessageBubble component
                        // See src/components/chat/MessageBubble.tsx for the source of truth

                        return (
                            <div
                                key={msg.id}
                                className="w-full mb-2 group"
                                onContextMenu={(e) => handleContextMenu(msg.id, e)}
                                onTouchStart={(e) => handleTouchStart(msg.id, e)}
                                onTouchEnd={handleTouchEnd}
                            >
                                <MessageBubble
                                    message={msg}
                                    currentUserId={currentUserId}
                                    currentUserRole={currentUserRole}
                                />
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
            {
                contextMenu && (
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
                )
            }
        </div >
    );
}
