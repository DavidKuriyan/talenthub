import { MessageBubble as OriginalBubble } from './MessageBubble'; // Just type reference if needed, but we redefine it.

export function MessageBubbleFixed({
    message,
    currentUserId,
    currentUserRole
}: {
    message: any,
    currentUserId: string,
    currentUserRole: 'organization' | 'engineer'
}) {
    // 1. Strict Derivation
    const isMe = message.sender_id === currentUserId;

    // 2. Role derivation
    const isSenderOrg = isMe
        ? currentUserRole === 'organization'
        : (message.sender_role_display === 'organization' || message.sender_role === 'organization');

    // Base styles (Tailwind) - kept for when CSS loads
    const base = "max-w-[80%] sm:max-w-[70%] px-5 py-3 text-sm break-words shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 hover:brightness-105 hover:shadow-lg cursor-default mb-1";

    // 3. Styling Logic (Tailwind)
    let wrapperClass = "";
    let bubbleStyles = "";

    if (isMe) {
        wrapperClass = "flex justify-end w-full";
        if (isSenderOrg) {
            bubbleStyles = "bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-600 text-white rounded-tr-none shadow-indigo-500/30";
        } else {
            bubbleStyles = "bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 text-white rounded-tr-none shadow-emerald-500/30";
        }
    } else {
        wrapperClass = "flex justify-start w-full";
        if (isSenderOrg) {
            bubbleStyles = "bg-zinc-800 text-zinc-100 border-l-[3px] border-indigo-500 rounded-tl-none";
        } else {
            bubbleStyles = "bg-zinc-800 text-zinc-100 border-l-[3px] border-emerald-500 rounded-tl-none";
        }
    }

    // 4. INLINE STYLES (Failsafe) - Using MARGIN to force alignment
    const wrapperStyle: React.CSSProperties = {
        display: 'block', // Block allows margin-auto to work
        width: '100%',
        marginBottom: '16px',
        textAlign: isMe ? 'right' : 'left' // Fallback alignment
    };

    const bubbleContainerStyle: React.CSSProperties = {
        display: 'inline-block', // Shrink to content width
        maxWidth: '75%',
        textAlign: 'left', // Reset text inside bubble
        marginLeft: isMe ? 'auto' : '0',
        marginRight: isMe ? '0' : 'auto'
    };

    const bubbleStyle: React.CSSProperties = {
        padding: '12px 20px',
        borderRadius: '22px',
        borderTopRightRadius: isMe ? '4px' : '22px',
        borderTopLeftRadius: !isMe ? '4px' : '22px',
        backgroundColor: isMe
            ? (isSenderOrg ? '#4f46e5' : '#10b981')
            : '#27272a',
        color: isMe ? 'white' : '#f4f4f5',
        borderLeft: !isMe ? `4px solid ${isSenderOrg ? '#6366f1' : '#10b981'}` : 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
    };

    return (
        <div style={wrapperStyle}>
            <div style={bubbleContainerStyle}>
                {/* Sender Label for Received Messages */}
                {!isMe && (
                    <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px', marginLeft: '4px' }}>
                        {message.sender_name || 'Unknown'} <span style={{ color: '#52525b', fontWeight: 'normal' }}>({isSenderOrg ? 'Organization' : 'Engineer'})</span>
                    </div>
                )}

                {/* Message Bubble */}
                <div style={bubbleStyle}>
                    <p style={{ lineHeight: '1.375', whiteSpace: 'pre-wrap', fontSize: '15px', margin: 0 }}>{message.content}</p>

                    {/* Timestamp Row */}
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: isMe ? 'rgba(255,255,255,0.6)' : '#a1a1aa' }}>
                            {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                        {isMe && (
                            <span style={{ fontSize: '10px', color: message.read_at ? '#bfdbfe' : 'rgba(255,255,255,0.4)' }}>
                                {message.read_at ? '✓✓' : '✓'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
