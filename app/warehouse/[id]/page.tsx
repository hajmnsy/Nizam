'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
    ArrowLeft, Check, Package as PackageIcon, Clock,
    CheckCircle, Layers, User, Truck, RotateCcw
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DeliveryCorrectionModal from '@/components/DeliveryCorrectionModal'

interface SaleItem {
    id: number
    productId: number
    product?: {
        name: string
        thickness?: number | null
    }
    quantity: number
    deliveredQuantity?: number
}

interface Sale {
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

export default function WarehouseOrderDetails() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<Sale | null>(null)
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)

    const fetchOrder = () => {
        fetch(`/api/sales/${params.id}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => setOrder(data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchOrder()
    }, [params.id])

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل بيانات الطلب...</div>
    if (!order) return <div className="p-8 text-center text-red-500 font-bold">الطلب غير موجود</div>

    const isFullyDelivered = order.deliveryStatus === 'DELIVERED'
    const isPartial = order.deliveryStatus === 'PARTIAL'

    const totalQty = (order.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)
    const deliveredQty = (order.items || []).reduce((sum, it) => sum + (it.deliveredQuantity || (isFullyDelivered ? it.quantity : 0)), 0)
    const remainingQty = Math.max(0, totalQty - deliveredQty)

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
            <Navbar />
            <div className="container mx-auto p-4 max-w-4xl">
                <div className="mb-6 flex justify-between items-center">
                    <Link href="/warehouse" className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-sm">
                        <ArrowLeft size={16} />
                        رجوع إلى إدارة المخزن
                    </Link>

                    <Link href={`/sales/${order.id}?mode=delivery`}>
                        <Button variant="outline" size="sm" className="text-xs font-bold">
                            🖨️ طباعة إذن استلام المخزن
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <Card className="shadow-sm border border-slate-200">
                            {/* Card Header */}
                            <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl font-black flex items-center gap-2">
                                        <PackageIcon className="text-blue-600" />
                                        تجهيز طلب #{order.invoiceNumber || order.id}
                                    </h1>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        تاريخ الفاتورة: {new Date(order.createdAt).toLocaleString('ar-SD')}
                                    </p>
                                </div>

                                <span className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                                    isFullyDelivered
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : isPartial
                                        ? 'bg-blue-50 text-blue-900 border-blue-300'
                                        : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}>
                                    {isFullyDelivered && <CheckCircle size={14} className="text-emerald-600" />}
                                    {isPartial && <Layers size={14} className="text-blue-600" />}
                                    {!isFullyDelivered && !isPartial && <Clock size={14} className="text-amber-600" />}
                                    <span>
                                        {isFullyDelivered ? 'تم التسليم والصرف بالكامل' : isPartial ? 'استلام جزئي' : 'بانتظار الاستلام'}
                                    </span>
                                </span>
                            </div>

                            {/* Customer Info Box */}
                            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-xs font-bold">العميل:</span>
                                    <span className="font-black text-sm text-slate-900">{order.customer || 'عميل نقدي'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold">الكميات الإجمالية:</span>
                                    <span className="font-bold">
                                        مطلوب: <strong className="font-mono">{totalQty}</strong> | 
                                        مستلم: <strong className="font-mono text-emerald-700">{deliveredQty}</strong> | 
                                        متبقي: <strong className="font-mono text-amber-700">{remainingQty}</strong>
                                    </span>
                                </div>
                                {order.deliveredBy && (
                                    <div className="flex justify-between items-center text-xs text-slate-700 pt-1 border-t border-slate-200">
                                        <span className="font-bold flex items-center gap-1">
                                            <User size={12} className="text-slate-400" />
                                            المستلم/السائق:
                                        </span>
                                        <span className="font-bold">{order.deliveredBy}</span>
                                    </div>
                                )}
                                {order.deliveryNotes && (
                                    <div className="flex justify-between items-center text-xs text-slate-700">
                                        <span className="font-bold flex items-center gap-1">
                                            <Truck size={12} className="text-slate-400" />
                                            ملاحظات التسليم/الشاحنة:
                                        </span>
                                        <span className="font-medium">{order.deliveryNotes}</span>
                                    </div>
                                )}
                            </div>

                            {/* Items List */}
                            <div>
                                <h3 className="font-black text-sm text-slate-800 mb-3 flex items-center gap-1.5">
                                    <Layers size={16} className="text-blue-600" />
                                    قائمة الأصناف للتجهيز والصرف:
                                </h3>
                                <div className="space-y-2.5">
                                    {order.items.map((item, idx) => {
                                        const itemDelivered = item.deliveredQuantity ?? (isFullyDelivered ? item.quantity : 0)
                                        const itemRemaining = Math.max(0, item.quantity - itemDelivered)
                                        const isComplete = itemDelivered >= item.quantity

                                        return (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 bg-white gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs font-mono shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-sm text-slate-900 block">
                                                            {item.product?.name || `صنف #${item.productId}`}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                            المطلوب بالفاتورة: <strong className="font-mono text-slate-700">{item.quantity}</strong> قطعة
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
                                                    <span className={`px-2 py-1 rounded-md font-bold ${
                                                        isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        المستلم: {itemDelivered}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-md font-bold ${
                                                        itemRemaining > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        المتبقي: {itemRemaining}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Actions Card */}
                    <div>
                        <Card className="sticky top-4 shadow-sm border border-slate-200">
                            <h2 className="font-black text-sm text-slate-900 mb-2">إجراءات التسليم والصرف</h2>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                يمكنك تأكيد تسليم كافة الأصناف، أو تصحيح الكميات المستلمة إذا استلم العميل جزءاً وبقي جزء بالمخزن.
                            </p>

                            <Button
                                onClick={() => setModalOpen(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 text-sm font-black shadow-md flex items-center justify-center gap-2 mb-2"
                            >
                                <Check size={18} />
                                <span>تسليم وتصحيح الأصناف (كلي/جزئي)</span>
                            </Button>

                            <p className="text-[11px] text-slate-400 text-center">
                                سيتم تحديث رصيد البضاعة المباعة والمتبقية بالمخزن فور الحفظ.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delivery Correction Modal */}
            <DeliveryCorrectionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                sale={order}
                onSuccess={(updated) => {
                    setOrder(updated)
                    setModalOpen(false)
                }}
            />
        </main>
    )
}
