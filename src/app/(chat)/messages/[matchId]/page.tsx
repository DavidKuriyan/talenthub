"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { sendMessage, deleteMessage } from "@/lib/realtime"
import { useRealtime } from "@/providers/RealtimeProvider"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

/**
 * @feature CHAT_PAGE
 * @aiNote Premium Chat Center with Long-Press Delete and Schema Robustness.
 * Handles PGRST204 by omitting sender_role.
 */
export default function ChatPage() {
    const params = useParams()
    const matchId = params.matchId as string
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string } | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Realtime Context
    const { subscribe } = useRealtime();

    const filterDeleted = useCallback((msgs: any[], userId: string) => {
        return msgs.filter(m => !m.deleted_by?.includes(userId))
    }, [])

    // 1. Initial Load
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/login")
                return
            }
            setUser(session.user)

            const { data: messagesData, error: messagesError } = await supabase
                .from("messages")
                .select("*")
                .eq("match_id", matchId)
                .order("created_at", { ascending: true }) as { data: any[] | null, error: any }

            if (messagesError) {
                console.error("[ChatPage] Fetch error:", messagesError)
            } else if (messagesData) {
                const senderIds = Array.from(new Set(messagesData.map(m => m.sender_id)))
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("id, full_name, role")
                    .in("id", senderIds)

                const profileMap = new Map(profilesData?.map(p => [p.id, p]) || [])

                const visibleMessages = filterDeleted(messagesData, session.user.id)
                setMessages(visibleMessages.map(m => ({
                    ...m,
                    is_me: m.sender_id === session.user.id,
                    sender_name: profileMap.get(m.sender_id)?.full_name || "Unknown User",
                    sender_role_display: profileMap.get(m.sender_id)?.role || "user"
                })))
            }
            setLoading(false)
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
        init()
    }, [matchId, router, filterDeleted])


    // 2. Realtime Subscriptions
    useEffect(() => {
        if (!user || !matchId) return;

        // Insert
        subscribe({
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
            event: 'INSERT',
            onChange: async (payload) => {
                const msg = payload.new;
                let senderName = "Unknown User"
                if (msg.sender_id) {
                    const { data } = await supabase.from("profiles").select("full_name").eq("id", msg.sender_id).single()
                    if (data) senderName = data.full_name
                }

                setMessages((prev) => {
                    if (prev.find((m: any) => m.id === msg.id)) return prev
                    if (msg.deleted_by?.includes(user?.id)) return prev
                    return [...prev, {
                        ...msg,
                        is_me: msg.sender_id === user?.id,
                        sender_name: senderName
                    }]
                })
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            }
        });

        // Update (Soft Delete)
        subscribe({
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
            event: 'UPDATE',
            onChange: (payload) => {
                const updatedMsg = payload.new;
                setMessages((prev) => {
                    const filtered = prev.map(m => m.id === updatedMsg.id ? {
                        ...updatedMsg,
                        is_me: updatedMsg.sender_id === user?.id,
                        sender_name: m.sender_name
                    } : m)
                    return filterDeleted(filtered, user?.id || "")
                })
            }
        });

    }, [matchId, user, subscribe, filterDeleted]);

    // 3. Click Listeners
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null)
        window.addEventListener('click', handleClickOutside)
        return () => window.removeEventListener('click', handleClickOutside)
    }, []);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending || !user) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage("")

        try {
            // Use robust sendMessage which handles retries and tenant_id
            await sendMessage(matchId, user.id, content, user.app_metadata?.role || user.user_metadata?.role || 'user');
        } catch (error: any) {
            console.error("[ChatPage] Send failed:", error?.message || error)
            setNewMessage(content) // Restore on failure
        }
        setSending(false)
    }

    const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, messageId: string) => {
        e.preventDefault()
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

        setContextMenu({
            x: clientX,
            y: clientY,
            messageId
        })
    }

    const handleDelete = async () => {
        if (!contextMenu || !user) return
        try {
            await deleteMessage(contextMenu.messageId, user.id)
            setContextMenu(null)
        } catch (error) {
            console.error("Deletion failed:", error)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="flex flex-col h-screen bg-zinc-950 relative overflow-hidden">
            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1 min-w-[150px] animate-in fade-in zoom-in duration-200"
                    style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 160) }}
                >
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-white/5 rounded-lg text-sm font-bold transition-colors"
                    >
                        <span>🗑️</span>
                        Delete for me
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="p-6 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                            ←
                        </Link>
                        <div>
                            <h1 className="font-black text-white tracking-tight text-xl">Message Center</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Secure Channel Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-20">
                            <span className="text-6xl mb-4">💬</span>
                            <p className="text-white text-lg font-bold">No history found.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className="flex flex-col cursor-pointer mb-2"
                                onContextMenu={(e) => handleContextMenu(e, msg.id)}
                                onTouchStart={(e) => {
                                    const timer = setTimeout(() => handleContextMenu(e as any, msg.id), 500)
                                    const clear = () => clearTimeout(timer)
                                    e.currentTarget.addEventListener('touchend', clear, { once: true })
                                    e.currentTarget.addEventListener('touchmove', clear, { once: true })
                                }}
                            >
                                {!msg.is_me && (
                                    <span className="text-[10px] text-zinc-500 ml-1 mb-1 font-medium">{msg.sender_name}</span>
                                )}
                                <MessageBubble message={msg} />

                            </div>
                        ))
                    )}
                    <div ref={scrollRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-zinc-900/50 border-t border-white/5">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                        placeholder="Type a message..."
                        className="flex-1 bg-zinc-800 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-indigo-600 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        {sending ? 'Sending...' : 'Send Signal'}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    )
}
