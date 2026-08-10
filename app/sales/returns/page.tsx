'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { RotateCcw, Plus, Calendar, Search, FileText } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function SalesReturnsList() {
    const [returns, setReturns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetch('/api/sales/returns', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setReturns(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const filteredReturns = returns.filter(r => 
        (r.sale?.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.sale?.invoiceNumber?.toString() || '').includes(searchTerm) ||
        (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalReturnsAmount = filteredReturns.reduce((sum, r) => sum + (r.totalRefund || 0), 0)

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />

            <div className="container mx-auto p-4 max-w-7xl flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <RotateCcw className="text-amber-600" size={28} />
                            <span>سجل راجع البضاعة (مرتجعات المبيعات)</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-bold mt-1">
                            سجل عمليات إرجاع البضاعة واسترداد الأموال المخصومة من يوميات العمل.
                        </p>
                    </div>

                    <Link href="/sales/returns/new">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-md">
                            <Plus size={18} />
                            <span>تسجيل راجع بضاعة جديد</span>
                        </Button>
                    </Link>
                </div>

                {/* KPI Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-5 bg-amber-500/10 border border-amber-200 rounded-2xl">
                        <span className="text-xs font-bold text-amber-900 block">إجمالي مبالغ راجع البضاعة المسجلة:</span>
                        <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">
                            {totalReturnsAmount.toLocaleString()} <span className="text-xs font-bold text-amber-800">ج.س</span>
                        </span>
                    </Card>
                    <Card className="p-5 bg-white border border-slate-200 rounded-2xl">
                        <span className="text-xs font-bold text-slate-400 block">عدد عمليات راجع البضاعة:</span>
                        <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">
                            {filteredReturns.length} <span className="text-xs font-bold text-slate-500">عملية</span>
                        </span>
                    </Card>
                </div>

                {/* Search Input */}
                <Card className="p-4 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث باسم العميل، رقم الفاتورة، أو سبب المرتجع..."
                            className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </Card>

                {/* Returns Table */}
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 font-bold">جاري تحميل سجل المرتجعات...</div>
                    ) : filteredReturns.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold">لا يوجد سجل راجع بضاعة مسجل حالياً.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-black">
                                        <th className="p-4">تاريخ المرتجع</th>
                                        <th className="p-4">رقم الفاتورة الأصلية</th>
                                        <th className="p-4">اسم العميل</th>
                                        <th className="p-4">سبب راجع البضاعة</th>
                                        <th className="p-4 text-center">الأصناف المرتجعة</th>
                                        <th className="p-4 text-center">المبلغ المسترد (المنصرف)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                                    {filteredReturns.map(ret => (
                                        <tr key={ret.id} className="hover:bg-slate-50/80">
                                            <td className="p-4 text-slate-600 font-mono">
                                                {new Date(ret.createdAt).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="p-4 font-mono font-black text-blue-600">
                                                <Link href={`/sales/${ret.saleId}`} className="hover:underline">
                                                    #{ret.sale?.invoiceNumber || ret.saleId}
                                                </Link>
                                            </td>
                                            <td className="p-4 font-black text-slate-900">{ret.sale?.customer || 'عميل نقدي'}</td>
                                            <td className="p-4 text-slate-600">{ret.reason || 'إرجاع بضاعة'}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col gap-1 items-center">
                                                    {ret.items?.map((item: any) => (
                                                        <span key={item.id} className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                                                            {item.product?.name} ({item.quantity} قطعة)
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-black text-amber-700 font-mono text-sm">
                                                {ret.totalRefund.toLocaleString()} ج.س
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </main>
    )
}
