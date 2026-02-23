'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User } from 'lucide-react'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'حدث خطأ')
                return
            }

            router.push('/')
            router.refresh()
        } catch {
            setError('خطأ في الاتصال بالخادم')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 -z-0">
                <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-28 h-28 mb-6 animate-float">
                        <img
                            src="/logo-new.svg"
                            alt="شعار مصنع الجودة"
                            className="w-full h-full drop-shadow-[0_0_20px_rgba(217,119,6,0.3)]"
                        />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">مصنع الجودة</h1>
                    <p className="text-sky-300/60 text-sm tracking-wider">AL-JAWDA IRON PRODUCTS FACTORY</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 relative overflow-hidden">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-white text-center mb-6">تسجيل الدخول</h2>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-center animate-fade-in">
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2">
                                    اسم المستخدم
                                </label>
                                <div className="relative">
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all duration-300"
                                        placeholder="admin"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2">
                                    كلمة المرور
                                </label>
                                <div className="relative">
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all duration-300"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-l from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        جاري الدخول...
                                    </span>
                                ) : (
                                    'دخول'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-gray-600 text-xs mt-8">
                    نظام إدارة مصنع الجودة © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}
