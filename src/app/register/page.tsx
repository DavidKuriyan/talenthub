import AuthForm from "@/components/auth/AuthForm";

/**
 * @feature auth:register
 */
export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6 text-zinc-500">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center font-bold text-lg text-white dark:text-zinc-900">T</div>
                        <span className="font-bold text-2xl text-zinc-900 dark:text-zinc-50 tracking-tighter">TalentHub</span>
                    </div>
                </div>
                <AuthForm mode="register" />
            </div>
        </div>
    );
}
