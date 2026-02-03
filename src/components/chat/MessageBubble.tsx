export function MessageBubble({
    message,
    currentUserId,
    currentUserRole
}: {
    message: any,
    currentUserId: string,
    currentUserRole: 'organization' | 'engineer'  // REQUIRED for correct colors
}) {
    // 1. Strict Derivation (No DB reliance for is_me)
    const isMe = message.sender_id === currentUserId;

    // 2. Role derivation (FIXED)
    // If it's me, use currentUserRole
    // If it's them, use ACTUAL sender role from message data
    const isSenderOrg = isMe
        ? currentUserRole === 'organization'
        : message.sender_role_display === 'organization';  // Use actual sender data

    // Base styles
    const base = "max-w-[80%] sm:max-w-[70%] px-5 py-3 text-sm break-words shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 hover:brightness-105 hover:shadow-lg cursor-default mb-1";

    // 3. Styling Logic (Centralized)
    let wrapperClass = "";
    let bubbleStyles = "";

    if (isMe) {
        // I am the sender.
        // If I am Org -> Indigo Right
        // If I am Eng -> Emerald Right
        wrapperClass = "flex justify-end w-full";

        if (isSenderOrg) {
            bubbleStyles = "bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-600 text-white rounded-tr-none shadow-indigo-500/30";
        } else {
            bubbleStyles = "bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 text-white rounded-tr-none shadow-emerald-500/30";
        }
    } else {
        // Someone else is the sender.
        // If Sender is Org -> Indigo Left
        // If Sender is Eng -> Emerald Left
        wrapperClass = "flex justify-start w-full";

        if (isSenderOrg) {
            bubbleStyles = "bg-zinc-800 text-zinc-100 border-l-[3px] border-indigo-500 rounded-tl-none";
        } else {
            bubbleStyles = "bg-zinc-800 text-zinc-100 border-l-[3px] border-emerald-500 rounded-tl-none";
        }
    }


    // Inline styles for failsafe layout (if Tailwind fails)
    const wrapperStyle: React.CSSProperties = {
        display: 'flex',
        width: '100%',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        marginBottom: '10px'
    };

    const bubbleStyle: React.CSSProperties = {
        maxWidth: '75%',
        padding: '12px 20px',
        borderRadius: '22px',
        borderTopRightRadius: isMe ? '0px' : '22px',
        borderTopLeftRadius: !isMe ? '0px' : '22px',
        backgroundColor: isMe
            ? (isSenderOrg ? '#4f46e5' : '#10b981') // Indigo-600 : Emerald-500
            : '#27272a', // Zinc-800
        color: isMe ? 'white' : '#f4f4f5', // Zinc-100
        borderLeft: !isMe ? `4px solid ${isSenderOrg ? '#6366f1' : '#10b981'}` : 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'relative'
    };

    return (
        <div className={wrapperClass} style={wrapperStyle}>
            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`} style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {/* Show sender name for "Them" messages (per UI GUIDE: "Name (Role)") */}
                {!isMe && (
                    <span className="text-xs font-bold text-zinc-400 mb-1 ml-1 block" style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px', marginLeft: '4px', display: 'block' }}>
                        {message.sender_name || 'Unknown'} <span style={{ color: '#52525b', fontWeight: 'normal' }}>({isSenderOrg ? 'Organization' : 'Engineer'})</span>
                    </span>
                )}

                <div className={`${base} ${bubbleStyles} rounded-[22px]`} style={bubbleStyle}>
                    <p className="leading-snug whitespace-pre-wrap text-[15px]" style={{ lineHeight: '1.375', whiteSpace: 'pre-wrap', fontSize: '15px' }}>{message.content}</p>
                    {/* FIXED: Timestamps ALWAYS right-aligned per MESSAGE UI GUIDE */}
                    <div className="mt-1 flex items-center gap-2 justify-end" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span className={`text-[10px] font-semibold tracking-wide ${isMe ? 'text-white/60' : 'text-zinc-400'}`} style={{ fontSize: '10px', fontWeight: 600, color: isMe ? 'rgba(255,255,255,0.6)' : '#a1a1aa' }}>
                            {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                        {isMe && (
                            <span className={`text-[10px] ${message.read_at ? 'text-blue-200' : 'text-white/40'}`} style={{ fontSize: '10px', color: message.read_at ? '#bfdbfe' : 'rgba(255,255,255,0.4)' }}>
                                {message.read_at ? '✓✓' : '✓'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
