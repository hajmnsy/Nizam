'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    AlertTriangle,
    ShoppingCart,
    Plus,
    Package,
    ArrowLeft,
    Activity,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    Layers,
    Receipt,
    Users,
    ChevronLeft,
    Sparkles,
    BarChart3,
    Clock,
    CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardData {
    dailySales: number
    monthlySales: number
    monthlyExpenses: number
    netProfit: number
    lowStockItems: any[]
    recentSales: any[]
}

export default function Home() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [exchangeRate, setExchangeRate] = useState<number>(0)

    useEffect(() => {
        Promise.all([
            fetch('/api/dashboard', { cache: 'no-store' }).then(r => r.json()),
            fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()),
            fetch('/api/exchange-rate', { cache: 'no-store' }).then(r => r.json())
        ]).then(([dashboardData, userData, rateData]) => {
            if (dashboardData && !dashboardData.error) setData(dashboardData)
            if (userData && !userData.error) setCurrentUser(userData)
            if (rateData && rateData.rate) setExchangeRate(rateData.rate)
        }).catch(console.error)
        .finally(() => setLoading(false))
    }, [])

    const todayDateFormatted = new Date().toLocaleDateString('ar-SD', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <main className="min-h-screen bg-slate-50/80">
            <Navbar />

            <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-8 animate-fade-in">
                
                {/* Executive Corporate Hero Header */}
                <div className="relative rounded-3xl bg-slate-900 text-white p-6 md:p-8 overflow-hidden shadow-2xl shadow-indigo-950/20 border border-slate-800">
                    {/* Background Decorative Ambient Gradients */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    <span>🟢 {currentUser?.branch?.name || 'الفرع الرئيسي'}</span>
                                </span>
                                <span className="text-slate-300 text-xs font-bold flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span>{todayDateFormatted}</span>
                                </span>
                            </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <Link href="/sales/new" className="flex-1 md:flex-none">
                                <Button variant="gradient" size="lg" className="w-full font-black text-sm px-6 py-3 shadow-lg shadow-blue-500/25">
                                    <Plus size={18} />
                                    <span>فاتورة بيع جديدة</span>
                                </Button>
                            </Link>
                            <Link href="/expenses" className="flex-1 md:flex-none">
                                <Button variant="glass" size="lg" className="w-full text-white border-white/20 hover:bg-white/10 font-black text-sm px-6 py-3">
                                    <Receipt size={18} />
                                    <span>منصرف جديد</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Executive Metric KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* Daily Sales */}
                    <Card variant="enterprise" className="relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                                <Activity size={24} />
                            </div>
                            {exchangeRate > 0 && data?.dailySales ? (
                                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                    ${(data.dailySales / exchangeRate).toFixed(1)}
                                </span>
                            ) : null}
                        </div>
                        <h3 className="text-slate-500 text-xs font-bold mb-1">مبيعات اليوم</h3>
                        <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            {loading ? '...' : (data?.dailySales || 0).toLocaleString()} <span className="text-xs text-slate-400 font-bold">ج.س</span>
                        </div>
                    </Card>

                    {/* Monthly Sales */}
                    <Card variant="enterprise" className="relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                                <Calendar size={24} />
                            </div>
                            {exchangeRate > 0 && data?.monthlySales ? (
                                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    ${(data.monthlySales / exchangeRate).toFixed(0)}
                                </span>
                            ) : null}
                        </div>
                        <h3 className="text-slate-500 text-xs font-bold mb-1">مبيعات الشهر الحالي</h3>
                        <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            {loading ? '...' : (data?.monthlySales || 0).toLocaleString()} <span className="text-xs text-slate-400 font-bold">ج.س</span>
                        </div>
                    </Card>

                    {/* Monthly Expenses */}
                    <Card variant="enterprise" className="relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                                <TrendingDown size={24} />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                                تشغيلية
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-xs font-bold mb-1">مصروفات الشهر</h3>
                        <div className="text-2xl md:text-3xl font-black text-rose-700 tracking-tight">
                            {loading ? '...' : (data?.monthlyExpenses || 0).toLocaleString()} <span className="text-xs text-rose-400 font-bold">ج.س</span>
                        </div>
                    </Card>

                    {/* Net Trading Profit */}
                    <Card variant="gradient" className="relative overflow-hidden group border-emerald-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                                صافي الربح
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-xs font-bold mb-1">الأرباح الشهرية الصافية</h3>
                        <div className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight font-mono">
                            {loading ? '...' : (data?.netProfit || 0).toLocaleString()} <span className="text-xs text-emerald-500 font-bold font-sans">ج.س</span>
                        </div>
                    </Card>

                </div>



                {/* Main Content Feed: Recent Operations & Stock Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Invoices Feed (2 Columns) */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card variant="enterprise" className="p-6">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800">أحدث عمليات البيع والفواتير</h2>
                                        <p className="text-xs text-slate-400 font-medium">سجل المبيعات اليومية المباشرة</p>
                                    </div>
                                </div>
                                <Link href="/sales" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                                    <span>عرض الكل</span>
                                    <ChevronLeft size={14} />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>)
                                ) : !data?.recentSales || data.recentSales.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 font-bold text-sm">
                                        لا توجد عمليات بيع حديثة
                                    </div>
                                ) : (
                                    data.recentSales.map((sale: any) => (
                                        <Link key={sale.id} href={`/sales/${sale.id}`}>
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-200/60 hover:border-indigo-200 transition-all duration-300 group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shadow-sm">
                                                        #{sale.invoiceNumber || sale.id}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{sale.customer || 'عميل نقدي'}</h4>
                                                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                                            <span>{new Date(sale.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span>{sale.items?.length || 0} أصناف</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-black text-slate-800 font-mono text-base">
                                                        {sale.total.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">ج.س</span>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                                        <CheckCircle2 size={10} />
                                                        مكتملة
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Stock Alert Feed (1 Column) */}
                    <div className="space-y-4">
                        <Card variant="enterprise" className="p-6 border-amber-200/60">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">تنبيهات نواقص المخزون</h2>
                                    <p className="text-xs text-slate-400 font-medium">أصناف شارفت على النفاد</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {loading ? (
                                    [1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>)
                                ) : !data?.lowStockItems || data.lowStockItems.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        جميع المنتجات متوفرة بشكل ممتاز 👍
                                    </div>
                                ) : (
                                    data.lowStockItems.map((item: any) => (
                                        <div key={item.id} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-slate-800">{item.name}</span>
                                                <span className="font-bold text-amber-700 font-mono bg-amber-100 px-2 py-0.5 rounded-full">
                                                    المتبقي: {item.quantity}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                                                    style={{ width: `${Math.min(100, (item.quantity / 20) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <Link href="/inventory/add">
                                    <Button variant="outline" className="w-full text-xs">
                                        <Plus size={14} />
                                        <span>إضافة كميات جديدة للمخزن</span>
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>

                </div>

            </div>
        </main>
    )
}
