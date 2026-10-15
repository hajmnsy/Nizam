'use client'

import { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
    Package, CheckCircle, Clock, Search, Layers,
    RotateCcw, AlertTriangle, ArrowRight, User, Truck,
    Filter, RefreshCw, Eye, Check, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import DeliveryCorrectionModal from '@/components/DeliveryCorrectionModal'

interface Category {
    id: number
    name: string
}

interface Product {
    id: number
    name: string
    type?: string | null
    thickness?: number | null
    width?: number | null
    length?: number | null
    quantity: number
    availableQuantity?: number
    pendingQuantity?: number
    physicalQuantity?: number
    price: number
    categoryId: number
    category?: Category
}

interface SaleItem {
    id: number
    productId: number
    quantity: number
    deliveredQuantity?: number
    price: number
    product?: Product
}

interface SaleOrder {
    id: number
    invoiceNumber?: number | null
    customer: string
    createdAt: string
    status: string
    deliveryStatus?: string
    deliveredAt?: string
    deliveredBy?: string
    deliveryNotes?: string
    items: SaleItem[]
}

export default function WarehouseDashboard() {
    const [products, setProducts] = useState<Product[]>([])
    const [sales, setSales] = useState<SaleOrder[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // View Tabs: 'INVENTORY' (جرد المخزن والأرصدة) vs 'DELIVERIES' (طلبات التسليم)
    const [activeTab, setActiveTab] = useState<'INVENTORY' | 'DELIVERIES'>('INVENTORY')

    // Filters for Inventory Tab
    const [inventorySearch, setInventorySearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
    const [stockFilter, setStockFilter] = useState<'ALL' | 'PENDING_ONLY' | 'LOW_STOCK'>('ALL')

    // Filters for Deliveries Tab
    const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL'>('ALL')

    // Delivery Correction Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedSaleForDelivery, setSelectedSaleForDelivery] = useState<any | null>(null)

    const fetchData = async () => {
        setRefreshing(true)
        try {
            const [productsRes, categoriesRes, salesRes] = await Promise.all([
                fetch('/api/products', { cache: 'no-store' }),
                fetch('/api/categories', { cache: 'no-store' }),
                fetch('/api/sales?deliveryStatus=ALL', { cache: 'no-store' })
            ])

            const [productsData, categoriesData, salesData] = await Promise.all([
                productsRes.json(),
                categoriesRes.json(),
                salesRes.json()
            ])

            if (Array.isArray(productsData)) setProducts(productsData)
            if (Array.isArray(categoriesData)) setCategories(categoriesData)
            if (Array.isArray(salesData)) setSales(salesData)
        } catch (error) {
            console.error('Error fetching warehouse data:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // KPI Metrics
    const kpi = useMemo(() => {
        let totalPhysical = 0
        let totalPending = 0
        let totalAvailable = 0

        products.forEach(p => {
            const available = p.quantity || 0
            const pending = p.pendingQuantity || 0
            const physical = p.physicalQuantity ?? (available + pending)

            totalAvailable += available
            totalPending += pending
            totalPhysical += physical
        })

        // Deliveries counts
        const pendingSales = sales.filter(s => s.status !== 'QUOTATION' && (s.deliveryStatus === 'PENDING' || !s.deliveryStatus))
        const partialSales = sales.filter(s => s.status !== 'QUOTATION' && s.deliveryStatus === 'PARTIAL')
        const fullyDeliveredSales = sales.filter(s => s.status !== 'QUOTATION' && s.deliveryStatus === 'DELIVERED')

        // Today's delivered count
        const todayStr = new Date().toISOString().split('T')[0]
        const deliveredTodayCount = fullyDeliveredSales.filter(s => {
            if (!s.deliveredAt) return false
            return s.deliveredAt.startsWith(todayStr)
        }).length

        return {
            totalPhysical,
            totalPending,
            totalAvailable,
            pendingOrdersCount: pendingSales.length,
            partialOrdersCount: partialSales.length,
            deliveredTodayCount
        }
    }, [products, sales])

    // Filtered Products for Inventory Tab
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (selectedCategory !== 'ALL' && p.category?.name !== selectedCategory) {
                return false
            }

            if (stockFilter === 'PENDING_ONLY' && (!p.pendingQuantity || p.pendingQuantity <= 0)) {
                return false
            }

            if (stockFilter === 'LOW_STOCK' && p.quantity > 5) {
                return false
            }

            if (!inventorySearch.trim()) return true
            const terms = inventorySearch.toLowerCase().trim().split(/\s+/)
            const nameLower = (p.name || '').toLowerCase()
            const typeLower = (p.type || '').toLowerCase()
            const catLower = (p.category?.name || '').toLowerCase()
            const thickStr = p.thickness ? `${p.thickness}` : ''

            return terms.every(t =>
                nameLower.includes(t) ||
                typeLower.includes(t) ||
                catLower.includes(t) ||
                thickStr.includes(t)
            )
        })
    }, [products, selectedCategory, stockFilter, inventorySearch])

    // Filtered Delivery Orders for Deliveries Tab
    const pendingDeliveriesList = useMemo(() => {
        return sales.filter(s => {
            if (s.status === 'QUOTATION') return false
            if (deliveryStatusFilter === 'PENDING') {
                return s.deliveryStatus === 'PENDING' || !s.deliveryStatus
            }
            if (deliveryStatusFilter === 'PARTIAL') {
                return s.deliveryStatus === 'PARTIAL'
            }
            // ALL pending or partial
            return s.deliveryStatus === 'PENDING' || s.deliveryStatus === 'PARTIAL' || !s.deliveryStatus
        })
    }, [sales, deliveryStatusFilter])

    // Handler when delivery is updated from modal
    const handleDeliverySuccess = () => {
        fetchData()
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
            <Navbar />
            <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                            <Package className="text-blue-600" size={28} />
                            إدارة وعمليات المخزن (الأرصدة والتسليمات)
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            تتبع البضاعة الموجودة فعلياً بأرضية المخزن، البضاعة المباعة بانتظار استلام أصحابها، والرصيد المتاح للبيع.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            disabled={refreshing}
                            className="text-xs font-bold flex items-center gap-1.5"
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
                            <span>تحديث البيانات</span>
                        </Button>

                        <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-xs">
                            <CheckCircle size={15} className="text-emerald-700" />
                            <span>تسليمات اليوم: {kpi.deliveredTodayCount}</span>
                        </div>
                    </div>
                </div>

                {/* 4 Core Warehouse KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
                    {/* 1. Physical Stock on Floor */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/30 shadow-sm relative overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-800">الكمية الموجودة فعلياً بالمخزن</span>
                            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                                <Package size={18} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-2 font-mono">
                            {kpi.totalPhysical.toLocaleString()} <span className="text-xs font-bold font-sans text-emerald-600">قطعة</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700/80 mt-1 block">
                            المتواجدة حالياً على أرض الواقع
                        </span>
                    </div>

                    {/* 2. Sold but Pending Pickup */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-amber-500/30 shadow-sm relative overflow-hidden bg-gradient-to-br from-amber-50/50 to-white">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900">المباعة ولكن لم تُستلم بعد</span>
                            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                                <Clock size={18} className="animate-pulse" />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-amber-800 mt-2 font-mono">
                            {kpi.totalPending.toLocaleString()} <span className="text-xs font-bold font-sans text-amber-600">قطعة</span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-700/80 mt-1 block">
                            فواتير صادرة بانتظار حضور أصحابها
                        </span>
                    </div>

                    {/* 3. Available to Sell */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-blue-500/30 shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-white">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-900">الكمية المتاحة للبيع الجديد</span>
                            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                                <Check size={18} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-2 font-mono">
                            {kpi.totalAvailable.toLocaleString()} <span className="text-xs font-bold font-sans text-blue-600">قطعة</span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700/80 mt-1 block">
                            الرصيد الحر المتاح للبيع في النظام
                        </span>
                    </div>

                    {/* 4. Orders Pending Pickup */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">طلبات الصرف المعلقة</span>
                            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                                <Layers size={18} />
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
                            {kpi.pendingOrdersCount + kpi.partialOrdersCount} <span className="text-xs font-bold font-sans text-slate-400">طلب</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                            <span className="text-amber-700">{kpi.pendingOrdersCount} بانتظار كلي</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-blue-700">{kpi.partialOrdersCount} استلام جزئي</span>
                        </div>
                    </div>
                </div>

                {/* Main Tab Switcher */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('INVENTORY')}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'INVENTORY'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <Package size={17} />
                        <span>جرد وأرصدة المخزن (الموجود vs المباع vs المتاح)</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${activeTab === 'INVENTORY' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {products.length} صنف
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('DELIVERIES')}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'DELIVERIES'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <Clock size={17} />
                        <span>فواتير وأذونات الصرف بانتظار التسليم</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                            activeTab === 'DELIVERIES' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                        }`}>
                            {kpi.pendingOrdersCount + kpi.partialOrdersCount}
                        </span>
                    </button>
                </div>

                {/* TAB 1: INVENTORY BREAKDOWN (الموجود vs المباع غير المستلم vs المتاح) */}
                {activeTab === 'INVENTORY' && (
                    <div className="space-y-4">
                        {/* Search and Filter Controls */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    type="text"
                                    value={inventorySearch}
                                    onChange={(e) => setInventorySearch(e.target.value)}
                                    placeholder="بحث سريع باسم الصنف، النوع، السماكة..."
                                    className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold"
                                />
                                {inventorySearch && (
                                    <button
                                        onClick={() => setInventorySearch('')}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                    >
                                        مسح
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Category Dropdown */}
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                >
                                    <option value="ALL">جميع الفئات</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>

                                {/* Stock Filter Pill Buttons */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setStockFilter('ALL')}
                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                            stockFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        الكل
                                    </button>
                                    <button
                                        onClick={() => setStockFilter('PENDING_ONLY')}
                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                                            stockFilter === 'PENDING_ONLY' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <Clock size={12} />
                                        <span>الأصناف المحجوزة فقط</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Products Stock Table */}
                        <Card className="overflow-hidden border border-slate-200 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead className="bg-slate-100 text-slate-600 font-black text-xs border-b border-slate-200">
                                        <tr>
                                            <th className="p-3.5">اسم الصنف والوصف</th>
                                            <th className="p-3.5 hidden sm:table-cell">الفئة والنوع</th>
                                            <th className="p-3.5 text-center bg-emerald-100/60 text-emerald-900 border-x border-emerald-200">
                                                الموجود الفعلي في المخزن
                                                <span className="block text-[10px] font-normal text-emerald-700">(على أرض الواقع)</span>
                                            </th>
                                            <th className="p-3.5 text-center bg-amber-100/60 text-amber-900 border-x border-amber-200">
                                                المباع ولكن لم يُستلم بعد
                                                <span className="block text-[10px] font-normal text-amber-700">(محجوز للزبائن)</span>
                                            </th>
                                            <th className="p-3.5 text-center bg-blue-100/60 text-blue-900 border-x border-blue-200">
                                                المتاح للبيع الجديد
                                                <span className="block text-[10px] font-normal text-blue-700">(الرصيد الحر)</span>
                                            </th>
                                            <th className="p-3.5 text-center">حالة الصنف</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-500">
                                                    جاري تحميل أرصدة المخزن...
                                                </td>
                                            </tr>
                                        ) : filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-500">
                                                    لا توجد أصناف مطابقة للبحث أو الفلتر
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map(product => {
                                                const available = product.quantity || 0
                                                const pending = product.pendingQuantity || 0
                                                const physical = product.physicalQuantity ?? (available + pending)

                                                return (
                                                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="p-3.5 font-bold text-slate-900">
                                                            <div className="flex items-center gap-2">
                                                                <span>{product.name}</span>
                                                                {product.thickness && (
                                                                    <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                                                        {product.thickness}مم
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-3.5 hidden sm:table-cell text-slate-600">
                                                            {product.category?.name || '-'} {product.type ? `(${product.type})` : ''}
                                                        </td>

                                                        {/* 1. Physical on floor */}
                                                        <td className="p-3.5 text-center font-mono font-black text-sm bg-emerald-50/30 text-emerald-800 border-x border-emerald-100">
                                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900">
                                                                {physical} <span className="text-[10px] font-sans font-bold">قطعة</span>
                                                            </span>
                                                        </td>

                                                        {/* 2. Pending delivery */}
                                                        <td className="p-3.5 text-center font-mono font-black text-sm bg-amber-50/30 border-x border-amber-100">
                                                            {pending > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                                                                    <Clock size={12} className="text-amber-800" />
                                                                    <span>{pending}</span>
                                                                    <span className="text-[10px] font-sans font-bold">قطعة</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 font-mono">0</span>
                                                            )}
                                                        </td>

                                                        {/* 3. Available */}
                                                        <td className="p-3.5 text-center font-mono font-black text-sm bg-blue-50/30 text-blue-900 border-x border-blue-100">
                                                            <span className={`inline-block px-2.5 py-1 rounded-lg ${
                                                                available <= 0
                                                                    ? 'bg-rose-100 text-rose-800'
                                                                    : available < 10
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-blue-100 text-blue-900'
                                                            }`}>
                                                                {available} <span className="text-[10px] font-sans font-bold">قطعة</span>
                                                            </span>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="p-3.5 text-center">
                                                            {available <= 0 ? (
                                                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                                                    نفد من البيع
                                                                </span>
                                                            ) : pending > 0 ? (
                                                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                                    جزء محجوز
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                                    جاهز للبيع
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 2: DELIVERIES QUEUE (طلبات الصرف المعلقة والجزئية) */}
                {activeTab === 'DELIVERIES' && (
                    <div className="space-y-4">
                        {/* Sub-filter tabs */}
                        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-bold text-slate-500 ml-1">تصفية الطلبات:</span>
                            <button
                                onClick={() => setDeliveryStatusFilter('ALL')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                    deliveryStatusFilter === 'ALL'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                الكل ({pendingDeliveriesList.length})
                            </button>
                            <button
                                onClick={() => setDeliveryStatusFilter('PENDING')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 ${
                                    deliveryStatusFilter === 'PENDING'
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                                }`}
                            >
                                <Clock size={13} />
                                <span>لم يأتِ أصحابها بعد ({kpi.pendingOrdersCount})</span>
                            </button>
                            <button
                                onClick={() => setDeliveryStatusFilter('PARTIAL')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 ${
                                    deliveryStatusFilter === 'PARTIAL'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                                }`}
                            >
                                <Layers size={13} />
                                <span>استلام جزئي ({kpi.partialOrdersCount})</span>
                            </button>
                        </div>

                        {/* Deliveries Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {pendingDeliveriesList.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200 p-8">
                                    <CheckCircle size={48} className="mx-auto mb-3 text-emerald-500 opacity-80" />
                                    <p className="text-lg font-bold text-slate-700">لا توجد طلبات تسليم معلقة حالياً</p>
                                    <p className="text-xs text-slate-400 mt-1">تم تسليم وصرف كافة البضائع المباعة للعملاء بنجاح.</p>
                                </div>
                            ) : (
                                pendingDeliveriesList.map(order => {
                                    const isPartial = order.deliveryStatus === 'PARTIAL'
                                    const totalQty = (order.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)
                                    const deliveredQty = (order.items || []).reduce((sum, it) => sum + (it.deliveredQuantity || 0), 0)
                                    const remainingQty = Math.max(0, totalQty - deliveredQty)

                                    return (
                                        <Card key={order.id} className={`border-t-4 transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                                            isPartial ? 'border-t-blue-500' : 'border-t-amber-500'
                                        }`}>
                                            <div>
                                                {/* Card Header */}
                                                <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                                                    <div>
                                                        <h3 className="font-black text-base text-slate-900">
                                                            إذن صرف #{order.invoiceNumber || order.id}
                                                        </h3>
                                                        <p className="text-xs font-bold text-slate-600 mt-0.5 flex items-center gap-1">
                                                            <User size={13} className="text-slate-400" />
                                                            <span>{order.customer || 'عميل نقدي'}</span>
                                                        </p>
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                                        isPartial
                                                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                                                            : 'bg-amber-50 text-amber-900 border-amber-300'
                                                    }`}>
                                                        {isPartial ? 'استلام جزئي' : 'لم يأتِ صاحبه بعد'}
                                                    </span>
                                                </div>

                                                {/* Meta details */}
                                                <div className="text-xs text-slate-500 space-y-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl">
                                                    <div className="flex justify-between">
                                                        <span>تاريخ الفاتورة:</span>
                                                        <span className="font-mono font-bold text-slate-700">
                                                            {new Date(order.createdAt).toLocaleDateString('ar-SD')}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>حالة الكميات:</span>
                                                        <span className="font-bold">
                                                            إجمالي: <strong className="font-mono">{totalQty}</strong> | 
                                                            مستلم: <strong className="font-mono text-emerald-700">{deliveredQty}</strong> | 
                                                            متبقي: <strong className="font-mono text-amber-700">{remainingQty}</strong>
                                                        </span>
                                                    </div>
                                                    {order.deliveredBy && (
                                                        <div className="flex justify-between text-[11px] text-slate-700 border-t border-slate-200/60 pt-1">
                                                            <span>المستلم السابق:</span>
                                                            <span className="font-bold">{order.deliveredBy}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Items summary */}
                                                <div className="space-y-1.5 mb-4">
                                                    <div className="text-[11px] font-black text-slate-600">الأصناف المطلوبة للصرف:</div>
                                                    <div className="space-y-1 max-h-32 overflow-y-auto divide-y divide-slate-100">
                                                        {(order.items || []).map((item, idx) => {
                                                            const itemDelivered = item.deliveredQuantity || 0
                                                            const itemRemaining = Math.max(0, item.quantity - itemDelivered)
                                                            return (
                                                                <div key={idx} className="flex justify-between items-center text-xs py-1">
                                                                    <span className="font-medium text-slate-800">
                                                                        {item.product?.name || `صنف #${item.productId}`}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                                                        <span className="text-slate-500">{item.quantity} قطع</span>
                                                                        {itemDelivered > 0 && (
                                                                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                                                                                (مستلم {itemDelivered})
                                                                            </span>
                                                                        )}
                                                                        {itemRemaining > 0 && itemDelivered > 0 && (
                                                                            <span className="text-amber-700 font-bold bg-amber-50 px-1 rounded">
                                                                                (باقي {itemRemaining})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedSaleForDelivery(order)
                                                        setModalOpen(true)
                                                    }}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 flex items-center justify-center gap-1.5 shadow-xs"
                                                >
                                                    <Check size={14} />
                                                    <span>تسليم وصرف (كلي/جزئي)</span>
                                                </Button>

                                                <Link href={`/warehouse/${order.id}`}>
                                                    <Button variant="outline" size="sm" className="text-xs font-bold border-slate-300 text-slate-700 px-3 py-2">
                                                        <Eye size={14} />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Delivery Correction Modal */}
            <DeliveryCorrectionModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false)
                    setSelectedSaleForDelivery(null)
                }}
                sale={selectedSaleForDelivery}
                onSuccess={handleDeliverySuccess}
            />
        </main>
    )
}
