'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Activity, BarChart2, AlertCircle, Download, Users, Package, FileText, Calendar, DollarSign, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart as RePieChart, Pie, Cell, ComposedChart, Line
} from 'recharts'

export default function Reports() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const getTodayStr = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [profitPeriodType, setProfitPeriodType] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today')
    const [profitStartDate, setProfitStartDate] = useState<string>(getTodayStr())
    const [profitEndDate, setProfitEndDate] = useState<string>(getTodayStr())
    const [profitData, setProfitData] = useState<any>(null)
    const [loadingProfit, setLoadingProfit] = useState(false)

    const fetchProfitData = (start = profitStartDate, end = profitEndDate) => {
        setLoadingProfit(true)
        fetch(`/api/reports/profit?startDate=${start}&endDate=${end}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(resData => {
                setProfitData(resData)
                setLoadingProfit(false)
            })
            .catch(err => {
                console.error(err)
                setLoadingProfit(false)
            })
    }

    useEffect(() => {
        fetch('/api/reports/analytics', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(console.error)

        fetchProfitData(getTodayStr(), getTodayStr())
    }, [])

    const setQuickProfitPeriod = (type: 'today' | 'yesterday' | 'week' | 'month') => {
        setProfitPeriodType(type)
        const today = new Date()
        const todayStr = getTodayStr()

        if (type === 'today') {
            setProfitStartDate(todayStr)
            setProfitEndDate(todayStr)
            fetchProfitData(todayStr, todayStr)
        } else if (type === 'yesterday') {
            const y = new Date(today)
            y.setDate(y.getDate() - 1)
            const offset = y.getTimezoneOffset()
            const yStr = new Date(y.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
            setProfitStartDate(yStr)
            setProfitEndDate(yStr)
            fetchProfitData(yStr, yStr)
        } else if (type === 'week') {
            const w = new Date(today)
            w.setDate(w.getDate() - 6)
            const offset = w.getTimezoneOffset()
            const wStr = new Date(w.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
            setProfitStartDate(wStr)
            setProfitEndDate(todayStr)
            fetchProfitData(wStr, todayStr)
        } else if (type === 'month') {
            const mStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
            setProfitStartDate(mStr)
            setProfitEndDate(todayStr)
            fetchProfitData(mStr, todayStr)
        }
    }

    // Professional, subdued color palette commonly used in enterprise apps
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#14b8a6', '#0ea5e9'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 flex flex-col gap-1.5 text-sm font-medium text-gray-700 dir-rtl text-right min-w-[140px]">
                    <p className="text-gray-500 mb-1 border-b border-gray-100 pb-1.5 text-xs">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                                <span>{entry.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900">{entry.value?.toLocaleString() || 0}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-10">
            <Navbar />

            <div className="container mx-auto p-4 md:px-6 max-w-7xl animate-fade-in-up">
                
                {/* Header Section */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            التقارير التحليلية
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">نظرة شاملة على الأداء المالي والتشغيلي</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/reports/export', { cache: 'no-store' })
                                    const exportData = await res.json()

                                    const wb = XLSX.utils.book_new()

                                    const salesWs = XLSX.utils.json_to_sheet(exportData.sales.map((s: any) => ({
                                        'رقم الفاتورة': s.id,
                                        'العميل': s.customer || 'نقدي',
                                        'المبلغ الكلي': s.total,
                                        'الحالة': s.status,
                                        'التاريخ': new Date(s.createdAt).toLocaleDateString('ar-SD')
                                    })))
                                    XLSX.utils.book_append_sheet(wb, salesWs, "المبيعات")

                                    const expensesWs = XLSX.utils.json_to_sheet(exportData.expenses.map((e: any) => ({
                                        'التصنيف': e.category,
                                        'الوصف': e.description,
                                        'المبلغ': e.amount,
                                        'التاريخ': new Date(e.date).toLocaleDateString('ar-SD')
                                    })))
                                    XLSX.utils.book_append_sheet(wb, expensesWs, "المصروفات")

                                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
                                    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                                    saveAs(blob, `تقرير_النظام_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`)

                                } catch (error) {
                                    alert('حدث خطأ أثناء التصدير')
                                }
                            }}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Download size={16} />
                            تصدير إلى Excel
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">

                        {/* KPI Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                            
                            {/* Net Profit */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <TrendingUp size={20} />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-500">صافي الأرباح الاست تقديري</h3>
                                    </div>
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">الشهر الحالي</span>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {data.stats.netProfit.toLocaleString()}
                                        </p>
                                        <span className="text-sm font-medium text-gray-500">ج.س</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Sales */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <Activity size={20} />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-500">إجمالي المبيعات</h3>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {data.stats.monthlySales.toLocaleString()}
                                        </p>
                                        <span className="text-sm font-medium text-gray-500">ج.س</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Expenses */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                            <TrendingDown size={20} />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-500">إجمالي المصروفات</h3>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {data.stats.monthlyExpenses.toLocaleString()}
                                        </p>
                                        <span className="text-sm font-medium text-gray-500">ج.س</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profit Query Section by Date / Range in SDG & USD */}
                        <div className="bg-white rounded-2xl p-5 md:p-6 border-2 border-emerald-200 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                            <DollarSign size={22} />
                                        </div>
                                        استعلام الأرباح بالتاريخ والعملتين (ج.س & USD)
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">عرض أرباح يوم معين أو فترة زمنية مخصصة بالجنيه السوداني والدولار</p>
                                </div>

                                {/* Quick Date Filters */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setQuickProfitPeriod('today')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${profitPeriodType === 'today' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        أرباح اليوم
                                    </button>
                                    <button
                                        onClick={() => setQuickProfitPeriod('yesterday')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${profitPeriodType === 'yesterday' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        أمس
                                    </button>
                                    <button
                                        onClick={() => setQuickProfitPeriod('week')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${profitPeriodType === 'week' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        آخر 7 أيام
                                    </button>
                                    <button
                                        onClick={() => setQuickProfitPeriod('month')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${profitPeriodType === 'month' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        الشهر الحالي
                                    </button>
                                </div>
                            </div>

                            {/* Date Inputs Controls */}
                            <div className="flex flex-col sm:flex-row items-end gap-4 mb-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                <div className="w-full sm:w-auto flex-1">
                                    <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                                        <Calendar size={14} className="text-emerald-600" />
                                        من تاريخ:
                                    </label>
                                    <input
                                        type="date"
                                        value={profitStartDate}
                                        onChange={e => {
                                            setProfitStartDate(e.target.value);
                                            setProfitPeriodType('custom');
                                        }}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-emerald-500 shadow-sm"
                                    />
                                </div>
                                <div className="w-full sm:w-auto flex-1">
                                    <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                                        <Calendar size={14} className="text-emerald-600" />
                                        إلى تاريخ:
                                    </label>
                                    <input
                                        type="date"
                                        value={profitEndDate}
                                        onChange={e => {
                                            setProfitEndDate(e.target.value);
                                            setProfitPeriodType('custom');
                                        }}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-emerald-500 shadow-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => fetchProfitData(profitStartDate, profitEndDate)}
                                    disabled={loadingProfit}
                                    className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    {loadingProfit ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Filter size={16} />
                                    )}
                                    عرض الأرباح
                                </button>
                            </div>

                            {/* Profit Display Cards */}
                            {loadingProfit ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                </div>
                            ) : profitData ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* 1. Product Trading Profit Card */}
                                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                                                    أرباح البضاعة المباعة
                                                </span>
                                                <TrendingUp size={20} className="text-emerald-600" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-600 mb-2">أرباح النشاط التجاري</h4>
                                            <div className="space-y-1">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-2xl font-black text-emerald-700">
                                                        {profitData.profitSDG.toLocaleString()}
                                                    </span>
                                                    <span className="text-sm font-bold text-emerald-800">ج.س</span>
                                                </div>
                                                <div className="flex items-baseline justify-between pt-1.5 border-t border-emerald-200/60">
                                                    <span className="text-xl font-black text-emerald-900">
                                                        ${profitData.profitUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-xs font-bold text-emerald-700">USD</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Total Sales Card */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
                                                    إجمالي الإيرادات
                                                </span>
                                                <Activity size={20} className="text-blue-600" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-600 mb-2">إجمالي المبيعات</h4>
                                            <div className="space-y-1">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-2xl font-black text-blue-700">
                                                        {profitData.totalSalesSDG.toLocaleString()}
                                                    </span>
                                                    <span className="text-sm font-bold text-blue-800">ج.س</span>
                                                </div>
                                                <div className="flex items-baseline justify-between pt-1.5 border-t border-blue-200/60">
                                                    <span className="text-xl font-black text-blue-900">
                                                        ${profitData.totalSalesUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-xs font-bold text-blue-700">USD</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Total Cost Card */}
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                                                    تكلفة الشراء الأصلية
                                                </span>
                                                <TrendingDown size={20} className="text-amber-600" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-600 mb-2">إجمالي تكلفة المبيعات</h4>
                                            <div className="space-y-1">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-2xl font-black text-amber-700">
                                                        {profitData.totalCostSDG.toLocaleString()}
                                                    </span>
                                                    <span className="text-sm font-bold text-amber-800">ج.س</span>
                                                </div>
                                                <div className="flex items-baseline justify-between pt-1.5 border-t border-amber-200/60">
                                                    <span className="text-xl font-black text-amber-900">
                                                        ${profitData.totalCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-xs font-bold text-amber-700">USD</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operational Summary Strip */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700">
                                        <div className="flex items-center gap-4">
                                            <span>عدد الفواتير: <span className="text-blue-700 font-mono text-sm">{profitData.salesCount}</span></span>
                                            <span>عدد القطع: <span className="text-purple-700 font-mono text-sm">{profitData.totalItemsQuantity}</span></span>
                                            <span>متوسط سعر الصرف: <span className="text-emerald-700 font-mono text-sm">{profitData.averageExchangeRate.toLocaleString()} ج.س/دولار</span></span>
                                        </div>
                                        {profitData.expensesSDG > 0 && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span>المصروفات التشغيلية: <span className="text-rose-600 font-mono">{profitData.expensesSDG.toLocaleString()} ج.س (${profitData.expensesUSD.toLocaleString()})</span></span>
                                                <span>•</span>
                                                <span>الربح النهائي بعد الخصم: <span className="text-emerald-800 font-black">{profitData.netProfitAfterExpensesSDG.toLocaleString()} ج.س (${profitData.netProfitAfterExpensesUSD.toLocaleString()})</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Action Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                            {/* Inventory Alert Link */}
                            <Link href="/inventory" className="block outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-amber-300 transition-colors flex items-center gap-4 cursor-pointer h-full">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <h3 className="text-gray-900 font-semibold text-lg">{data.stats.lowStockCount}</h3>
                                            <span className="text-gray-700 font-medium text-sm">عناصر</span>
                                        </div>
                                        <p className="text-gray-500 text-sm">منتجات قاربت على النفاد، يرجى مراجعة المخزون</p>
                                    </div>
                                </div>
                            </Link>

                            {/* Movement Report Link */}
                            <Link href="/reports/movement" className="block outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
                                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-300 transition-colors flex items-center gap-4 cursor-pointer h-full">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-semibold text-lg mb-0.5">حركة المقبوضات والمصروفات</h3>
                                        <p className="text-gray-500 text-sm">كشف تفصيلي وعرض وطباعة تقارير الحركة اليومية</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                            
                            {/* Main Cashflow Area Chart */}
                            <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-[380px]">
                                <div className="mb-4">
                                    <h2 className="text-base font-semibold text-gray-900">التدفق المالي</h2>
                                    <p className="text-sm text-gray-500">حركة المبيعات ضد المصروفات (آخر 30 يوماً)</p>
                                </div>
                                <div className="flex-1 w-full" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.cashflowChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} minTickGap={20} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => val === 0 ? '0' : `${val/1000}k`} />
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
                                            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconType="circle" />
                                            <Area type="monotone" name="المبيعات" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.1} fill="#3b82f6" activeDot={{ r: 5, strokeWidth: 0 }} />
                                            <Area type="monotone" name="المصروفات" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={0.1} fill="#ef4444" activeDot={{ r: 5, strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Selling Products */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-[380px]">
                                <div className="mb-4">
                                    <h2 className="text-base font-semibold text-gray-900">المنتجات الأكثر مبيعاً</h2>
                                    <p className="text-sm text-gray-500">هذا الشهر</p>
                                </div>
                                <div className="flex-1 w-full" dir="ltr">
                                    {data.topProducts && data.topProducts.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={data.topProducts} margin={{ top: 10, right: 0, bottom: 0, left: -20 }} layout="vertical">
                                                <CartesianGrid stroke="#f3f4f6" horizontal={true} vertical={false} strokeDasharray="3 3" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563' }} width={70} />
                                                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f9fafb'}} />
                                                <Bar dataKey="revenue" name="العائد" barSize={12} fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                                <Line dataKey="quantity" name="الكمية" type="monotone" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Third Row (Donuts & Bars) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                            
                            {/* Sales Categories */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-[340px]">
                                <div className="mb-2">
                                    <h2 className="text-base font-semibold text-gray-900">مبيعات الأقسام</h2>
                                </div>
                                <div className="flex-1 w-full relative" dir="ltr">
                                    {data.salesByCategory && data.salesByCategory.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={data.salesByCategory}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {data.salesByCategory.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">لا توجد مبيعات</div>
                                    )}
                                </div>
                            </div>

                            {/* Expenses By Category */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-[340px]">
                                <div className="mb-2">
                                    <h2 className="text-base font-semibold text-gray-900">توزيع المصروفات</h2>
                                </div>
                                <div className="flex-1 w-full" dir="ltr">
                                    {data.expensesByCategory && data.expensesByCategory.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={data.expensesByCategory}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={0}
                                                    outerRadius={80}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {data.expensesByCategory.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">لا توجد مصروفات</div>
                                    )}
                                </div>
                            </div>

                            {/* Top Customers */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-[340px]">
                                <div className="mb-4">
                                    <h2 className="text-base font-semibold text-gray-900">أكبر العملاء</h2>
                                </div>
                                <div className="flex-1 w-full" dir="ltr">
                                    {data.topCustomers && data.topCustomers.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.topCustomers} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563' }} width={70} />
                                                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f9fafb'}} />
                                                <Bar dataKey="total" name="المشتريات" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={14}>
                                                    {data.topCustomers.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
                                    )}
                                </div>
                            </div>
                            
                        </div>

                    </div>
                )}
            </div>
        </main>
    )
}
