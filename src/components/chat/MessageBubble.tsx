export function MessageBubble({ message }: any) {
    const isMe = message.is_me
    // Fallback to sender_role_display if sender_role is missing (PGRST204 fix)
    const role = message.sender_role || message.sender_role_display
    const isOrg = role === "organization"

    const base = "max-w-[75%] px-4 py-3 rounded-xl text-sm break-words shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"

    const styles = isMe
        ? isOrg
            // Me (Organization): Indigo Gradient + Right
            ? "ml-auto bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-none"
            // Me (Engineer): Emerald Gradient + Right
            : "ml-auto bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-tr-none"
        : isOrg
            // Them (Organization): Dark Gray + Indigo Border + Left
            ? "mr-auto bg-zinc-800 text-zinc-100 border-l-4 border-indigo-500 rounded-tl-none"
            // Them (Engineer): Dark Gray + Emerald Border + Left
            : "mr-auto bg-zinc-800 text-zinc-100 border-l-4 border-emerald-500 rounded-tl-none"

    return (
        <div className={`${base} ${styles}`}>
            <span className="block leading-relaxed">{message.content}</span>
            <span className={`block text-[10px] mt-1.5 font-medium ${isMe ? 'text-white/70 text-right' : 'text-zinc-400 text-right'}`}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    )
}
