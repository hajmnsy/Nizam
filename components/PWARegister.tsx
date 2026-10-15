'use client'

import { useEffect, useState } from 'react'

export default function PWARegister() {
    const [installPrompt, setInstallPrompt] = useState<any>(null)
    const [installed, setInstalled] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return

        // 1. Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then((registration) => {
                    console.log('[PWA] Service Worker registered with scope:', registration.scope)

                    // Pre-cache critical routes in background so offline navigation works seamlessly
                    const criticalRoutes = [
                        '/sales/new',
                        '/sales',
                        '/warehouse',
                        '/inventory'
                    ]

                    // Fetch critical routes when idle to ensure chunks and HTML are cached
                    if ('requestIdleCallback' in window) {
                        (window as any).requestIdleCallback(() => {
                            criticalRoutes.forEach(route => {
                                fetch(route, { cache: 'no-store' }).catch(() => {})
                            })
                        })
                    } else {
                        setTimeout(() => {
                            criticalRoutes.forEach(route => {
                                fetch(route, { cache: 'no-store' }).catch(() => {})
                            })
                        }, 3000)
                    }
                }).catch((error) => {
                    console.warn('[PWA] Service Worker registration failed:', error)
                })
            })
        }

        // 2. Listen for PWA Install Prompt
        const handleBeforeInstall = (e: any) => {
            e.preventDefault()
            setInstallPrompt(e)
        }

        const handleAppInstalled = () => {
            setInstalled(true)
            setInstallPrompt(null)
            console.log('[PWA] App successfully installed locally!')
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstall)
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!installPrompt) return
        installPrompt.prompt()
        const choice = await installPrompt.userChoice
        if (choice.outcome === 'accepted') {
            setInstallPrompt(null)
        }
    }

    if (!installPrompt || installed) return null

    return (
        <div className="fixed bottom-4 left-4 z-50 print:hidden animate-slide-up">
            <div className="bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl p-3 sm:p-4 flex items-center gap-3 max-w-sm">
                <div className="text-2xl">📲</div>
                <div className="flex-1">
                    <div className="font-bold text-xs sm:text-sm">تثبيت تطبيق الجودة</div>
                    <div className="text-[11px] text-slate-400">لفتح النظام والبيع بدون إنترنت في أي وقت</div>
                </div>
                <button
                    onClick={handleInstallClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3 py-2 rounded-xl transition-colors shrink-0 shadow-sm"
                >
                    تثبيت الآن
                </button>
            </div>
        </div>
    )
}
