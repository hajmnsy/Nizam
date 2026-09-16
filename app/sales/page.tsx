'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Eye, FileText, CheckCircle, Clock, ChevronRight, ChevronLeft, CreditCard, X, Loader2, Printer, Edit, Search, Download, DollarSign, Wallet, AlertCircle, Building2, Calendar, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'

interface Sale {
    id: number
    invoiceNumber?: number
    customer: string
    total: number
    paidAmount?: number
    remainingAmount?: number
    status: string
    createdAt: string
    paymentMethod?: string
    bankName?: string
    bankRef?: string
    branch?: { id: number; name: string }
    dispatchBranch?: { id: number; name: string }
    items: any[]
}

export default function SalesList() {
    // Default to today in YYYY-MM-DD local format
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'ALL' | 'PAID' | 'CREDIT' | 'QUOTATION'>('PAID')
    const [date, setDate] = useState<string>(getTodayLocal())
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [customerFilter, setCustomerFilter] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState<string>('')

    // Branch Filter State
    const [branches, setBranches] = useState<any[]>([])
    const [selectedBranchId, setSelectedBranchId] = useState<string>('')
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        // Fetch current user and branches
        Promise.all([
            fetch('/api/auth/me').then(r => r.json()),
            fetch('/api/branches').then(r => r.json())
        ]).then(([userData, branchesData]) => {
            if (!userData.error) setCurrentUser(userData)
            if (Array.isArray(branchesData)) setBranches(branchesData)
        }).catch(console.error)

        const params = new URLSearchParams(window.location.search)
        const cust = params.get('customer')
        if (cust) {
            setCustomerFilter(cust)
            setDate('') // Clear date filter to show all invoices for the customer
            setTab('ALL') // Switch to ALL tab to show all their invoices regardless of status
        }
    }, [])
    
    // Quick Payment State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [paymentAmount, setPaymentAmount] = useState<string>('')
    const [submittingPayment, setSubmittingPayment] = useState(false)

    const changeDateByDays = (days: number) => {
        const base = date || getTodayLocal()
        const currentDate = new Date(base)
        currentDate.setDate(currentDate.getDate() + days)
        const newDateStr = currentDate.toISOString().split('T')[0]
        setDate(newDateStr)
        setStartDate('')
        setEndDate('')
    }

    // Date Presets
    const setTodayPreset = () => {
        setDate(getTodayLocal())
        setStartDate('')
        setEndDate('')
    }

    const setYesterdayPreset = () => {
        const y = new Date()
        y.setDate(y.getDate() - 1)
        const offset = y.getTimezoneOffset()
        const localY = new Date(y.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
        setDate(localY)
        setStartDate('')
        setEndDate('')
    }

    const setThisWeekPreset = () => {
        const now = new Date()
        const day = now.getDay() // 0 = Sunday
        const diff = (day + 1) % 7 // Saturday as week start in Sudan
        const start = new Date(now)
        start.setDate(now.getDate() - diff)
        const offset = now.getTimezoneOffset()
        const startStr = new Date(start.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
        const endStr = new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
        setDate('')
        setStartDate(startStr)
        setEndDate(endStr)
    }

    const setThisMonthPreset = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const startStr = `${year}-${month}-01`
        const offset = now.getTimezoneOffset()
        const endStr = new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
        setDate('')
        setStartDate(startStr)
        setEndDate(endStr)
    }

    const setAllTimePreset = () => {
        setDate('')
        setStartDate('')
        setEndDate('')
    }

    const refreshSales = () => {
        setLoading(true)
        let queryParams = `status=${tab}`
        if (startDate && endDate) {
            queryParams += `&startDate=${startDate}&endDate=${endDate}`
        } else if (date) {
            queryParams += `&date=${date}`
        }
        if (customerFilter) {
            queryParams += `&customer=${encodeURIComponent(customerFilter)}`
        }
        if (selectedBranchId) {
            queryParams += `&branchId=${selectedBranchId}`
        }

        fetch(`/api/sales?${queryParams}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setSales(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        refreshSales()
    }, [tab, date, startDate, endDate, customerFilter, selectedBranchId])

    // Client-side Instant Filter (by invoice #, customer name, item name, bank ref)
    const filteredSales = useMemo(() => {
        if (!searchTerm.trim()) return sales
        const term = searchTerm.trim().toLowerCase()
        return sales.filter(s => {
            const invMatch = (s.invoiceNumber?.toString() || '').includes(term) || s.id.toString().includes(term)
            const custMatch = (s.customer || '').toLowerCase().includes(term)
            const itemMatch = s.items?.some((it: any) => (it.product?.name || '').toLowerCase().includes(term))
            const bankRefMatch = ((s as any).bankRef || '').toLowerCase().includes(term)
            return invMatch || custMatch || itemMatch || bankRefMatch
        })
    }, [sales, searchTerm])

    // Live KPI Metrics
    const kpi = useMemo(() => {
        let totalSales = 0
        let totalPaid = 0
        let totalRemaining = 0
        let paidCount = 0
        let creditCount = 0
        let quotationCount = 0

        filteredSales.forEach(s => {
            totalSales += (s.total || 0)
            if (s.status === 'PAID') {
                totalPaid += (s.total || 0)
                paidCount++
            } else if (s.status === 'CREDIT') {
                totalPaid += (s.paidAmount || 0)
                totalRemaining += (s.remainingAmount || 0)
                creditCount++
            } else if (s.status === 'QUOTATION') {
                quotationCount++
            }
        })

        return { totalSales, totalPaid, totalRemaining, paidCount, creditCount, quotationCount, totalCount: filteredSales.length }
    }, [filteredSales])

    // Export to Excel / CSV with UTF-8 BOM
    const exportToExcel = () => {
        if (filteredSales.length === 0) {
            alert('لا توجد بيانات متاحة للتصدير')
            return
        }
        const headers = ['رقم الفاتورة', 'العميل', 'الفرع', 'التاريخ', 'الوقت', 'الإجمالي (ج.س)', 'المدفوع', 'المتبقي', 'طريقة الدفع', 'المرجع البنكي', 'الحالة', 'الأصناف']
        const rows = filteredSales.map(s => [
            s.invoiceNumber || s.id,
            s.customer || 'عميل نقدي',
            (s as any).branch?.name || '',
            new Date(s.createdAt).toLocaleDateString('ar-SD'),
            new Date(s.createdAt).toLocaleTimeString('ar-SD'),
            s.total,
            s.paidAmount || 0,
            s.remainingAmount || 0,
            (s as any).paymentMethod === 'BANK' ? `بنك (${(s as any).bankName || ''})` : (s as any).paymentMethod === 'CHEQUE' ? 'شيك' : (s as any).paymentMethod === 'MULTIPLE' ? 'مجزأ' : 'نقدي',
            (s as any).bankRef || '',
            s.status === 'PAID' ? 'مسددة' : s.status === 'CREDIT' ? 'آجلة' : 'عرض سعر',
            s.items?.map((it: any) => `${it.quantity}x ${it.product?.name || ''}`).join(' - ')
        ])
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `كشف_المبيعات_${date || startDate || 'شامل'}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleQuickPayment = async () => {
        if (!selectedSale || !paymentAmount || isNaN(parseFloat(paymentAmount))) return
        setSubmittingPayment(true)

        try {
            const res = await fetch(`/api/sales/${selectedSale.id}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: paymentAmount })
            })

            if (res.ok) {
                setPaymentModalOpen(false)
                setPaymentAmount('')
                refreshSales()
            } else {
                alert('حدث خطأ أثناء تسجيل الدفعة')
            }
        } catch (error) {
            console.error(error)
            alert('تعذر الاتصال بالخادم')
        } finally {
            setSubmittingPayment(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-3 sm:p-6 max-w-7xl animate-fade-in-up space-y-6">
                
                {/* Header Title & Primary Action Buttons */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
                            {tab === 'ALL' ? <FileText className="text-slate-600" /> : tab === 'PAID' ? <CheckCircle className="text-emerald-600" /> : tab === 'CREDIT' ? <Clock className="text-amber-600" /> : <FileText className="text-blue-600" />}
                            <span>{tab === 'ALL' ? 'سجل المبيعات الشامل' : tab === 'PAID' ? 'فواتير المبيعات المسددة' : tab === 'CREDIT' ? 'المبيعات الآجلة (المتبقيات)' : 'عروض الأسعار والمسودات'}</span>
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                            متابعة دقيقة لحركة فواتير البيع اليومية، التحصيل المالي، والذمم المدينة
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                        <Button 
                            onClick={exportToExcel}
                            variant="outline" 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs shadow-xs"
                            title="تصدير إلى ملف إكسل"
                        >
                            <Download size={16} className="text-emerald-600" />
                            <span>تصدير إكسل</span>
                        </Button>

                        <Link href="/sales/daily" className="flex-1 sm:flex-none">
                            <Button variant="outline" className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs shadow-xs">
                                <FileText size={16} className="text-blue-600" />
                                <span>تقرير اليومية</span>
                            </Button>
                        </Link>
                        
                        <Link href="/sales/new" className="flex-1 sm:flex-none">
                            <Button className="w-full flex items-center justify-center gap-1.5 py-2.5 px-5 font-black text-xs shadow-md shadow-blue-500/20">
                                <Plus size={16} />
                                <span>فاتورة جديدة</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 1. Live Executive KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Total Invoiced */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">إجمالي المبيعات</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
                            {kpi.totalSales.toLocaleString()} <span className="text-xs font-bold font-sans text-slate-400">ج.س</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 mt-1 block">
                            من {kpi.totalCount} عملية بيع
                        </span>
                    </div>

                    {/* Total Cash & Bank Collected */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600">المحصل الفعلي (خزينة/بنك)</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Wallet size={18} />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2 font-mono">
                            {kpi.totalPaid.toLocaleString()} <span className="text-xs font-bold font-sans text-emerald-500">ج.س</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600/80 mt-1 block">
                            سيولة نقدية محصلة
                        </span>
                    </div>

                    {/* Total Receivables (Credit) */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-600">الآجل المتبقي (الذمم)</span>
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                                <AlertCircle size={18} />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-rose-700 mt-2 font-mono">
                            {kpi.totalRemaining.toLocaleString()} <span className="text-xs font-bold font-sans text-rose-400">ج.س</span>
                        </div>
                        <span className="text-[11px] font-bold text-rose-600/80 mt-1 block">
                            {kpi.creditCount} فواتير آجلة
                        </span>
                    </div>

                    {/* Invoices Count Breakdown */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">عدد العمليات</span>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <FileText size={18} />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-2 font-mono">
                            {kpi.totalCount} <span className="text-xs font-bold font-sans text-slate-400">فاتورة</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                            <span className="text-emerald-600">{kpi.paidCount} مسدد</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-amber-600">{kpi.creditCount} آجل</span>
                            {kpi.quotationCount > 0 && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-blue-600">{kpi.quotationCount} عرض</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Comprehensive Filter & Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    
                    {/* Top Row: Live Search Input + Branch Selector + Date Presets */}
                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                        
                        {/* Instant Search Box */}
                        <div className="relative flex-1">
                            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="🔍 بحث فوري برقم الفاتورة، اسم العميل، الصنف، أو مرجع بنكك..."
                                className="w-full pr-10 pl-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Branch Selector (if multiple branches exist) */}
                        {branches.length > 1 && (
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
                                <Building2 size={15} className="text-slate-500" />
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                                >
                                    <option value="">🏢 كل الفروع</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date Navigation & Presets */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1 gap-1">
                                <button
                                    onClick={setTodayPreset}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${date === getTodayLocal() && !startDate ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'}`}
                                >
                                    اليوم
                                </button>
                                <button
                                    onClick={setYesterdayPreset}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-200/60 transition-all"
                                >
                                    أمس
                                </button>
                                <button
                                    onClick={setThisWeekPreset}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${startDate && !date ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'}`}
                                >
                                    هذا الأسبوع
                                </button>
                                <button
                                    onClick={setThisMonthPreset}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-200/60 transition-all"
                                >
                                    هذا الشهر
                                </button>
                                <button
                                    onClick={setAllTimePreset}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${!date && !startDate ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'}`}
                                >
                                    الكل
                                </button>
                            </div>

                            {/* Specific Date Picker with Prev/Next */}
                            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => changeDateByDays(1)}
                                    className="p-2 text-slate-500 hover:bg-slate-200/60 transition-colors border-l border-slate-200"
                                    title="اليوم التالي"
                                >
                                    <ChevronRight size={15} />
                                </button>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value)
                                        setStartDate('')
                                        setEndDate('')
                                    }}
                                    className="border-none px-2 py-1 text-xs font-bold text-slate-800 outline-none w-28 bg-transparent"
                                />
                                <button
                                    onClick={() => changeDateByDays(-1)}
                                    className="p-2 text-slate-500 hover:bg-slate-200/60 transition-colors border-r border-slate-200"
                                    title="اليوم السابق"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Status Tabs */}
                    <div className="flex gap-1.5 border-t border-slate-100 pt-3 overflow-x-auto">
                        <button
                            onClick={() => setTab('PAID')}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === 'PAID'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <CheckCircle size={14} />
                            <span>الفواتير المسددة</span>
                            <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{kpi.paidCount}</span>
                        </button>
                        <button
                            onClick={() => setTab('CREDIT')}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === 'CREDIT'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <Clock size={14} />
                            <span>المبيعات الآجلة</span>
                            <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{kpi.creditCount}</span>
                        </button>
                        <button
                            onClick={() => setTab('QUOTATION')}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === 'QUOTATION'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <FileText size={14} />
                            <span>عروض الأسعار</span>
                            <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{kpi.quotationCount}</span>
                        </button>
                        <button
                            onClick={() => setTab('ALL')}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === 'ALL'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <span>الكل</span>
                            <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{kpi.totalCount}</span>
                        </button>
                    </div>
                </div>

                {customerFilter && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
                        <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
                            <CheckCircle size={18} className="text-emerald-500" /> 
                            يتم عرض نتائج البحث الخاصة بالعميل: <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{customerFilter}</span>
                        </span>
                        <button 
                            onClick={() => {
                                setCustomerFilter('')
                                setDate(getTodayLocal())
                                window.history.replaceState({}, '', '/sales')
                            }} 
                            className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-full transition-colors"
                            title="إلغاء الفلتر"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <Card className="overflow-hidden border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs sm:text-sm">
                            <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 text-xs">
                                <tr>
                                    <th className="p-3.5 sm:p-4">{tab === 'QUOTATION' ? 'الرمز' : 'رقم الفاتورة'}</th>
                                    <th className="p-3.5 sm:p-4">العميل</th>
                                    <th className="p-3.5 sm:p-4">الفرع والمستودع</th>
                                    <th className="p-3.5 sm:p-4">التاريخ والوقت</th>
                                    <th className="p-3.5 sm:p-4">الإجمالي وطريقة الدفع</th>
                                    <th className="p-3.5 sm:p-4">تفاصيل الأصناف</th>
                                    <th className="p-3.5 sm:p-4">حالة السداد</th>
                                    <th className="p-3.5 sm:p-4 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 size={28} className="animate-spin text-blue-600" />
                                                <span className="font-bold text-xs">جاري تحميل سجل المبيعات...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <FileText size={42} className="opacity-40" />
                                                <span className="font-bold text-sm text-slate-600">لا توجد فواتير مطابقة للبحث أو الفلتر المختار</span>
                                                <span className="text-xs text-slate-400">جرّب تغيير التاريخ أو تفريغ شريط البحث</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map(sale => (
                                        <tr key={sale.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="p-3.5 sm:p-4 font-mono font-black text-slate-800">
                                                {sale.status === 'QUOTATION' ? (
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono font-bold">مسودة</span>
                                                ) : (
                                                    <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-mono font-black text-xs sm:text-sm">
                                                        #{sale.invoiceNumber || sale.id}
                                                    </span>
                                                )}
                                            </td>
                                            
                                            <td className="p-3.5 sm:p-4">
                                                <div className="font-black text-slate-900 leading-snug">{sale.customer || 'عميل نقدي'}</div>
                                            </td>

                                            <td className="p-3.5 sm:p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md w-fit border border-slate-200/60">
                                                        <Building2 size={12} className="text-indigo-500" />
                                                        <span>{(sale as any).branch?.name || 'الفرع الرئيسي'}</span>
                                                    </span>
                                                    {(sale as any).dispatchBranch && (sale as any).dispatchBranchId !== sale.branch?.id && (
                                                        <span className="text-[10px] text-amber-700 font-bold">
                                                            صرف: {(sale as any).dispatchBranch?.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-3.5 sm:p-4 text-slate-600 text-xs">
                                                <span className="font-bold text-slate-800 font-mono block">
                                                    {new Date(sale.createdAt).toLocaleDateString('ar-SD')}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {new Date(sale.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>

                                            <td className="p-3.5 sm:p-4">
                                                <div className="font-black text-slate-900 font-mono text-sm">
                                                    {sale.total.toLocaleString()} <span className="text-[11px] font-sans font-bold text-slate-500">ج.س</span>
                                                </div>
                                                
                                                {/* Currency Tag */}
                                                {(sale as any).currency && (sale as any).currency !== 'SDG' && (
                                                    <span className="text-[10px] font-mono font-bold text-emerald-700 block mt-0.5">
                                                        {((sale.total / ((sale as any).currencyRate || 1))).toLocaleString(undefined, { maximumFractionDigits: 2 })} {(sale as any).currency}
                                                    </span>
                                                )}

                                                {/* Payment Method Details */}
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {(sale as any).paymentMethod === 'BANK' ? (
                                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200/80 flex items-center gap-1">
                                                            <span>بنك: {(sale as any).bankName || 'تحويل'}</span>
                                                            {(sale as any).bankRef && (
                                                                <span className="font-mono text-blue-900 font-black">#{(sale as any).bankRef}</span>
                                                            )}
                                                        </span>
                                                    ) : (sale as any).paymentMethod === 'CHEQUE' ? (
                                                        <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">
                                                            شيك #{(sale as any).chequeNumber || ''}
                                                        </span>
                                                    ) : (sale as any).paymentMethod === 'MULTIPLE' ? (
                                                        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200">
                                                            دفع مجزأ
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                                                            نقدي (خزينة)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-3.5 sm:p-4">
                                                <div className="flex flex-col gap-1 max-w-[260px]">
                                                    {sale.items.map((item: any, i: number) => (
                                                        <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/80 w-fit whitespace-normal text-right leading-tight">
                                                            <span className="font-black text-blue-600">{item.quantity}</span> × {item.product?.name || 'صنف'} {item.product?.thickness ? `(${item.product.thickness}مم)` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="p-3.5 sm:p-4">
                                                {sale.status === 'PAID' ? (
                                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 w-fit">
                                                        <CheckCircle size={13} className="text-emerald-600" />
                                                        <span>مسددة</span>
                                                    </span>
                                                ) : sale.status === 'CREDIT' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 w-fit">
                                                            <Clock size={13} className="text-amber-600" />
                                                            <span>آجلة</span>
                                                        </span>
                                                        <span className="text-[11px] text-rose-600 font-black font-mono whitespace-nowrap">
                                                            المتبقي: {sale.remainingAmount?.toLocaleString() || 0} ج.س
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 w-fit">
                                                        <FileText size={13} className="text-blue-600" />
                                                        <span>عرض سعر</span>
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-3.5 sm:p-4">
                                                <div className="flex items-center gap-1.5 justify-center">
                                                    {sale.status === 'CREDIT' && (
                                                        <Button 
                                                            variant="outline" 
                                                            onClick={() => {
                                                                setSelectedSale(sale)
                                                                setPaymentAmount(sale.remainingAmount?.toString() || '')
                                                                setPaymentModalOpen(true)
                                                            }}
                                                            className="px-2.5 py-1 text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 font-black"
                                                            title="تسجيل دفعة تحصيل"
                                                        >
                                                            <CreditCard size={13} className="ml-1 text-amber-600" />
                                                            <span>تسديد</span>
                                                        </Button>
                                                    )}
                                                    <Link href={`/sales/${sale.id}`}>
                                                        <Button variant="outline" className="p-1.5 text-xs border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700" title="عرض وطباعة الفاتورة">
                                                            <Eye size={15} />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/sales/${sale.id}/edit`}>
                                                        <Button variant="outline" className="p-1.5 text-xs border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700" title="تعديل الفاتورة">
                                                            <Edit size={15} />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => window.open(`/sales/${sale.id}?print=true`, '_blank')}
                                                        className="p-1.5 text-xs border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                                                        title="طباعة مباشرة"
                                                    >
                                                        <Printer size={15} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Quick Payment Modal */}
            {paymentModalOpen && selectedSale && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-slide-up">
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-black text-slate-800 text-lg sm:text-xl flex items-center gap-2">
                                <CreditCard className="text-amber-500" size={24} />
                                تسديد دفعة جديدة
                            </h3>
                            <button
                                onClick={() => setPaymentModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                <div className="text-sm font-bold text-slate-700 flex justify-between mb-2">
                                    <span>الفاتورة:</span>
                                    <span>#{selectedSale.invoiceNumber || selectedSale.id}</span>
                                </div>
                                <div className="text-sm font-bold text-slate-700 flex justify-between mb-2">
                                    <span>العميل:</span>
                                    <span>{selectedSale.customer || 'عميل نقدي'}</span>
                                </div>
                                <div className="text-sm font-bold text-slate-700 flex justify-between mb-2">
                                    <span>الإجمالي:</span>
                                    <span className="text-blue-600">{selectedSale.total.toLocaleString()} ج.س</span>
                                </div>
                                <div className="text-sm font-black text-rose-600 flex justify-between pt-2 border-t border-slate-200 mt-2">
                                    <span>الباقي للمطلبة:</span>
                                    <span>{selectedSale.remainingAmount?.toLocaleString()} ج.س</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        المبلغ المدفوع (ج.س) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 text-lg outline-none focus:border-amber-500 transition-all bg-white"
                                        placeholder="0"
                                        min="1"
                                        max={selectedSale.remainingAmount}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleQuickPayment()
                                        }}
                                    />
                                    {parseFloat(paymentAmount) > (selectedSale.remainingAmount || 0) && (
                                        <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1">
                                            المبلغ المدفوع أكبر من الباقي!
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setPaymentModalOpen(false)}
                                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-200 hover:text-slate-800"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleQuickPayment}
                                disabled={submittingPayment || !paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > (selectedSale.remainingAmount || 0)}
                                className="flex-1 py-3 border-transparent"
                            >
                                {submittingPayment ? (
                                    <><Loader2 className="animate-spin ml-2" size={18} /> جاري الحفظ...</>
                                ) : (
                                    <>حفظ الدفعة</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
