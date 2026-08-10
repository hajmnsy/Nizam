'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft, Search, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function NewSaleReturnContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialSaleId = searchParams.get('saleId') || ''

    const [searchQuery, setSearchQuery] = useState(initialSaleId)
    const [sale, setSale] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [reason, setReason] = useState('إرجاع بضاعة من الزبون')
    
    // Map of productId -> return quantity
    const [returnQtyMap, setReturnQtyMap] = useState<{ [productId: number]: number }>({})

    const fetchSale = async (query: string) => {
        if (!query.trim()) return
        setSearching(true)
        try {
            const res = await fetch(`/api/sales/${query.trim()}`, { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setSale(data)
                // Initialize default return quantities to 0
                const initialMap: { [key: number]: number } = {}
                data.items?.forEach((item: any) => {
                    initialMap[item.productId] = 0
                })
                setReturnQtyMap(initialMap)
            } else {
                alert('لم يتم العثور على الفاتورة. تأكد من إدخال رقم الفاتورة أو رقم الإذن الصحيح.')
                setSale(null)
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ أثناء البحث عن الفاتورة')
        } finally {
            setSearching(false)
        }
    }

    useEffect(() => {
        if (initialSaleId) {
            fetchSale(initialSaleId)
        }
    }, [initialSaleId])

    const handleQtyChange = (productId: number, maxQty: number, value: string) => {
        const qty = parseInt(value) || 0
        if (qty < 0) return
        if (qty > maxQty) {
            alert(`لا يمكن إرجاع كمية أكثر من الكمية المباعة الأصلية (${maxQty})`)
            return
        }
        setReturnQtyMap(prev => ({ ...prev, [productId]: qty }))
    }

    const totalRefund = sale?.items?.reduce((sum: number, item: any) => {
        const qty = returnQtyMap[item.productId] || 0
        return sum + (qty * item.price)
    }, 0) || 0

    const handleSubmitReturn = async () => {
        if (!sale) return
        
        const returnItems = sale.items
            .filter((item: any) => (returnQtyMap[item.productId] || 0) > 0)
            .map((item: any) => ({
                productId: item.productId,
                quantity: returnQtyMap[item.productId],
                unitPrice: item.price
            }))

        if (returnItems.length === 0) {
            return alert('الرجاء إدخال الكمية المراد إرجاعها لصنف واحد على الأقل.')
        }

        if (!confirm(`هل أنت متأكد من اعتماد راجع البضاعة بقيمة إجمالية (${totalRefund.toLocaleString()} ج.س)؟\n\nسيتم إرجاع البضاعة للمخزن وخصم المبلغ من يومية اليوم الحالية.`)) {
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/sales/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    saleId: sale.id,
                    reason,
                    items: returnItems
                })
            })

            if (res.ok) {
                alert('تم تسجيل راجع البضاعة بنجاح! تم إعادة البضاعة للمخزن وخصم المنصرف من يومية اليوم الحالية.')
                router.push('/sales/returns')
                router.refresh()
            } else {
                const err = await res.json()
                alert(`حدث خطأ: ${err.error || 'فشل تسجيل المرتجع'}`)
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال بالخادم')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />

            <div className="container mx-auto p-4 max-w-5xl flex-1">
                {/* Top Actions */}
                <div className="flex justify-between items-center mb-6">
                    <Link href="/sales/returns" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm">
                        <ArrowLeft size={16} />
                        سجل راجع البضاعة
                    </Link>
                    <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <RotateCcw className="text-amber-600" size={24} />
                        <span>إعـتـمـاد راجــع بــضــاعــة (مرتجع مبيعات)</span>
                    </h1>
                </div>

                {/* Search Box */}
                <Card className="p-6 mb-6 shadow-sm border border-slate-200 bg-white rounded-2xl">
                    <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                        <Search size={18} className="text-blue-600" />
                        <span>البحث عن الفاتورة أو إذن الاستلام المراد إرجاع بضاعته:</span>
                    </h2>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchSale(searchQuery)}
                            placeholder="أدخل رقم الإذن أو الفاتورة (مثلاً: 102)..."
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Button
                            onClick={() => fetchSale(searchQuery)}
                            disabled={searching}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl text-sm"
                        >
                            {searching ? 'جاري البحث...' : 'بحث عن الفاتورة'}
                        </Button>
                    </div>
                </Card>

                {/* Sale Details & Return Selection Form */}
                {sale && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Sale Info Summary */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-400 block">رقم الفاتورة / الإذن:</span>
                                <span className="text-base font-black text-slate-800 font-mono">#{sale.invoiceNumber || sale.id}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 block">اسم العميل:</span>
                                <span className="text-base font-black text-slate-800">{sale.customer || 'عميل نقدي'}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 block">تاريخ الإصدار الاصلي:</span>
                                <span className="text-base font-black text-slate-800">{new Date(sale.createdAt).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 block">فرع الفاتورة الأصلي:</span>
                                <span className="text-base font-black text-blue-600">{sale.branch?.name || '-'}</span>
                            </div>
                        </div>

                        {/* Return Items Table */}
                        <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center justify-between border-b pb-3">
                                <span>حدد الكمية الراجعة لكل صنف:</span>
                                <span className="text-xs font-bold text-slate-500">ملاحظة: البضاعة الراجعة ستُعاد للمخزن تلقائياً</span>
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-black">
                                            <th className="p-3">اسم المنتج / الصنف</th>
                                            <th className="p-3 text-center">السماكة</th>
                                            <th className="p-3 text-center">الكمية المشتراة</th>
                                            <th className="p-3 text-center">سعر الوحدة</th>
                                            <th className="p-3 text-center w-40">الكمية الراجعة (المرتجعة)</th>
                                            <th className="p-3 text-center">المبلغ المسترد للصنف</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {sale.items.map((item: any) => {
                                            const returnQty = returnQtyMap[item.productId] || 0
                                            const itemRefund = returnQty * item.price

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/80">
                                                    <td className="p-3 font-black text-slate-800">{item.product?.name}</td>
                                                    <td className="p-3 text-center font-bold text-slate-600 font-mono">{item.product?.thickness || '-'}</td>
                                                    <td className="p-3 text-center font-black text-slate-900 font-mono">{item.quantity}</td>
                                                    <td className="p-3 text-center font-bold text-slate-700 font-mono">{item.price.toLocaleString()} ج.س</td>
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity}
                                                            value={returnQty === 0 ? '' : returnQty}
                                                            onChange={(e) => handleQtyChange(item.productId, item.quantity, e.target.value)}
                                                            placeholder="0"
                                                            className="w-24 text-center py-1.5 bg-amber-50/80 border-2 border-amber-300 rounded-xl font-black text-amber-900 text-base focus:ring-2 focus:ring-amber-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center font-black text-emerald-600 font-mono text-base">
                                                        {itemRefund.toLocaleString()} ج.س
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Reason & Refund Summary Footer */}
                            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">سبب راجع البضاعة:</label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="مثال: تغيير مواصفات، بضاعة زائدة عن الحاجة..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800"
                                    />
                                </div>

                                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex flex-col items-end text-right">
                                    <span className="text-xs font-bold text-amber-900">إجمالي المبلغ المسترد للعميل:</span>
                                    <span className="text-3xl font-black text-amber-950 font-mono mt-1">
                                        {totalRefund.toLocaleString()} <span className="text-sm font-bold text-amber-800">جنية سوداني</span>
                                    </span>
                                    <span className="text-[11px] text-amber-800 font-bold mt-1">
                                        * سيتم تسليمه منصرفاً من خزينة اليوم الحالية ({new Date().toLocaleDateString('en-GB')})
                                    </span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={handleSubmitReturn}
                                    disabled={loading || totalRefund <= 0}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-3 rounded-xl text-base shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {loading ? 'جاري الاعتماد...' : 'اعتماد راجع البضاعة وخصم المنصرف من اليومية 🔄'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </main>
    )
}

export default function NewSaleReturn() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">جاري تحميل الصفحة...</div>}>
            <NewSaleReturnContent />
        </Suspense>
    )
}
