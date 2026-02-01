export function MessageBubble({
    message,
    currentUserId,
    currentUserRole
}: {
    message: any,
    currentUserId: string,
    currentUserRole?: 'organization' | 'engineer'
}) {
    // 1. Strict Derivation (No DB reliance for is_me)
    const isMe = message.sender_id === currentUserId;

    // 2. Role derivation
    // If it's me, use currentUserRole
    // If it's them, infer opposite role (org <-> engineer)
    const isSenderOrg = isMe
        ? currentUserRole === 'organization'
        : currentUserRole !== 'organization';

    // Base styles
    const base = "max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-2xl text-sm break-words shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300";

    // 3. Styling Logic (Centralized)
    let wrapperClass = "";
    let bubbleStyles = "";

    if (isMe) {
        // I am the sender.
        // If I am Org -> Indigo Right
        // If I am Eng -> Emerald Right
        wrapperClass = "flex justify-end w-full";

        if (isSenderOrg) {
            bubbleStyles = "bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-600 text-white rounded-tr-sm shadow-indigo-500/40";
        } else {
            bubbleStyles = "bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 text-white rounded-tr-sm shadow-emerald-500/40";
        }
    } else {
        // Someone else is the sender.
        // If Sender is Org -> Indigo Left
        // If Sender is Eng -> Emerald Left
        wrapperClass = "flex justify-start w-full";

        if (isSenderOrg) {
            bubbleStyles = "bg-zinc-800/95 text-zinc-100 border-l-4 border-indigo-500 rounded-tl-sm backdrop-blur-sm";
        } else {
            bubbleStyles = "bg-zinc-800/95 text-zinc-100 border-l-4 border-emerald-500 rounded-tl-sm backdrop-blur-sm";
        }
    }


    return (

        <div className={wrapperClass}>
            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Optional: Show name if not me (and maybe only if changed from prev, handled by parent usually, but here we just render bubble) 
                    For now, we simplify to just bubble as per previous design, but user complained about UUIDs.
                    The parent manages the flow, but if we wanted to show names, we'd do it here or outside.
                    Bubbles usually don't show name *inside* the bubble for chat apps, usually above.
                    Let's stick to the bubble content for now.
                */}
                <div className={`${base} ${bubbleStyles}`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className={`mt-1 flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] font-semibold tracking-wide ${isMe ? 'text-white/60' : 'text-zinc-400'}`}>
                            {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                        {isMe && (
                            <span className={`text-[10px] ${message.read_at ? 'text-blue-200' : 'text-white/40'}`}>
                                {message.read_at ? '✓✓' : '✓'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
