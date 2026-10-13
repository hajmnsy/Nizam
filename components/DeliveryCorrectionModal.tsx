'use client'

import { useState, useEffect } from 'react'
import { PackageCheck, Clock, CheckCircle, X, User, Truck, FileText, AlertCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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
    const [status, setStatus] = useState<'DELIVERED' | 'PENDING'>('DELIVERED')
    const [deliveredBy, setDeliveredBy] = useState('')
    const [deliveryNotes, setDeliveryNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (sale) {
            setStatus(sale.deliveryStatus === 'DELIVERED' ? 'DELIVERED' : 'PENDING')
            setDeliveredBy(sale.deliveredBy || '')
            setDeliveryNotes(sale.deliveryNotes || '')
            setError('')
        }
    }, [sale])

    if (!isOpen || !sale) return null

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            const res = await fetch(`/api/sales/${sale.id}/delivery`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deliveryStatus: status,
                    deliveredBy: status === 'DELIVERED' ? deliveredBy : null,
                    deliveryNotes: status === 'DELIVERED' ? deliveryNotes : null,
                    deliveredAt: status === 'DELIVERED' ? new Date().toISOString() : null
                })
            })

            const data = await res.json()
            if (res.ok) {
                onSuccess(data.sale || { ...sale, deliveryStatus: status, deliveredBy, deliveryNotes })
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-slide-up border border-slate-200">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                            <PackageCheck className="text-blue-600" size={22} />
                            تصحيح وتحديث حالة استلام البضاعة
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            فاتورة رقم <strong className="font-mono text-blue-700">#{sale.invoiceNumber || sale.id}</strong> — العميل: <span className="font-bold text-slate-800">{sale.customer}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Status Toggle Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            اختر حالة استلام البضاعة الفعلية:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setStatus('DELIVERED')}
                                className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                                    status === 'DELIVERED'
                                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <CheckCircle size={24} className={status === 'DELIVERED' ? 'text-emerald-600' : 'text-slate-400'} />
                                <span className="font-black text-xs sm:text-sm">تم الاستلام والصرف</span>
                                <span className="text-[10px] text-slate-500 text-center">حضر المستلم واستلم البضاعة كاملة</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatus('PENDING')}
                                className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                                    status === 'PENDING'
                                        ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-sm'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Clock size={24} className={status === 'PENDING' ? 'text-amber-600' : 'text-slate-400'} />
                                <span className="font-black text-xs sm:text-sm">بانتظار الاستلام</span>
                                <span className="text-[10px] text-slate-500 text-center">لم يأتِ صاحب البضاعة بعد</span>
                            </button>
                        </div>
                    </div>

                    {/* Additional Details for Delivered Status */}
                    {status === 'DELIVERED' ? (
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
                                    placeholder="مثال: استلم العميل بنفسه / السائق محمد علي"
                                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                                    <Truck size={13} className="text-slate-500" />
                                    رقم العربة / لوحة الشاحنة / ملاحظات الصرف (اختياري):
                                </label>
                                <input
                                    type="text"
                                    value={deliveryNotes}
                                    onChange={(e) => setDeliveryNotes(e.target.value)}
                                    placeholder="مثال: دفار شاسي 1482 / أو رقم الهاتف"
                                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-medium">
                            💡 <strong>ملاحظة:</strong> سيتم تسجيل هذا الإيصال كبضاعة <strong>بانتظار الاستلام</strong>، وسيظهر في قائمة الفواتير المعلقة حتى يحضر العميل ويتم تأكيد صرفها.
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
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
                            status === 'DELIVERED'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        <span>{saving ? 'جاري الحفظ...' : status === 'DELIVERED' ? 'تأكيد وحفظ الاستلام' : 'تصحيح إلى قيد الانتظار'}</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
