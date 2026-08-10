'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Calendar as CalendarIcon, FileText, Printer, ArrowLeft, TrendingUp, HandCoins, AlertCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'

interface SaleItem {
    id: number
    quantity: number
    price: number
    product: {
        name: string
        type: string | null
        thickness: number | null
    }
}

interface Sale {
    id: number
    invoiceNumber?: number
    customer: string
    total: number
    discount?: number
    paidAmount?: number
    remainingAmount?: number
    paymentMethod?: string
    cashAmount?: number
    bankAmount?: number
    chequeAmount?: number
    status: string
    createdAt: string
    items: SaleItem[]
}

export default function DailyReport() {
    // Default to today in YYYY-MM-DD local format
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [startDate, setStartDate] = useState(getTodayLocal())
    const [endDate, setEndDate] = useState(getTodayLocal())
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [exchangeRate, setExchangeRate] = useState<number>(0)

    const fetchSales = (start: string, end: string) => {
        setLoading(true)
        fetch(`/api/sales?startDate=${start}&endDate=${end}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                // Ignore quotations
                const actualSales = data.filter((s: Sale) => s.status !== 'QUOTATION')
                setSales(actualSales)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchSales(startDate, endDate)
    }, [startDate, endDate])

    const [printAggregated, setPrintAggregated] = useState(true)
    const [printInvoices, setPrintInvoices] = useState(true)
    const [printItemized, setPrintItemized] = useState(true)
    const [printSummaryBoxes, setPrintSummaryBoxes] = useState(true)

    const handlePrint = () => {
        window.print()
    }

    // Calculations
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0)
    const totalPaid = sales.reduce((sum, s) => {
        if (s.status === 'PAID' && (s.paidAmount === null || s.paidAmount === undefined)) {
            return sum + s.total;
        }
        return sum + (s.paidAmount || 0);
    }, 0)
    const totalRemaining = sales.reduce((sum, s) => sum + (s.remainingAmount || 0), 0)

    // Detailed Treasury breakdown calculations
    const totalCashInSafe = sales.reduce((sum, s) => {
        if (s.cashAmount !== undefined && s.cashAmount !== null && s.cashAmount > 0) return sum + s.cashAmount;
        if (s.paymentMethod === 'BANK' || s.paymentMethod === 'CHEQUE') return sum;
        if (s.status === 'PAID' && (s.paidAmount === null || s.paidAmount === undefined)) return sum + s.total;
        return sum + (s.paidAmount || 0);
    }, 0)

    const totalBankTransfer = sales.reduce((sum, s) => {
        if (s.bankAmount !== undefined && s.bankAmount !== null && s.bankAmount > 0) return sum + s.bankAmount;
        if (s.paymentMethod === 'BANK') return sum + (s.paidAmount || (s.status === 'PAID' ? s.total : 0));
        return sum;
    }, 0)

    const totalCheques = sales.reduce((sum, s) => {
        if (s.chequeAmount !== undefined && s.chequeAmount !== null && s.chequeAmount > 0) return sum + s.chequeAmount;
        if (s.paymentMethod === 'CHEQUE') return sum + (s.paidAmount || (s.status === 'PAID' ? s.total : 0));
        return sum;
    }, 0)

    // Items aggregate
    const itemMap = new Map<string, { name: string, type: string | null, thickness: number | null, qty: number, totalVal: number }>()
    sales.forEach(s => {
        const subtotal = s.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const discountRatio = (s.discount || 0) > 0 && subtotal > 0 ? (s.discount || 0) / subtotal : 0

        s.items.forEach(item => {
            const key = `${item.product.name}-${item.product.type || 'none'}-${item.product.thickness || 'none'}`
            const existing = itemMap.get(key) || {
                name: item.product.name,
                type: item.product.type,
                thickness: item.product.thickness,
                qty: 0,
                totalVal: 0
            }
            
            const itemOriginalTotal = item.price * item.quantity
            const itemDiscountedTotal = itemOriginalTotal - (itemOriginalTotal * discountRatio)

            existing.qty += item.quantity
            existing.totalVal += itemDiscountedTotal
            itemMap.set(key, existing)
        })
    })

    const aggregatedItems = Array.from(itemMap.values()).sort((a, b) => b.totalVal - a.totalVal)

    return (
        <main className="min-h-screen bg-slate-50 print:bg-white print:min-h-0 print:m-0 print:p-0">
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="container mx-auto p-4 max-w-5xl print:max-w-none print:w-full print:p-0">
                {/* Header Actions - hidden in print */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link href="/sales" className="text-gray-500 hover:text-blue-600 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded text-sm font-bold">
                            <ArrowLeft size={16} />
                            العودة للمبيعات
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-blue-500" />
                                تقرير اليومية
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                تقرير ملخص المبيعات والتحصيلات لحركة يوم محدد
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 items-end">
                        <div className="flex items-center gap-3">
                            <div className="flex bg-white rounded-lg border shadow-sm overflow-hidden text-sm">
                                <div className="flex items-center gap-2 border-l px-3 py-2 bg-gray-50 border-gray-200">
                                    <span className="font-bold text-gray-600">من</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent border-none outline-none font-bold text-slate-700 w-32"
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <span className="font-bold text-gray-600">إلى</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent border-none outline-none font-bold text-slate-700 w-32"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm w-40">
                                <DollarSign size={18} className="text-emerald-500" />
                                <input
                                    type="number"
                                    placeholder="سعر الصرف"
                                    value={exchangeRate || ''}
                                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                                    className="bg-transparent border-none outline-none font-bold text-emerald-700 w-full"
                                />
                            </div>
                            <Button onClick={handlePrint} className="flex items-center gap-2 shadow-sm font-bold">
                                <Printer size={18} />
                                طباعة التقرير
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Print Options */}
                <div className="bg-white border rounded-lg p-3 mb-6 flex flex-wrap gap-6 print:hidden items-center shadow-sm">
                    <span className="font-bold text-slate-600 text-sm">تضمين في الطباعة:</span>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                        <input type="checkbox" checked={printSummaryBoxes} onChange={e => setPrintSummaryBoxes(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        الإجمالي والتحصيل
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                        <input type="checkbox" checked={printAggregated} onChange={e => setPrintAggregated(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        ملخص الأصناف
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                        <input type="checkbox" checked={printInvoices} onChange={e => setPrintInvoices(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        سجل الفواتير
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                        <input type="checkbox" checked={printItemized} onChange={e => setPrintItemized(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        تفاصيل الأصناف الفردية
                    </label>
                </div>

                {/* Printable Report Area */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:border-none print:shadow-none print:p-0">

                    {/* Report Header for Print */}
                    <div className="hidden print:block text-center border-b-2 border-slate-300 pb-4 mb-6">
                        <h2 className="text-3xl font-black text-slate-800 mb-2">تقرير اليومية</h2>
                        <p className="text-lg font-bold text-slate-600">
                            الفترة: من {new Date(startDate).toLocaleDateString('ar-EG')} إلى {new Date(endDate).toLocaleDateString('ar-EG')}
                        </p>
                    </div>

                    <div className="print:hidden mb-6 flex items-center justify-between border-b pb-4">
                        <h2 className="text-xl font-black text-slate-800">
                            الفترة: {startDate === endDate ? new Date(startDate).toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : `من ${new Date(startDate).toLocaleDateString('ar-EG')} إلى ${new Date(endDate).toLocaleDateString('ar-EG')}`}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center text-gray-500 text-lg font-bold">جاري تحميل البيانات...</div>
                    ) : sales.length === 0 ? (
                        <div className="py-20 text-center text-gray-500 text-lg flex flex-col items-center gap-3">
                            <AlertCircle size={48} className="text-gray-300" />
                            لا توجد أي مبيعات أو حركات مسجلة في هذا اليوم.
                        </div>
                    ) : (
                        <>
                            {/* Key Metrics & Treasury Breakdown */}
                            <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 mt-2 ${!printSummaryBoxes ? 'print:hidden' : ''}`}>
                                <div className="bg-emerald-50 border border-emerald-200/80 p-5 rounded-2xl print:border-slate-300 print:bg-transparent shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <HandCoins className="text-emerald-600" size={20} />
                                        <h3 className="font-bold text-xs text-slate-700 print:text-black">💵 الخزنة النقدية (كاش)</h3>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-700 print:text-black font-mono">{totalCashInSafe.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">ج.س</span></p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200/80 p-5 rounded-2xl print:border-slate-300 print:bg-transparent shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="text-blue-600" size={20} />
                                        <h3 className="font-bold text-xs text-slate-700 print:text-black">🏦 الرصيد البنكي (تحاويل)</h3>
                                    </div>
                                    <p className="text-2xl font-black text-blue-700 print:text-black font-mono">{totalBankTransfer.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">ج.س</span></p>
                                </div>

                                <div className="bg-purple-50 border border-purple-200/80 p-5 rounded-2xl print:border-slate-300 print:bg-transparent shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="text-purple-600" size={20} />
                                        <h3 className="font-bold text-xs text-slate-700 print:text-black">📑 رصيد الشيكات</h3>
                                    </div>
                                    <p className="text-2xl font-black text-purple-700 print:text-black font-mono">{totalCheques.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">ج.س</span></p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl print:border-slate-300 print:bg-transparent shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="text-slate-600" size={20} />
                                        <h3 className="font-bold text-xs text-slate-700 print:text-black">📈 إجمالي المبيعات</h3>
                                    </div>
                                    <p className="text-2xl font-black text-slate-800 print:text-black font-mono">{totalSales.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">ج.س</span></p>
                                </div>

                                <div className="bg-amber-50 border border-amber-200/80 p-5 rounded-2xl print:border-slate-300 print:bg-transparent shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="text-amber-600" size={20} />
                                        <h3 className="font-bold text-xs text-slate-700 print:text-black">⏳ مبيعات آجلة (متبقي)</h3>
                                    </div>
                                    <p className="text-2xl font-black text-amber-700 print:text-black font-mono">{totalRemaining.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">ج.س</span></p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-10">
                                {/* Aggregated Items Table */}
                                <div className={!printAggregated ? 'print:hidden' : ''}>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">ملخص الأصناف المباعة</h3>
                                    <table className="w-full text-right border-collapse text-sm">
                                        <thead className="bg-slate-100 print:bg-slate-50">
                                            <tr>
                                                <th className="p-3 border-b-2 border-slate-200 text-center text-slate-400 w-12">#</th>
                                                <th className="p-3 border-b-2 border-slate-200">الصنف</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-center">النوع</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-center">السماكة</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-center">الكمية المباعة</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-center">متوسط السعر (ج.س)</th>
                                                {exchangeRate > 0 && <th className="p-3 border-b-2 border-slate-200 text-center text-teal-700">متوسط سعر الحبة ($)</th>}
                                                <th className="p-3 border-b-2 border-slate-200 text-left">إجمالي (ج.س)</th>
                                                {exchangeRate > 0 && <th className="p-3 border-b-2 border-slate-200 text-left text-emerald-700">إجمالي ($)</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aggregatedItems.map((item, i) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    <td className="p-3 text-center text-slate-400 font-mono text-xs border-l border-slate-50 print:border-none">{i + 1}</td>
                                                    <td className="p-3 font-bold text-slate-700">{item.name}</td>
                                                    <td className="p-3 text-center text-slate-500">{item.type || '-'}</td>
                                                    <td className="p-3 text-center text-slate-500 text-xs" dir="ltr">{item.thickness ? `${item.thickness} mm` : '-'}</td>
                                                    <td className="p-3 text-center font-mono text-slate-600 bg-slate-50 print:bg-transparent">{item.qty}</td>
                                                    <td className="p-3 text-center font-mono font-bold text-slate-700">
                                                        {(item.totalVal / item.qty).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                    </td>
                                                    {exchangeRate > 0 && (
                                                        <td className="p-3 text-center font-mono font-bold text-teal-700 bg-teal-50/30 print:bg-transparent">
                                                            {((item.totalVal / item.qty) / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    )}
                                                    <td className="p-3 text-left font-mono font-bold text-slate-800">{item.totalVal.toLocaleString()}</td>
                                                    {exchangeRate > 0 && (
                                                        <td className="p-3 text-left font-mono font-bold text-emerald-700 bg-emerald-50/30 print:bg-transparent">
                                                            {(item.totalVal / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50 print:bg-transparent font-black">
                                                <td className="p-3 text-left" colSpan={4}>الإجمالي</td>
                                                <td className="p-3 text-center font-mono text-blue-600">{aggregatedItems.reduce((sum, item) => sum + item.qty, 0)}</td>
                                                <td className="p-3"></td>
                                                {exchangeRate > 0 && <td className="p-3"></td>}
                                                <td className="p-3 text-left font-mono text-blue-600">{totalSales.toLocaleString()}</td>
                                                {exchangeRate > 0 && (
                                                    <td className="p-3 text-left font-mono text-emerald-700">
                                                        {(totalSales / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                )}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Invoices List */}
                                <div className={!printInvoices ? 'print:hidden' : ''}>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">سجل الفواتير ({sales.length})</h3>
                                    <table className="w-full text-right border-collapse text-sm">
                                        <thead className="bg-slate-100 print:bg-slate-50">
                                            <tr>
                                                <th className="p-3 border-b-2 border-slate-200">رقم</th>
                                                <th className="p-3 border-b-2 border-slate-200">وسيلة الدفع</th>
                                                <th className="p-3 border-b-2 border-slate-200">الحالة</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-left">تاريخ / وقت</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-left">قيمة الفاتورة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map(s => (
                                                <tr key={s.id} className="border-b border-slate-100">
                                                    <td className="p-3 font-mono font-bold text-slate-700">#{s.invoiceNumber || s.id}</td>
                                                    <td className="p-3">
                                                        {s.paymentMethod === 'BANK' ? (
                                                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold border border-blue-200">🏦 بنك</span>
                                                        ) : s.paymentMethod === 'CHEQUE' ? (
                                                            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs font-bold border border-purple-200">📑 شيك</span>
                                                        ) : s.paymentMethod === 'MULTIPLE' ? (
                                                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-200" title={`كاش: ${s.cashAmount || 0} | بنك: ${s.bankAmount || 0} | شيك: ${s.chequeAmount || 0}`}>
                                                                🔀 مجزأ (كاش:{s.cashAmount || 0} / بنك:{s.bankAmount || 0} / شيك:{s.chequeAmount || 0})
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">💵 كاش</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        {s.status === 'PAID' ? (
                                                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100">مسددة</span>
                                                        ) : (
                                                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-100">آجلة</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-left font-mono text-slate-500 text-xs">
                                                        {new Date(s.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="p-3 text-left font-mono font-bold text-slate-800">
                                                        {s.total.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Detailed Individual Items Table */}
                            <div className={`mt-8 break-before-page print:mt-12 ${!printItemized ? 'print:hidden' : ''}`}>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">تفاصيل مبيعات الأصناف (مفصل بالفاتورة)</h3>
                                <table className="w-full text-right border-collapse text-sm">
                                    <thead className="bg-slate-100 print:bg-slate-50">
                                        <tr>
                                            <th className="p-3 border-b-2 border-slate-200">رقم الفاتورة</th>
                                            <th className="p-3 border-b-2 border-slate-200">الوقت</th>
                                            <th className="p-3 border-b-2 border-slate-200">المنتج</th>
                                            <th className="p-3 border-b-2 border-slate-200 text-center">النوع</th>
                                            <th className="p-3 border-b-2 border-slate-200 text-center">السماكة</th>
                                            <th className="p-3 border-b-2 border-slate-200 text-center">الكمية</th>
                                            <th className="p-3 border-b-2 border-slate-200 text-center">سعر الوحدة (ج.س)</th>
                                            {exchangeRate > 0 && <th className="p-3 border-b-2 border-slate-200 text-center text-teal-700">سعر الوحدة ($)</th>}
                                            <th className="p-3 border-b-2 border-slate-200 text-left">إجمالي (ج.س)</th>
                                            {exchangeRate > 0 && <th className="p-3 border-b-2 border-slate-200 text-left text-emerald-700">إجمالي ($)</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sales.flatMap(sale => {
                                            const subtotal = sale.items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
                                            const discountRatio = (sale.discount || 0) > 0 && subtotal > 0 ? (sale.discount || 0) / subtotal : 0

                                            return sale.items.map((item, idx) => {
                                                const itemOriginalTotal = item.price * item.quantity
                                                const itemEffectiveTotal = itemOriginalTotal - (itemOriginalTotal * discountRatio)
                                                const effectivePrice = itemEffectiveTotal / item.quantity

                                                return (
                                                    <tr key={`${sale.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-3 font-mono font-bold text-slate-700">#{sale.invoiceNumber || sale.id}</td>
                                                        <td className="p-3 font-mono text-slate-500 text-xs text-right">
                                                            {new Date(sale.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="p-3 font-bold text-slate-700">{item.product.name}</td>
                                                        <td className="p-3 text-center text-slate-500">{item.product.type || '-'}</td>
                                                        <td className="p-3 text-center text-slate-500 text-xs" dir="ltr">{item.product.thickness ? `${item.product.thickness} mm` : '-'}</td>
                                                        <td className="p-3 text-center font-mono text-blue-600 font-bold bg-blue-50/50 print:bg-transparent">{item.quantity}</td>
                                                        <td className="p-3 text-center font-mono font-bold text-slate-700">
                                                            {effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                        </td>
                                                        {exchangeRate > 0 && (
                                                            <td className="p-3 text-center font-mono font-bold text-teal-700 bg-teal-50/30 print:bg-transparent">
                                                                {(effectivePrice / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                        )}
                                                        <td className="p-3 text-left font-mono font-bold text-slate-800">
                                                            {itemEffectiveTotal.toLocaleString()}
                                                        </td>
                                                        {exchangeRate > 0 && (
                                                            <td className="p-3 text-left font-mono font-bold text-emerald-700 bg-emerald-50/30 print:bg-transparent">
                                                                {(itemEffectiveTotal / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            })
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </main >
    )
}
