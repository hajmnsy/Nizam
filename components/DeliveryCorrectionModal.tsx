'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    PackageCheck, Clock, CheckCircle, X, User, Truck,
    AlertCircle, Loader2, Layers, Check, RotateCcw
} from 'lucide-react'
import Button from '@/components/ui/Button'

interface ItemDeliveryState {
    id: number
    productId: number
    productName: string
    quantity: number
    deliveredQuantity: number
}

interface DeliveryCorrectionModalProps {
    isOpen: boolean
    onClose: () => void
    sale: {
        id: number
        invoiceNumber?: number | null
        customer: string
        deliveryStatus?: string | null
        deliveredAt?: string | null
        deliveredBy?: string | null
        deliveryNotes?: string | null
        total?: number
        items?: any[]
    } | null
    onSuccess: (updatedSale: any) => void
}

export default function DeliveryCorrectionModal({
    isOpen,
    onClose,
    sale,
    onSuccess
}: DeliveryCorrectionModalProps) {
    const [itemStates, setItemStates] = useState<ItemDeliveryState[]>([])
    const [deliveredBy, setDeliveredBy] = useState('')
    const [deliveryNotes, setDeliveryNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (sale) {
            setDeliveredBy(sale.deliveredBy || '')
            setDeliveryNotes(sale.deliveryNotes || '')
            setError('')

            const isFullyDelivered = sale.deliveryStatus === 'DELIVERED'

            if (Array.isArray(sale.items) && sale.items.length > 0) {
                setItemStates(sale.items.map((it: any) => {
                    const qty = parseInt(it.quantity) || 0
                    let delivered = it.deliveredQuantity !== undefined && it.deliveredQuantity !== null
                        ? parseInt(it.deliveredQuantity)
                        : (isFullyDelivered ? qty : 0)

                    // Ensure within bounds
                    delivered = Math.max(0, Math.min(qty, delivered))

                    return {
                        id: it.id,
                        productId: it.productId,
                        productName: it.product?.name || it.name || `صنف #${it.productId}`,
                        quantity: qty,
                        deliveredQuantity: delivered
                    }
                }))
            } else {
                setItemStates([])
            }
        }
    }, [sale])

    // Compute aggregate delivery summary
    const summary = useMemo(() => {
        const totalOrdered = itemStates.reduce((sum, it) => sum + it.quantity, 0)
        const totalDelivered = itemStates.reduce((sum, it) => sum + it.deliveredQuantity, 0)
        const totalRemaining = Math.max(0, totalOrdered - totalDelivered)

        let status: 'DELIVERED' | 'PARTIAL' | 'PENDING' = 'PENDING'
        if (totalDelivered === 0) {
            status = 'PENDING'
        } else if (totalDelivered >= totalOrdered && totalOrdered > 0) {
            status = 'DELIVERED'
        } else {
            status = 'PARTIAL'
        }

        return { totalOrdered, totalDelivered, totalRemaining, status }
    }, [itemStates])

    if (!isOpen || !sale) return null

    // Handler to update a single item's delivered quantity
    const handleItemQuantityChange = (itemId: number, val: number) => {
        setItemStates(prev => prev.map(item => {
            if (item.id === itemId) {
                const bounded = Math.max(0, Math.min(item.quantity, isNaN(val) ? 0 : val))
                return { ...item, deliveredQuantity: bounded }
            }
            return item
        }))
    }

    // Quick set all to fully delivered
    const handleDeliverAll = () => {
        setItemStates(prev => prev.map(it => ({ ...it, deliveredQuantity: it.quantity })))
    }

    // Quick reset all to pending (0 delivered)
    const handleResetAll = () => {
        setItemStates(prev => prev.map(it => ({ ...it, deliveredQuantity: 0 })))
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            const payload = {
                deliveryStatus: summary.status,
                deliveredBy: summary.status !== 'PENDING' ? deliveredBy : null,
                deliveryNotes: summary.status !== 'PENDING' ? deliveryNotes : null,
                deliveredAt: summary.status !== 'PENDING' ? new Date().toISOString() : null,
                items: itemStates.map(it => ({
                    id: it.id,
                    deliveredQuantity: it.deliveredQuantity
                }))
            }

            const res = await fetch(`/api/sales/${sale.id}/delivery`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (res.ok) {
                onSuccess(data.sale || {
                    ...sale,
                    deliveryStatus: summary.status,
                    deliveredBy,
                    deliveryNotes,
                    items: itemStates.map(it => ({ ...it, deliveredQuantity: it.deliveredQuantity }))
                })
                onClose()
            } else {
                setError(data.error || 'حدث خطأ أثناء تحديث حالة الاستلام')
            }
        } catch (e: any) {
            console.error('Error updating delivery status:', e)
            setError('تعذر الاتصال بالخادم. تأكد من اتصال الإنترنت.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up border border-slate-200">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                            <PackageCheck className="text-blue-600" size={22} />
                            تصحيح استلام البضاعة (تسليم كلي أو جزئي)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            فاتورة رقم <strong className="font-mono text-blue-700">#{sale.invoiceNumber || sale.id}</strong> — العميل: <span className="font-bold text-slate-800">{sale.customer}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content - Scrollable */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Overall Status Banner */}
                    <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        summary.status === 'DELIVERED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : summary.status === 'PARTIAL'
                            ? 'bg-blue-50 border-blue-200 text-blue-950'
                            : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            {summary.status === 'DELIVERED' && <CheckCircle size={22} className="text-emerald-600 shrink-0" />}
                            {summary.status === 'PARTIAL' && <Layers size={22} className="text-blue-600 shrink-0" />}
                            {summary.status === 'PENDING' && <Clock size={22} className="text-amber-600 shrink-0" />}
                            <div>
                                <div className="font-black text-sm">
                                    {summary.status === 'DELIVERED' && 'تم الاستلام والصرف بالكامل'}
                                    {summary.status === 'PARTIAL' && 'استلام جزئي (تم استلام جزء وباقي جزء بالمخزن)'}
                                    {summary.status === 'PENDING' && 'لم يأتِ صاحب البضاعة بعد (بانتظار الاستلام)'}
                                </div>
                                <div className="text-xs opacity-80 mt-0.5">
                                    المطلوب: <span className="font-bold font-mono">{summary.totalOrdered}</span> | 
                                    المستلم: <span className="font-bold font-mono text-emerald-700">{summary.totalDelivered}</span> | 
                                    المتبقي بالمخزن: <span className="font-bold font-mono text-amber-700">{summary.totalRemaining}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-2 self-stretch sm:self-auto">
                            <button
                                type="button"
                                onClick={handleDeliverAll}
                                className="flex-1 sm:flex-initial text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors"
                            >
                                <Check size={14} />
                                <span>صرف كل الأصناف</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="flex-1 sm:flex-initial text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                            >
                                <RotateCcw size={13} />
                                <span>تصفير (لم يستلم)</span>
                            </button>
                        </div>
                    </div>

                    {/* Items List with Quantity Corrections */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                <Layers size={14} className="text-blue-600" />
                                الأصناف والكميات المستلمة من العميل:
                            </h4>
                            <span className="text-[11px] text-slate-500 font-medium">
                                عدّل الكمية المستلمة لكل صنف بالأسفل 👇
                            </span>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
                            {itemStates.map((item, idx) => {
                                const remaining = Math.max(0, item.quantity - item.deliveredQuantity)
                                const isItemComplete = item.deliveredQuantity >= item.quantity
                                const isItemEmpty = item.deliveredQuantity === 0

                                return (
                                    <div key={item.id} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                                                    {item.productName}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                                    <span>إجمالي الفاتورة: <strong className="font-mono text-slate-800">{item.quantity}</strong> قطعة</span>
                                                    <span>•</span>
                                                    <span className={`font-bold ${
                                                        isItemComplete ? 'text-emerald-600' : isItemEmpty ? 'text-amber-600' : 'text-blue-600'
                                                    }`}>
                                                        {isItemComplete ? 'تم استلامه كاملاً' : isItemEmpty ? 'لم يُستلم منه شيء' : `متبقي ${remaining} قطعة`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Counter / Input Controls */}
                                        <div className="flex items-center gap-2 justify-end shrink-0">
                                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => handleItemQuantityChange(item.id, item.deliveredQuantity - 1)}
                                                    disabled={item.deliveredQuantity <= 0}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-base"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={item.quantity}
                                                    value={item.deliveredQuantity}
                                                    onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                                    className="w-16 h-8 text-center font-mono font-bold text-sm outline-none border-x border-slate-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleItemQuantityChange(item.id, item.deliveredQuantity + 1)}
                                                    disabled={item.deliveredQuantity >= item.quantity}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-base"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleItemQuantityChange(item.id, item.quantity)}
                                                className={`text-[10px] font-bold px-2 py-1.5 rounded border transition-colors ${
                                                    isItemComplete
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                                                }`}
                                                title="تسليم كامل الكمية لهذا الصنف"
                                            >
                                                الكل ({item.quantity})
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Driver & Delivery Notes (Active when any item delivered) */}
                    {summary.status !== 'PENDING' && (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                                    <User size={13} className="text-slate-500" />
                                    اسم المستلم أو السائق (اختياري):
                                </label>
                                <input
                                    type="text"
                                    value={deliveredBy}
                                    onChange={(e) => setDeliveredBy(e.target.value)}
                                    placeholder="مثال: العميل بنفسه / السائق محمد علي"
                                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                                    <Truck size={13} className="text-slate-500" />
                                    رقم العربة / لوحة الشاحنة وملاحظات التسليم الجزئي (اختياري):
                                </label>
                                <input
                                    type="text"
                                    value={deliveryNotes}
                                    onChange={(e) => setDeliveryNotes(e.target.value)}
                                    placeholder="مثال: استلم دفعة أولى بواسطة دفار 1482 وباقي 10 قطع بالمخزن"
                                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                    <div className="text-xs text-slate-500 font-bold">
                        الحالة الناتجة: <strong className={
                            summary.status === 'DELIVERED' ? 'text-emerald-700' : summary.status === 'PARTIAL' ? 'text-blue-700' : 'text-amber-700'
                        }>
                            {summary.status === 'DELIVERED' && 'تم التسليم بالكامل'}
                            {summary.status === 'PARTIAL' && 'استلام جزئي'}
                            {summary.status === 'PENDING' && 'قيد الانتظار'}
                        </strong>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={saving}
                            className="text-xs font-bold"
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className={`text-xs font-black flex items-center gap-1.5 px-5 ${
                                summary.status === 'DELIVERED'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : summary.status === 'PARTIAL'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            <span>{saving ? 'جاري الحفظ...' : 'حفظ وتحديث الاستلام'}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
