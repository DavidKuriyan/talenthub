export function MessageBubble({ message }: any) {
    const isMe = message.is_me // compute from auth
    const isOrg = message.sender_role === "organization"

    const base =
        "max-w-[75%] px-4 py-2 rounded-xl text-sm break-words"

    const styles = isMe
        ? isOrg
            // Me (Organization): Indigo Gradient
            ? "ml-auto bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20 rounded-tr-sm"
            // Me (Engineer): Emerald Gradient
            : "ml-auto bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 rounded-tr-sm"
        : isOrg
            // Them (Organization): Dark Gray + Indigo Border
            ? "mr-auto bg-zinc-800 text-zinc-100 border-l-4 border-indigo-500 shadow-md rounded-tl-sm"
            // Them (Engineer): Dark Gray + Emerald Border
            : "mr-auto bg-zinc-800 text-zinc-100 border-l-4 border-emerald-500 shadow-md rounded-tl-sm"

    return (
        <div className={`${base} ${styles}`}>
            <span className="block">{message.content}</span>
            <span className="block text-[10px] opacity-70 mt-1 text-right">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    )
}
