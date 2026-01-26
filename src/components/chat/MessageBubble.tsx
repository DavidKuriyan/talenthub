export function MessageBubble({ message }: any) {
    const isMe = message.is_me // compute from auth
    const isOrg = message.sender_role === "organization"

    const base =
        "max-w-[75%] px-4 py-2 rounded-xl text-sm break-words"

    const styles = isMe
        ? isOrg
            ? "ml-auto bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
            : "ml-auto bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
        : isOrg
            ? "mr-auto bg-zinc-800 text-white border-l-4 border-indigo-500"
            : "mr-auto bg-zinc-800 text-white border-l-4 border-emerald-500"

    return <div className={`${base} ${styles}`}>{message.content}</div>
}
