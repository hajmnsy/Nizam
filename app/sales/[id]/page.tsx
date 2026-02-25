'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, Clock, Printer, Edit, CheckCircle, Phone, AlertCircle, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

function numberToArabicWords(number: number): string {
    const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

    if (number === 0) return 'صفر';
    if (number < 10) return units[number];
    if (number < 20) return teens[number - 10];
    if (number < 100) return units[number % 10] ? `${units[number % 10]} و${tens[Math.floor(number / 10)]}` : tens[Math.floor(number / 10)];
    if (number < 1000) {
        const h = Math.floor(number / 100);
        const rem = number % 100;
        return rem ? `${hundreds[h]} و${numberToArabicWords(rem)}` : hundreds[h];
    }
    if (number < 100000) {
        const th = Math.floor(number / 1000);
        const rem = number % 1000;
        let thText = '';
        if (th === 1) thText = 'ألف';
        else if (th === 2) thText = 'ألفان';
        else if (th < 10) thText = `${numberToArabicWords(th)} آلاف`;
        else thText = `${numberToArabicWords(th)} ألف`;
        return rem ? `${thText} و${numberToArabicWords(rem)}` : thText;
    }
    return number.toString();
}

interface SaleItem {
    id: number
    quantity: number
    price: number
    product: {
        name: string
        type?: string
        thickness?: number
        price?: number
    }
}

interface Sale {
    id: number
    customer: string
    total: number
    discount: number
    paidAmount?: number
    remainingAmount?: number
    createdAt: string
    status: string
    items: SaleItem[]
}

export default function InvoiceDetails() {
    const params = useParams()
    const router = useRouter()
    const [sale, setSale] = useState<Sale | null>(null)
    const [settings, setSettings] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [converting, setConverting] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paying, setPaying] = useState(false)
    const componentRef = useRef(null)

    const handlePrint = () => {
        window.print()
    }

    useEffect(() => {
        // Fetch both sale and settings concurrently
        Promise.all([
            fetch(`/api/sales/${params.id}`).then(res => res.json()),
            fetch('/api/settings').then(res => res.json())
        ])
            .then(([saleData, settingsData]) => {
                setSale(saleData)
                setSettings(settingsData)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [params.id])

    const handleConvertToSale = async () => {
        if (!confirm('هل أنت متأكد من تحويل عرض السعر إلى فاتورة بيع؟ سيتم خصم الكميات من المخزون.')) return

        setConverting(true)
        try {
            const res = await fetch(`/api/sales/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID' })
            })

            if (res.ok) {
                alert('تم التحويل بنجاح!')
                window.location.reload()
            } else {
                alert('فشل التحويل. تحقق من توفر المخزون.')
            }
        } catch (error) {
            alert('حدث خطأ أثناء التحويل')
        } finally {
            setConverting(false)
        }
    }

    const handlePayment = async () => {
        const amount = parseFloat(paymentAmount)
        if (isNaN(amount) || amount <= 0) return alert('الرجاء إدخال مبلغ صحيح')
        if (sale && sale.remainingAmount !== undefined && amount > sale.remainingAmount) {
            return alert('المبلغ أكبر من المتبقي!')
        }

        setPaying(true)
        try {
            const res = await fetch(`/api/sales/${sale!.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            })
            if (res.ok) {
                alert('تم تسجيل الدفعة بنجاح')
                setShowPaymentModal(false)
                setPaymentAmount('')
                window.location.reload()
            } else {
                const data = await res.json()
                alert(`خطأ: ${data.error}`)
            }
        } catch (error) {
            alert('حدث خطأ في الاتصال')
        } finally {
            setPaying(false)
        }
    }

    const [deleting, setDeleting] = useState(false)
    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟ سيتم استرجاع الكميات المباعة إلى المخزون. هذا الإجراء لا يمكن التراجع عنه.')) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/sales/${sale!.id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                alert('تم حذف الفاتورة بنجاح واسترجاع الكميات للمخزون.')
                router.push('/sales')
            } else {
                const data = await res.json()
                alert(`خطأ: ${data.error}`)
            }
        } catch (error) {
            alert('حدث خطأ أثناء الاتصال بالخادم')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
    if (!sale) return <div className="p-8 text-center text-red-500">الفاتورة غير موجودة</div>

    const isQuotation = sale.status === 'QUOTATION'
    const vatAmount = settings?.vatRate ? (sale.total * settings.vatRate) / 100 : 0
    const finalTotalWithVat = sale.total + vatAmount

    return (
        <main className="min-h-screen bg-slate-50 print:bg-white print:min-h-0 print:m-0 print:p-0">
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="container mx-auto p-4 max-w-4xl print:max-w-none print:w-full print:p-0">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <Link href="/sales" className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
                        <ArrowLeft size={16} />
                        رجوع
                    </Link>
                    <div className="flex gap-2">
                        {isQuotation && (
                            <Button
                                onClick={handleConvertToSale}
                                disabled={converting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                            >
                                {converting ? 'جاري التحويل...' : 'تحويل إلى فاتورة واعتماد'}
                            </Button>
                        )}
                        <Link href={`/sales/${sale.id}/edit`}>
                            <Button variant="outline" className="flex items-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
                                <Edit size={16} />
                                تعديل الفاتورة
                            </Button>
                        </Link>
                        <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            variant="outline"
                            className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                        >
                            <Trash2 size={16} />
                            {deleting ? 'جاري الحذف...' : 'حذف الفاتورة'}
                        </Button>
                        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                            <Printer size={16} />
                            طباعة
                        </Button>
                    </div>
                </div>

                {isQuotation && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-2 print:hidden">
                        <Clock size={20} />
                        <span className="font-bold">هذا "عرض سعر" (مسودة).</span>
                        <span className="text-sm">لم يتم خصم الكميات من المخزون بعد.</span>
                    </div>
                )}

                {sale.status === 'CREDIT' && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between print:hidden">
                        <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-2"><AlertCircle size={20} /> فاتورة غير مسددة بالكامل (آجلة)</span>
                            <span className="text-sm mt-1">
                                إجمالي الفاتورة: {sale.total.toLocaleString()} جنية | المدفوع: {(sale.paidAmount || 0).toLocaleString()} جنية | المتبقي: {(sale.remainingAmount || 0).toLocaleString()} جنية
                            </span>
                        </div>
                        <Button onClick={() => setShowPaymentModal(true)} className="bg-red-600 hover:bg-red-700 text-white shadow-sm">
                            تسجيل دفعة
                        </Button>
                    </div>
                )}

                {/* Invoice Paper */}
                <style type="text/css" media="print">
                    {`
                        @page { margin: 5mm; }
                    `}
                </style>
                <div ref={componentRef} className="bg-white p-10 rounded-xl shadow-xl print:shadow-none print:p-0 relative overflow-hidden mt-6 print:m-0 mx-auto max-w-[210mm] min-h-[297mm] print:min-h-0 ring-1 ring-slate-200 print:ring-0">
                    {/* Watermark for Quotation */}
                    {isQuotation && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                            <span className="text-[200px] font-black -rotate-45 text-amber-900 px-12 py-6 border-8 border-amber-900 rounded-[3rem]">
                                مسودة
                            </span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="relative z-10 pb-2 mb-2 print:pb-0 print:mb-0 flex justify-between items-center h-auto">
                        <div className="w-1/4 text-right space-y-0.5 mt-1 print:mt-0">
                            <div className="flex flex-col items-start gap-0.5 text-slate-600 font-medium text-sm">
                                <div className="flex items-center gap-1.5"><Phone size={14} className="text-slate-500" /> <span className="font-bold text-slate-700">م. محمد إسماعيل</span></div>
                                <span dir="ltr" className="font-bold text-slate-700 pr-5">{settings?.phone || '-'}</span>
                            </div>
                            {settings?.vatRate > 0 && <p className="text-[10px] text-slate-400 border border-slate-200 inline-block px-1.5 py-0.5 rounded-sm font-bold mt-1">الرقم الضريبي متوفر</p>}
                        </div>
                        <div className="w-1/2 flex justify-center items-center">
                            {settings?.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" className="h-32 print:h-28 w-full object-contain mix-blend-multiply print:mix-blend-normal" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            ) : (
                                <img src="/emblem.png" alt="Logo" className="h-32 w-32 print:h-28 print:w-28 object-contain mix-blend-multiply print:mix-blend-normal" />
                            )}
                        </div>
                        <div className="w-1/4 text-left space-y-0.5 print:space-y-0 mt-1 print:mt-0">
                            {isQuotation && (
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                    عرض سعر
                                </h1>
                            )}
                            {!isQuotation && (
                                <div>
                                    <p className="text-slate-400 text-xs font-bold">
                                        رقم إذن الإستلام
                                    </p>
                                    <p className="font-mono text-lg font-bold text-slate-700 leading-tight">{sale.invoiceNumber || sale.id}</p>
                                </div>
                            )}
                            <div className="text-xs text-slate-600 font-medium">
                                <div>التاريخ: <span className="text-slate-700">{new Date(sale.createdAt).toLocaleDateString('en-GB')}</span></div>
                                <div>العميل: <span className="text-slate-700 font-bold">{sale.customer}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="relative z-10 mb-4 print:mb-2">
                        {isQuotation ? (
                            <table className="w-full text-right border border-slate-300">
                                <thead>
                                    <tr className="border-b-2 border-slate-300 text-slate-800 bg-slate-50 print:bg-slate-100">
                                        <th className="py-1 px-2 w-[10%] text-center font-bold text-lg border-l border-slate-300">العدد</th>
                                        <th className="py-2 px-2 w-[35%] font-bold text-lg text-right border-l border-slate-300">المنتج</th>
                                        <th className="py-2 px-2 w-[15%] text-center font-bold text-lg border-l border-slate-300">السماكة</th>
                                        <th className="py-2 px-2 w-[20%] text-center font-bold text-lg border-l border-slate-300">السعر الإفرادي</th>
                                        <th className="py-2 px-2 w-[20%] text-center font-bold text-lg">سعر الكمية</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-300">
                                    {sale.items.map((item, index) => (
                                        <tr key={item.id} className="group">
                                            <td className="py-0.5 px-1 text-center font-black text-slate-900 text-base border-l border-slate-300">{item.quantity}</td>
                                            <td className="py-0.5 px-1 font-black text-slate-900 text-right border-l border-slate-300 text-base leading-tight">{item.product.name}</td>
                                            <td className="py-0.5 px-1 text-center text-slate-900 font-black font-mono text-base border-l border-slate-300">{item.product.thickness || '-'}</td>
                                            <td className="py-0.5 px-1 text-center font-mono text-slate-900 font-black border-l border-slate-300 text-base">
                                                {item.price.toLocaleString()}
                                            </td>
                                            <td className="py-0.5 px-1 text-center font-mono text-slate-900 font-black text-base">
                                                {((item.product?.price || item.price) * item.quantity).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-right border border-slate-300">
                                <thead>
                                    <tr className="border-b-2 border-slate-300 text-slate-800 bg-slate-50 print:bg-slate-100">
                                        <th className="py-1 px-2 w-[15%] text-center font-bold text-lg border-l border-slate-300">الكمية</th>
                                        <th className="py-2 px-2 w-[25%] text-center font-bold text-lg border-l border-slate-300">كتابة</th>
                                        <th className="py-2 px-2 w-[35%] font-bold text-lg text-right border-l border-slate-300">المنتج</th>
                                        <th className="py-2 px-2 w-[15%] text-center font-bold text-lg border-l border-slate-300">السماكة</th>
                                        <th className="py-2 px-2 w-[10%] text-center font-bold text-lg">النوع</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-300">
                                    {sale.items.map((item, index) => (
                                        <tr key={item.id} className="group">
                                            <td className="py-0.5 px-1 text-center font-black text-slate-900 text-base border-l border-slate-300">{item.quantity}</td>
                                            <td className="py-0.5 px-1 text-center font-black text-slate-900 border-l border-slate-300 text-base leading-tight">
                                                {numberToArabicWords(item.quantity)}
                                            </td>
                                            <td className="py-0.5 px-1 font-black text-slate-900 text-right border-l border-slate-300 text-base leading-tight">{item.product.name}</td>
                                            <td className="py-0.5 px-1 text-center text-slate-900 font-black font-mono text-base border-l border-slate-300">{item.product.thickness || '-'}</td>
                                            <td className="py-0.5 px-1 text-center text-slate-900 font-black break-words text-base">{item.product.type || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Totals Section */}
                    {isQuotation && (
                        <div className="relative z-10 flex flex-col items-end mb-16 mt-4">
                            <div className="w-1/2 border-t-2 border-slate-200 pt-4">
                                <table className="w-full text-right border-collapse">
                                    <tbody className="text-slate-600 font-medium">
                                        <tr>
                                            <td className="py-2 px-4">المجموع الفرعي</td>
                                            <td className="py-2 px-4 font-mono text-left text-slate-800">
                                                {sale.items.reduce((sum, item) => sum + ((item.product?.price || item.price) * item.quantity), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                        {sale.discount > 0 && (
                                            <tr>
                                                <td className="py-2 px-4 text-red-500">الخصم</td>
                                                <td className="py-2 px-4 font-mono text-red-500 text-left">
                                                    -{(sale.items.reduce((sum, item) => sum + ((item.product?.price || item.price) * item.quantity), 0) - sale.total).toLocaleString()}
                                                </td>
                                            </tr>
                                        )}
                                        {settings?.vatRate > 0 && (
                                            <tr>
                                                <td className="py-2 px-4">
                                                    ضريبة القيمة المضافة ({settings.vatRate}%)
                                                </td>
                                                <td className="py-2 px-4 font-mono text-left">+{vatAmount.toLocaleString()}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan={2} className="py-2"><div className="border-t border-slate-200 border-dashed"></div></td>
                                        </tr>
                                        <tr>
                                            <td className="py-4 px-4 font-black text-slate-900 text-xl">الإجمالي النهائي</td>
                                            <td className="py-4 px-4 font-mono font-black text-slate-900 text-2xl text-left">
                                                {finalTotalWithVat.toLocaleString()} <span className="text-sm text-slate-500 ml-1">SDG</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
                    <Card className="w-full max-w-md p-6 bg-white shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle size={24} className="text-amber-500" />
                                تسجيل دفعة جديدة
                            </h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                                <span className="font-bold text-gray-600">المبلغ المتبقي:</span>
                                <span className="font-mono text-xl text-red-600 font-bold">{sale?.remainingAmount?.toLocaleString()} <span className="text-sm font-normal">جنية</span></span>
                            </div>

                            <Input
                                label="قيمة الدفعة الآن"
                                type="number"
                                placeholder="أدخل المبلغ هنا..."
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                min="1"
                                max={sale?.remainingAmount}
                            />

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={() => setShowPaymentModal(false)}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={paying}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={handlePayment}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={paying || !paymentAmount}
                                >
                                    {paying ? 'جاري الحفظ...' : 'حفظ الدفعة'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </main>
    )
}
