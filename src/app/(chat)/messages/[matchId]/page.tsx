"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { subscribeToMessages } from "@/lib/realtime/messages"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { useParams, useRouter } from "next/navigation"

export default function ChatPage() {
    const params = useParams()
    const matchId = params.matchId as string
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            setUser(session.user)

            // Initial Fetch
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("match_id", matchId)
                .order("created_at", { ascending: true }) as { data: any[] | null }

            if (data) {
                setMessages(data.map(m => ({
                    ...m,
                    is_me: m.sender_id === session.user.id
                })))
            }
            setLoading(false)
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }

        init()

        const unsubscribe = subscribeToMessages({
            matchId,
            onInsert: (msg) => {
                setMessages((prev) => {
                    if (prev.find(m => m.id === msg.id)) return prev
                    return [...prev, { ...msg, is_me: msg.sender_id === user?.id }]
                })
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            },
        })

        return () => unsubscribe()
    }, [matchId, user?.id])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending || !user) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage("")

        const { error } = await (supabase
            .from("messages") as any)
            .insert({
                match_id: matchId,
                sender_id: user.id,
                sender_role: user.app_metadata?.role === 'provider' ? 'engineer' : 'organization',
                content,
                tenant_id: user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
            })

        if (error) {
            console.error("Send failed:", error)
            setNewMessage(content)
        }
        setSending(false)
    }

    if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse">Establishing secure channel...</div>

    return (
        <div className="flex flex-col h-screen bg-zinc-950 max-w-2xl mx-auto border-x border-white/5">
            <div className="p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl">
                <h1 className="font-black text-white tracking-tight">Match Channel</h1>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Real-time Active
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full opacity-20">
                        <p className="text-white font-bold">No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-zinc-900 border-t border-white/5">
                <div className="flex gap-2">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                        placeholder="Type a message..."
                        className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all"
                    >
                        {sending ? '...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    )
}
