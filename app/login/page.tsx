'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User, Layers, ShieldCheck, Sparkles } from 'lucide-react'

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
                setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة')
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Ambient Animated Orbs */}
            <div className="absolute inset-0 -z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                
                {/* Nizam Master Enterprise Logo & Title */}
                <div className="text-center mb-8 space-y-3">
                    <div className="mx-auto w-24 h-24 mb-4 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-400 p-0.5 shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-900 rounded-[22px] flex flex-col items-center justify-center">
                            <Layers className="text-sky-400" size={42} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-wider flex items-center justify-center gap-2">
                            <span>نِــظَــام</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">v2.0</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-bold tracking-widest mt-1 uppercase">
                            NIZAM ENTERPRISE MANAGEMENT SYSTEM
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800 p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="text-indigo-400" size={20} />
                                <span>تسجيل الدخول للنظام</span>
                            </h2>
                            <span className="text-[11px] font-bold text-slate-500">منصة الفروع المتعددة</span>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-5 text-center animate-fade-in">
                                <p className="text-rose-300 text-xs font-bold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-2">
                                    اسم المستخدم
                                </label>
                                <div className="relative">
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pr-11 pl-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                                        placeholder="أدخل اسم المستخدم..."
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-2">
                                    كلمة المرور
                                </label>
                                <div className="relative">
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pr-11 pl-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 hover:from-indigo-500 hover:via-blue-500 hover:to-sky-500 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        جاري التحقق والدخول...
                                    </span>
                                ) : (
                                    'دخول للنظام'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-slate-600 text-xs mt-8 font-medium">
                    نظام إدارة الشركات والفروع المتعددة © {new Date().getFullYear()} NIZAM PLATFORM
                </p>
            </div>
        </div>
    )
}
