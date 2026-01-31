export function MessageBubble({ message }: any) {
    const isMe = message.is_me
    // Fallback to sender_role_display if sender_role is missing (PGRST204 fix)
    const role = message.sender_role || message.sender_role_display
    const isOrg = role === "organization"

    // Base styles for all message bubbles
    const base = "max-w-[75%] px-5 py-3 rounded-2xl text-sm break-words shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"

    // Determine alignment and colors based on sender
    let wrapperClass = ""
    let bubbleStyles = ""

    if (isMe) {
        // SENDER (Me) - Always RIGHT side
        wrapperClass = "flex justify-end"
        if (isOrg) {
            // Me (Organization): Solid Indigo Gradient
            bubbleStyles = "bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-600 text-white rounded-tr-sm shadow-indigo-500/40"
        } else {
            // Me (Engineer): Solid Emerald Gradient
            bubbleStyles = "bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 text-white rounded-tr-sm shadow-emerald-500/40"
        }
    } else {
        // RECEIVER (Them) - Always LEFT side
        wrapperClass = "flex justify-start"
        if (isOrg) {
            // Them (Organization): Dark Gray + Indigo LEFT border
            bubbleStyles = "bg-zinc-800/95 text-zinc-100 border-l-4 border-indigo-500 rounded-tl-sm backdrop-blur-sm"
        } else {
            // Them (Engineer): Dark Gray + Emerald LEFT border
            bubbleStyles = "bg-zinc-800/95 text-zinc-100 border-l-4 border-emerald-500 rounded-tl-sm backdrop-blur-sm"
        }
    }

    return (
        <div className={wrapperClass}>
            <div className={`${base} ${bubbleStyles}`}>
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <span className={`block text-[10px] mt-2 font-semibold tracking-wide ${isMe ? 'text-white/60 text-right' : 'text-zinc-400 text-right'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    )
}
