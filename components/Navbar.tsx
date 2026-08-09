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

    // Branch Switcher State
    const [branches, setBranches] = useState<any[]>([])
    const [activeBranchId, setActiveBranchId] = useState<number>(1)
    const [showBranchModal, setShowBranchModal] = useState(false)
    const [newBranchName, setNewBranchName] = useState('')
    const [newBranchCode, setNewBranchCode] = useState('')
    const [creatingBranch, setCreatingBranch] = useState(false)
    const branchPopupRef = useRef<HTMLDivElement>(null)

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    }

    // Handle Output clicks for Exchange & Branch Popups
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exchangePopupRef.current && !exchangePopupRef.current.contains(event.target as Node)) {
                setShowExchangeModal(false)
            }
            if (branchPopupRef.current && !branchPopupRef.current.contains(event.target as Node)) {
                setShowBranchModal(false)
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

        // Fetch Branches
        fetch('/api/branches')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBranches(data)
            })
            .catch(console.error)

        // Set active branch from cookie
        const activeBranchCookie = getCookie('active_branch_id')
        if (activeBranchCookie) {
            setActiveBranchId(parseInt(activeBranchCookie))
        } else {
            setActiveBranchId(1)
        }

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

    const handleBranchSwitch = async (id: number) => {
        try {
            const res = await fetch('/api/branches/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branchId: id })
            })
            if (res.ok) {
                window.location.reload()
            } else {
                alert('فشل تغيير الفرع')
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleCreateBranch = async () => {
        if (!newBranchName || !newBranchCode) return
        setCreatingBranch(true)
        try {
            const res = await fetch('/api/branches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBranchName,
                    code: newBranchCode
                })
            })
            const data = await res.json()
            if (res.ok) {
                setBranches(prev => [...prev, data])
                setNewBranchName('')
                setNewBranchCode('')
                alert('تمت إضافة الفرع الجديد بنجاح مع إعدادات افتراضية!')
                setShowBranchModal(false)
            } else {
                alert(data.error || 'فشل إضافة الفرع')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setCreatingBranch(false)
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
        { name: 'المشتريات', path: '/purchases' },
        { name: 'المبيعات', path: '/sales' },
        { name: 'المصروفات', path: '/expenses' },
        { name: 'حركة الأصناف', path: '/reports/items' },
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

            <nav className={`sticky top-0 z-40 w-full transition-all duration-300 ${
                scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] py-1' : 'bg-transparent py-3'
            } print:hidden`}>
                <div className="container mx-auto px-4 max-w-[1400px]">
                    <div className="flex justify-between items-center h-14 transition-all">
                        
                        {/* Right: Logo & Primary Nav */}
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-3 group">
                                {settings?.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                ) : (
                                    <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-blue-300 transition-all">
                                        <Rocket className="text-white" size={18} strokeWidth={2.5} />
                                    </div>
                                )}
                                {settings?.companyName && (
                                    <span className="font-black text-lg text-slate-800 tracking-tight hidden lg:block group-hover:text-indigo-600 transition-colors">
                                        {settings.companyName}
                                    </span>
                                )}
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden xl:flex items-center gap-1 bg-slate-100/60 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm shadow-inner">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        href={link.path}
                                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 relative ${
                                            isActive(link.path)
                                                ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Left: Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            
                            {/* Exchange Rate Widget */}
                            <div className="relative" ref={exchangePopupRef}>
                                <button
                                    onClick={() => setShowExchangeModal(!showExchangeModal)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200/60 shadow-sm"
                                    title="تحديث سعر الصرف"
                                >
                                    <DollarSign size={16} strokeWidth={2.5} />
                                    <span>{exchangeRate > 0 ? exchangeRate.toLocaleString() : '---'} ج.س</span>
                                </button>

                                {showExchangeModal && (
                                    <div className="absolute left-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50 origin-top-left p-5">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-slate-800">تحديث سعر الصرف</h4>
                                            <button onClick={() => setShowExchangeModal(false)} className="text-slate-400 hover:text-slate-900 p-1 bg-slate-100 rounded-full transition-colors">
                                                <X size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-2 block">السعر مقابل 1 دولار</label>
                                                <input
                                                    type="number"
                                                    value={newExchangeRate}
                                                    onChange={(e) => setNewExchangeRate(e.target.value)}
                                                    className="w-full font-bold text-base border-2 border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50 focus:bg-white"
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
                                                className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-indigo-500/20"
                                            >
                                                {savingRate ? 'جاري الحفظ...' : 'حفظ التحديث'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Branch Switcher Widget */}
                            {currentUser?.role === 'ADMIN' ? (
                                <div className="relative" ref={branchPopupRef}>
                                    <button
                                        onClick={() => setShowBranchModal(!showBranchModal)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200/60 shadow-sm animate-fade-in"
                                        title="تبديل الفرع (مدير النظام)"
                                    >
                                        <Rocket size={16} strokeWidth={2.5} className="text-indigo-500" />
                                        <span>{branches.find(b => b.id === activeBranchId)?.name || 'جاري التحميل...'}</span>
                                    </button>

                                    {showBranchModal && (
                                        <div className="absolute left-0 mt-3 w-72 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50 origin-top-left p-5">
                                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                                <h4 className="font-black text-slate-850">فروع المحل</h4>
                                                <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-slate-900 p-1 bg-slate-100 rounded-full transition-colors">
                                                    <X size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
                                                {branches.map((b) => (
                                                    <button
                                                        key={b.id}
                                                        onClick={() => handleBranchSwitch(b.id)}
                                                        className={`w-full text-right px-3 py-2 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${
                                                            b.id === activeBranchId
                                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                                                : 'hover:bg-slate-50 text-slate-700'
                                                        }`}
                                                    >
                                                        <span>{b.name}</span>
                                                        {b.id === activeBranchId && (
                                                            <span className="w-2 h-2 bg-white rounded-full"></span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {currentUser?.role === 'ADMIN' && (
                                                <div className="border-t border-slate-100 pt-3 space-y-3">
                                                    <h5 className="text-xs font-black text-slate-500">إضافة محل / فرع جديد</h5>
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            placeholder="اسم المحل (مثال: فرع 2)"
                                                            value={newBranchName}
                                                            onChange={(e) => setNewBranchName(e.target.value)}
                                                            className="w-full text-xs font-bold border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="رمز الفرع بالإنجليزية (مثال: branch2)"
                                                            value={newBranchCode}
                                                            onChange={(e) => setNewBranchCode(e.target.value)}
                                                            className="w-full text-xs font-bold border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white"
                                                        />
                                                        <button
                                                            onClick={handleCreateBranch}
                                                            disabled={creatingBranch || !newBranchName || !newBranchCode}
                                                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50"
                                                        >
                                                            {creatingBranch ? 'جاري الإضافة...' : 'إضافة الفرع'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-700 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-sm" title="فرعك المخصص">
                                    <Rocket size={16} strokeWidth={2.5} className="text-indigo-500" />
                                    <span>{currentUser?.branch?.name || branches.find(b => b.id === activeBranchId)?.name || 'الفرع المخصص'}</span>
                                </div>
                            )}

                            <div className="w-px h-6 bg-slate-200 mx-1"></div>

                            {/* Search Button */}
                            <button
                                onClick={openSearch}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100/80 hover:bg-slate-200/80 border border-transparent hover:border-slate-300 rounded-full transition-all"
                                title="بحث سريع"
                            >
                                <Search size={16} strokeWidth={2.5} />
                                <span className="hidden lg:inline">بحث...</span>
                            </button>

                            {/* Notifications Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowNotifications(!showNotifications)
                                        if (!showNotifications) markAsRead()
                                    }}
                                    className="relative p-2.5 text-slate-500 hover:text-indigo-600 bg-slate-100/80 hover:bg-indigo-50 rounded-full transition-all border border-transparent hover:border-indigo-100"
                                    title="الإشعارات"
                                >
                                    <Bell size={18} strokeWidth={2.5} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute left-0 mt-3 w-[320px] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden animate-fade-in-up z-50 origin-top-left flex flex-col">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                            <span className="font-black text-slate-800">الإشعارات</span>
                                            {unreadCount > 0 && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{unreadCount} جديد</span>}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400 font-bold text-sm flex flex-col items-center gap-2">
                                                    <Bell size={24} className="opacity-20" />
                                                    لا توجد إشعارات حالياً
                                                </div>
                                            ) : (
                                                notifications.map(notification => (
                                                    <div key={notification.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-indigo-50/30' : ''}`}>
                                                        <h4 className={`text-sm ${!notification.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{notification.title}</h4>
                                                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{notification.message}</p>
                                                        <span className="text-[10px] text-slate-400 mt-2 block font-bold">{new Date(notification.createdAt).toLocaleDateString('ar-SD')}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                                title="تسجيل خروج"
                            >
                                <LogOut size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="xl:hidden flex items-center gap-2">
                            <button
                                onClick={openSearch}
                                className="p-2.5 text-slate-600 bg-slate-100 rounded-full"
                            >
                                <Search size={18} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2.5 text-slate-900 bg-white shadow-sm border border-slate-200 rounded-xl transition-all"
                            >
                                {isOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isOpen && (
                    <div className="xl:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-slate-200 shadow-2xl animate-slide-down">
                        <div className="flex flex-col p-4 space-y-1">
                            {/* Branch Switcher on Mobile */}
                            {currentUser?.role === 'ADMIN' && branches.length > 1 && (
                                <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                                    <span className="text-xs font-black text-slate-500 mb-2 block">تبديل الفرع / المحل النشط:</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {branches.map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => {
                                                    handleBranchSwitch(b.id)
                                                    setIsOpen(false)
                                                }}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold text-center border transition-all ${
                                                    b.id === activeBranchId
                                                        ? 'bg-indigo-600 text-white border-indigo-700'
                                                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                                                }`}
                                            >
                                                {b.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                        isActive(link.path)
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="border-t border-slate-100 my-2"></div>
                            <div className="px-4 py-3 flex items-center justify-between bg-emerald-50 rounded-xl mb-2">
                                <span className="text-sm font-bold text-emerald-800">سعر الصرف (ج.س)</span>
                                <span className="text-sm font-black text-emerald-900">{exchangeRate.toLocaleString()}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-sm font-bold"
                            >
                                <LogOut size={18} />
                                <span>تسجيل خروج</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}
