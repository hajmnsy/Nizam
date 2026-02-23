'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
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
    ArrowDownRight
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

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
        <Card className="p-6 border-l-4 hover:shadow-lg transition-all" style={{ borderLeftColor: color }}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-full bg-opacity-10`} style={{ backgroundColor: color }}>
                    <Icon size={24} style={{ color: color }} />
                </div>
                {subValue && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${subValue > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {subValue > 0 ? '+' : ''}{subValue}%
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-slate-800">{loading ? '...' : value.toLocaleString()} <span className="text-xs text-gray-400">ج.س</span></p>
        </Card>
    )

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="container mx-auto p-6 max-w-7xl">
                {/* Welcome Section */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">لوحة التحكم</h1>
                        <p className="text-gray-500">ملخص الأداء اليوم {new Date().toLocaleDateString('ar-SD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <Link href="/sales/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg">
                            <Plus size={20} />
                            فاتورة جديدة
                        </Link>
                        <Link href="/expenses" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                            <ArrowDownRight size={20} className="text-red-500" />
                            صرف جديد
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="مبيعات اليوم"
                        value={data?.dailySales || 0}
                        icon={Activity}
                        color="#3b82f6"
                    />
                    <StatCard
                        title="مبيعات الشهر"
                        value={data?.monthlySales || 0}
                        icon={Calendar}
                        color="#8b5cf6"
                    />
                    <StatCard
                        title="مصروفات الشهر"
                        value={data?.monthlyExpenses || 0}
                        icon={TrendingDown}
                        color="#ef4444"
                    />
                    <StatCard
                        title="صافي الربح (شهري)"
                        value={data?.netProfit || 0}
                        icon={DollarSign}
                        color="#10b981"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Right Column: Recent Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <ShoppingCart size={20} className="text-blue-600" />
                                    أحدث العمليات
                                </h2>
                                <Link href="/sales" className="text-sm text-blue-600 hover:underline">عرض الكل</Link>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>)
                                ) : data?.recentSales.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">لا توجد عمليات بيع حديثة</p>
                                ) : (
                                    data?.recentSales.map((sale: any) => (
                                        <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group cursor-pointer border border-transparent hover:border-blue-100">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-white p-3 rounded-full shadow-sm text-blue-600 font-bold font-mono group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    #{sale.id}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{sale.customer || 'عميل نقدي'}</h4>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        {new Date(sale.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        {sale.items.length} منتجات
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-bold text-slate-800 text-lg">{sale.total.toLocaleString()}</span>
                                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">مدفوع</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Smart Alerts */}
                    <div className="space-y-6">
                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/inventory" className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all text-center group">
                                <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <Package size={24} />
                                </div>
                                <span className="font-bold text-slate-700">المخزون</span>
                            </Link>
                            <Link href="/reports" className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all text-center group">
                                <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="font-bold text-slate-700">التقارير</span>
                            </Link>
                        </div>

                        {/* Low Stock Alert */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-amber-500" />
                                تنبيهات المخزون
                            </h2>
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                                ) : data?.lowStockItems.length === 0 ? (
                                    <div className="text-center py-6 text-green-600 bg-green-50 rounded-xl">
                                        <p className="text-sm font-bold">المخزون بوضع جيد 👍</p>
                                    </div>
                                ) : (
                                    data?.lowStockItems.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 border-r-4 border-amber-400 bg-amber-50 rounded-r-none rounded-lg">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                                <p className="text-xs text-amber-700">متبقي: {item.quantity}</p>
                                            </div>
                                            <Link href={`/inventory?search=${item.name}`} className="text-xs bg-white border border-amber-200 text-amber-800 px-2 py-1 rounded hover:bg-amber-100">
                                                تحديث
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}
