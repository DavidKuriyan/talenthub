export function MessageBubble({ message }: any) {
    const isMe = message.is_me // compute from auth
    const isOrg = message.sender_role === "organization"

    const base =
        "max-w-[75%] px-4 py-2 rounded-xl text-sm break-words shadow-sm"

    const styles = isMe
        ? isOrg
            ? "ml-auto bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-none"
            : "ml-auto bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-br-none"
        : isOrg
            ? "mr-auto bg-zinc-800 text-white border-l-4 border-indigo-500 rounded-bl-none"
            : "mr-auto bg-zinc-800 text-white border-l-4 border-emerald-500 rounded-bl-none"

    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}>
            <div className={`${base} ${styles}`}>
                {message.content}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 px-1">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    )
}
