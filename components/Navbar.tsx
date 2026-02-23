'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, X, Rocket, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import CommandPalette from './CommandPalette'

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    const [notifications, setNotifications] = useState<any[]>([])
    const [showNotifications, setShowNotifications] = useState(false)

    const [currentUser, setCurrentUser] = useState<any>(null)
    const [settings, setSettings] = useState<any>(null)

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)

        // Fetch Notifications
        fetch('/api/notifications')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setNotifications(data)
            })
            .catch(console.error)

        // Fetch User Info
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setCurrentUser(data)
            })
            .catch(console.error)

        // Fetch Settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setSettings(data)
            })
            .catch(console.error)

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    const markAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
        if (unreadIds.length === 0) return

        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: unreadIds })
            })
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (error) {
            console.error(error)
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    const isActive = (path: string) => {
        // Check if current path matches or starts with the link path (for sub-routes)
        if (path === '/') return pathname === '/'
        return pathname.startsWith(path)
    }

    const navLinks = [
        { name: 'الرئيسية', path: '/' },
        { name: 'المخزون', path: '/inventory' },
        { name: 'المبيعات', path: '/sales' },
        { name: 'المصروفات', path: '/expenses' },
        { name: 'التقارير', path: '/reports' },
        { name: 'الإعدادات', path: '/settings' },
    ]

    if (currentUser?.role === 'ADMIN') {
        navLinks.push({ name: 'المستخدمين', path: '/users' })
    }

    // Trigger for Command Palette
    const openSearch = () => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
        document.dispatchEvent(event)
    }

    return (
        <>
            <CommandPalette />

            <nav className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4'
                } print:hidden`}>
                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="flex justify-between items-center">

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3">
                            {settings?.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto object-contain rounded-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            ) : (
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Rocket className="text-white" size={24} strokeWidth={2.5} />
                                </div>
                            )}
                            <div className="hidden lg:flex flex-col">
                                <span className="font-black text-xl text-slate-800 tracking-tight leading-none">
                                    {settings?.companyName || 'النظام الإداري'}
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1 bg-white/50 p-1 rounded-full border border-gray-100 backdrop-blur-sm">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 relative overflow-hidden ${isActive(link.path)
                                        ? 'text-white shadow-lg shadow-indigo-200'
                                        : 'text-slate-600 hover:text-indigo-700 hover:bg-white/80'
                                        }`}
                                >
                                    {isActive(link.path) && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full -z-10 animate-fade-in" />
                                    )}
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            {/* Notifications Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowNotifications(!showNotifications)
                                        if (!showNotifications) markAsRead()
                                    }}
                                    className="relative p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors border border-transparent hover:border-gray-300"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute left-0 mt-3 w- ৮০ sm:w-80 bg-white border rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50 origin-top-left">
                                        <div className="p-4 border-b bg-gray-50 font-bold text-gray-800 flex justify-between items-center">
                                            الإشعارات
                                            {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} جديد</span>}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-gray-500 text-sm">لا توجد إشعارات حالياً.</div>
                                            ) : (
                                                notifications.map(notification => (
                                                    <div key={notification.id} className={`p-4 border-b hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}>
                                                        <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{notification.title}</h4>
                                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
                                                        <span className="text-[10px] text-gray-400 mt-2 block">{new Date(notification.createdAt).toLocaleDateString('ar-SD')}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={openSearch}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-transparent hover:border-gray-300"
                                title="بحث سريع (Ctrl+K)"
                            >
                                <Search size={16} />
                                <span className="hidden lg:inline">بحث...</span>
                                <span className="hidden lg:inline bg-white px-1.5 py-0.5 rounded text-[10px] border shadow-sm">Ctrl K</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-sm font-bold border border-transparent hover:border-red-100"
                            >
                                <LogOut size={18} />
                                <span>خروج</span>
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-lg animate-slide-down">
                        <div className="flex flex-col p-4 space-y-2">
                            <button
                                onClick={() => { openSearch(); setIsOpen(false) }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-600 mb-2"
                            >
                                <Search size={20} />
                                <span className="font-bold">بحث سريع</span>
                            </button>

                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isActive(link.path)
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive(link.path) ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                    {link.name}
                                </Link>
                            ))}
                            <div className="border-t pt-2 mt-2">
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold"
                                >
                                    <LogOut size={20} />
                                    <span>تسجيل خروج</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}
