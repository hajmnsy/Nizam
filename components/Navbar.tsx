'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, X, Rocket, Search, DollarSign, Bell } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
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

    // Exchange Rate State
    const [exchangeRate, setExchangeRate] = useState<number>(0)
    const [showExchangeModal, setShowExchangeModal] = useState(false)
    const [newExchangeRate, setNewExchangeRate] = useState<string>('')
    const [savingRate, setSavingRate] = useState(false)
    const exchangePopupRef = useRef<HTMLDivElement>(null)

    // Handle Output clicks for Exchange Popup
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exchangePopupRef.current && !exchangePopupRef.current.contains(event.target as Node)) {
                setShowExchangeModal(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
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

        // Fetch Exchange Rate
        fetch('/api/exchange-rate')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setExchangeRate(data.rate)
                    setNewExchangeRate(data.rate.toString())
                }
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

    const handleSaveExchangeRate = async () => {
        if (!newExchangeRate) return
        setSavingRate(true)
        try {
            const res = await fetch('/api/exchange-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate: parseFloat(newExchangeRate) })
            })
            const data = await res.json()
            if (res.ok) {
                setExchangeRate(data.rate)
                setShowExchangeModal(false)
            } else {
                alert('فشل حفظ سعر الصرف')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSavingRate(false)
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/'
        return pathname.startsWith(path)
    }

    const navLinks = [
        { name: 'الرئيسية', path: '/' },
        { name: 'المخزون', path: '/inventory' },
        { name: 'المبيعات', path: '/sales' },
        { name: 'المصروفات', path: '/expenses' },
        { name: 'التقارير', path: '/reports' },
        { name: 'حاسبة الأسعار', path: '/pricing' },
        { name: 'الموظفين', path: '/employees' },
        { name: 'الإعدادات', path: '/settings' },
    ]

    if (currentUser?.role === 'ADMIN') {
        navLinks.push({ name: 'المستخدمين', path: '/users' })
    }

    const openSearch = () => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
        document.dispatchEvent(event)
    }

    return (
        <>
            <CommandPalette />

            <nav className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
                scrolled ? 'bg-white/95 backdrop-blur-sm border-gray-200 shadow-sm' : 'bg-white border-gray-200'
            } print:hidden`}>
                <div className="container mx-auto px-4 max-w-[1400px]">
                    <div className="flex justify-between items-center h-16">
                        
                        {/* Right: Logo & Primary Nav */}
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2">
                                {settings?.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                ) : (
                                    <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
                                        <Rocket className="text-white" size={18} />
                                    </div>
                                )}
                                {settings?.companyName && (
                                    <span className="font-bold text-gray-900 tracking-tight hidden lg:block">
                                        {settings.companyName}
                                    </span>
                                )}
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center gap-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        href={link.path}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            isActive(link.path)
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Left: Actions */}
                        <div className="hidden md:flex items-center gap-2">
                            {/* Search Button */}
                            <button
                                onClick={openSearch}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                                title="بحث سريع (Ctrl+K)"
                            >
                                <Search size={14} className="text-gray-400" />
                                <span className="hidden lg:inline mr-1">بحث</span>
                                <kbd className="hidden lg:inline-flex items-center gap-1 font-sans text-[10px] bg-white border border-gray-200 px-1.5 rounded text-gray-400 ml-1">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </button>

                            <div className="w-px h-5 bg-gray-200 mx-1"></div>

                            {/* Exchange Rate Widget */}
                            <div className="relative" ref={exchangePopupRef}>
                                <button
                                    onClick={() => setShowExchangeModal(!showExchangeModal)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-transparent hover:border-gray-200"
                                    title="تحديث سعر الصرف"
                                >
                                    <DollarSign size={14} className="text-gray-400" />
                                    <span>{exchangeRate > 0 ? exchangeRate.toLocaleString() : '---'} ج.س</span>
                                </button>

                                {showExchangeModal && (
                                    <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in-up z-50 origin-top-left p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-sm text-gray-900">تحديث سعر الصرف</h4>
                                            <button onClick={() => setShowExchangeModal(false)} className="text-gray-400 hover:text-gray-600">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1.5 block">السعر مقابل 1 دولار</label>
                                                <input
                                                    type="number"
                                                    value={newExchangeRate}
                                                    onChange={(e) => setNewExchangeRate(e.target.value)}
                                                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                    placeholder="مثال: 3000"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveExchangeRate()
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={handleSaveExchangeRate}
                                                disabled={savingRate}
                                                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm py-2 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                {savingRate ? 'جاري الحفظ...' : 'حفظ'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notifications Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowNotifications(!showNotifications)
                                        if (!showNotifications) markAsRead()
                                    }}
                                    className="relative p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                    title="الإشعارات"
                                >
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border border-white"></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in-up z-50 origin-top-left flex flex-col">
                                        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                            <span className="font-semibold text-sm text-gray-900">الإشعارات</span>
                                            {unreadCount > 0 && <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{unreadCount} جديد</span>}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-gray-500 text-sm">لا توجد إشعارات حالياً.</div>
                                            ) : (
                                                notifications.map(notification => (
                                                    <div key={notification.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`}>
                                                        <h4 className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notification.title}</h4>
                                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
                                                        <span className="text-[10px] text-gray-400 mt-1.5 block">{new Date(notification.createdAt).toLocaleDateString('ar-SD')}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-px h-5 bg-gray-200 mx-1"></div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="تسجيل خروج"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            <button
                                onClick={openSearch}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                            >
                                <Search size={20} />
                            </button>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                {isOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-md animate-slide-down">
                        <div className="flex flex-col p-2 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                        isActive(link.path)
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="border-t border-gray-100 my-1"></div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">سعر الصرف</span>
                                <span className="text-sm font-semibold text-gray-900">{exchangeRate.toLocaleString()} ج.س</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                            >
                                <LogOut size={16} />
                                <span>تسجيل خروج</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}
