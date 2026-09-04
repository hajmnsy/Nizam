'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
    ArrowLeft, Clock, Printer, Edit, CheckCircle, Phone,
    AlertCircle, X, Trash2, FileText, PackageCheck, FileSpreadsheet,
    MapPin, Building2, Calendar, User, CreditCard, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

function numberToArabicWords(number: number): string {
    if (number === 0) return 'صفر';
    const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

    function convertGroup(num: number): string {
        let str = '';
        const h = Math.floor(num / 100);
        const t = Math.floor((num % 100) / 10);
        const o = num % 10;
        if (h > 0) str += hundreds[h];
        if (t === 1) {
            if (str) str += ' و';
            str += teens[o];
        } else {
            if (o > 0) {
                if (str) str += ' و';
                str += units[o];
            }
            if (t > 1) {
                if (str) str += ' و';
                str += tens[t];
            }
        }
        return str;
    }

    const n = Math.abs(Math.floor(number));
    const billions = Math.floor(n / 1000000000);
    const millions = Math.floor((n % 1000000000) / 1000000);
    const thousands = Math.floor((n % 1000000) / 1000);
    const remainder = Math.floor(n % 1000);

    const parts: string[] = [];
    if (billions > 0) {
        if (billions === 1) parts.push('مليار');
        else if (billions === 2) parts.push('ملياران');
        else if (billions >= 3 && billions <= 10) parts.push(convertGroup(billions) + ' مليارات');
        else parts.push(convertGroup(billions) + ' مليار');
    }
    if (millions > 0) {
        if (millions === 1) parts.push('مليون');
        else if (millions === 2) parts.push('مليونان');
        else if (millions >= 3 && millions <= 10) parts.push(convertGroup(millions) + ' ملايين');
        else parts.push(convertGroup(millions) + ' مليون');
    }
    if (thousands > 0) {
        if (thousands === 1) parts.push('ألف');
        else if (thousands === 2) parts.push('ألفان');
        else if (thousands >= 3 && thousands <= 10) parts.push(convertGroup(thousands) + ' آلاف');
        else parts.push(convertGroup(thousands) + ' ألف');
    }
    if (remainder > 0) {
        parts.push(convertGroup(remainder));
    }
    return parts.join(' و') || 'صفر';
}

function tafqeetCurrency(amount: number, currency: string = 'SDG'): string {
    if (!amount || amount === 0) return 'صفر';
    const words = numberToArabicWords(Math.floor(amount));
    let currText = 'جنيه سوداني';
    if (currency === 'USD') currText = 'دولار أمريكي';
    else if (currency === 'AED') currText = 'درهم إماراتي';
    return `فقط وقدره ${words} ${currText} لا غير`;
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
        unit?: string
    }
}

interface Sale {
    id: number
    invoiceNumber?: number | null
    customer: string
    total: number
    discount: number
    paidAmount?: number
    remainingAmount?: number
    currency?: string
    currencyRate?: number
    paymentMethod?: string
    bankName?: string | null
    bankRef?: string | null
    bankTransfers?: string | null
    chequeNumber?: string | null
    chequeBank?: string | null
    cashAmount?: number
    bankAmount?: number
    chequeAmount?: number
    createdAt: string
    status: string
    branchId?: number
    branch?: {
        id: number
        name: string
        code: string
    }
    dispatchBranchId?: number | null
    dispatchBranch?: {
        id: number
        name: string
        code: string
    } | null
    items: SaleItem[]
}

interface BankTransferEntry {
    bank: string
    ref: string
    amount?: number | string
}

function getBankTransfersList(sale: Sale): BankTransferEntry[] {
    if (sale.bankTransfers) {
        try {
            const parsed = JSON.parse(sale.bankTransfers)
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch (e) {}
    }
    if (sale.bankRef && sale.bankRef.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(sale.bankRef)
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch (e) {}
    }
    if (sale.bankRef || sale.bankName) {
        return [{
            bank: sale.bankName || 'تحويل بنكي',
            ref: sale.bankRef || '',
            amount: sale.bankAmount || 0
        }]
    }
    return []
}

type InvoiceViewMode = 'INVOICE' | 'DELIVERY' | 'QUOTATION'

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
    const [viewMode, setViewMode] = useState<InvoiceViewMode>('INVOICE')
    const [deleting, setDeleting] = useState(false)
    const componentRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        window.print()
    }

    useEffect(() => {
        Promise.all([
            fetch(`/api/sales/${params.id}`, { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/settings', { cache: 'no-store' }).then(res => res.json())
        ])
            .then(([saleData, settingsData]) => {
                setSale(saleData)
                setSettings(settingsData)
                if (saleData?.status === 'QUOTATION') {
                    setViewMode('QUOTATION')
                } else {
                    const urlParams = new URLSearchParams(window.location.search)
                    const mode = urlParams.get('mode')
                    if (mode === 'delivery') setViewMode('DELIVERY')
                    else if (mode === 'quotation') setViewMode('QUOTATION')
                    else setViewMode('INVOICE')
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [params.id])

    useEffect(() => {
        if (!loading && sale && settings) {
            const urlParams = new URLSearchParams(window.location.search)
            if (urlParams.get('print') === 'true') {
                const timer = setTimeout(() => {
                    window.print()
                }, 500)
                return () => clearTimeout(timer)
            }
        }
    }, [loading, sale, settings])

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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">
                <Clock className="animate-spin ml-2" size={20} />
                جاري تحميل بيانات الفاتورة...
            </div>
        )
    }

    if (!sale) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-red-500 font-bold gap-4">
                <AlertCircle size={48} />
                <span>عذراً، الفاتورة المطلوبة غير موجودة</span>
                <Link href="/sales">
                    <Button variant="outline">العودة لسجل المبيعات</Button>
                </Link>
            </div>
        )
    }

    const isActualQuotation = sale.status === 'QUOTATION'
    const vatAmount = settings?.vatRate ? (sale.total * settings.vatRate) / 100 : 0
    const finalTotalWithVat = sale.total + vatAmount
    const isMainBranch = sale.branchId === 1 || sale.branch?.code === 'main' || sale.branch?.name === 'الفرع الرئيسي' || !sale.branchId
    const isForeignCurrency = Boolean(sale.currency && sale.currency !== 'SDG')
    const bankTransfersList = getBankTransfersList(sale)

    return (
        <main className="min-h-screen bg-slate-100 print:bg-white print:min-h-0 print:m-0 print:p-0 pb-16 font-sans">
            {/* Top Navigation Bar */}
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="container mx-auto p-4 max-w-5xl print:max-w-none print:w-full print:p-0">
                {/* Control Action Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 print:hidden flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Link href="/sales" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-bold text-sm bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
                            <ArrowLeft size={16} />
                            رجوع
                        </Link>

                        {/* View / Print Mode Selector */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 mr-2">
                            <button
                                type="button"
                                onClick={() => setViewMode('INVOICE')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    viewMode === 'INVOICE'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-700 hover:bg-white/80'
                                }`}
                            >
                                <FileText size={15} />
                                فاتورة مبيعات مالية
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('DELIVERY')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    viewMode === 'DELIVERY'
                                        ? 'bg-amber-600 text-white shadow-md'
                                        : 'text-slate-700 hover:bg-white/80'
                                }`}
                            >
                                <PackageCheck size={15} />
                                إذن استلام وصرف مخزني
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('QUOTATION')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    viewMode === 'QUOTATION'
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-slate-700 hover:bg-white/80'
                                }`}
                            >
                                <FileSpreadsheet size={15} />
                                عرض سعر
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {isActualQuotation && (
                            <Button
                                onClick={handleConvertToSale}
                                disabled={converting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold text-xs"
                            >
                                {converting ? 'جاري التحويل...' : 'اعتماد وتحويل لفاتورة بيع'}
                            </Button>
                        )}

                        {sale.status === 'CREDIT' && (
                            <Button
                                onClick={() => setShowPaymentModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold text-xs"
                            >
                                تسجيل دفعة (تحصيل)
                            </Button>
                        )}

                        <Link href={`/sales/${sale.id}/edit`}>
                            <Button variant="outline" className="flex items-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs">
                                <Edit size={15} />
                                تعديل
                            </Button>
                        </Link>

                        <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            variant="outline"
                            className="flex items-center gap-1.5 border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs"
                        >
                            <Trash2 size={15} />
                            {deleting ? 'جاري الحذف...' : 'حذف'}
                        </Button>

                        <Button
                            onClick={handlePrint}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                            <Printer size={15} />
                            طباعة ({viewMode === 'INVOICE' ? 'فاتورة' : viewMode === 'DELIVERY' ? 'إذن مخزن' : 'عرض سعر'})
                        </Button>
                    </div>
                </div>

                {/* Status Notice Banners (Screen Only) */}
                {sale.status === 'CREDIT' && (
                    <div className="mb-4 bg-red-50 border-r-4 border-red-500 text-red-800 p-3 rounded-lg flex items-center justify-between print:hidden shadow-sm">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                            <div className="text-xs">
                                <span className="font-black text-sm block">فاتورة غير مسددة بالكامل (آجلة)</span>
                                <span>إجمالي الفاتورة: {sale.total.toLocaleString()} ج.س | المدفوع: {(sale.paidAmount || 0).toLocaleString()} ج.س | المتبقي: {(sale.remainingAmount || 0).toLocaleString()} ج.س</span>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => setShowPaymentModal(true)} className="bg-red-600 hover:bg-red-700 text-white text-xs">
                            تسجيل دفعة الآن
                        </Button>
                    </div>
                )}

                {isActualQuotation && (
                    <div className="mb-4 bg-purple-50 border-r-4 border-purple-500 text-purple-900 p-3 rounded-lg flex items-center justify-between print:hidden shadow-sm text-xs">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-purple-600 flex-shrink-0" />
                            <div>
                                <span className="font-black text-sm block">عرض سعر مسودة (غير معتمد بعد)</span>
                                <span>لم يتم خصم كميات هذه الأصناف من المخزون بعد. يمكنك تحويله إلى فاتورة بيع معتمدة عند تأكيد العميل.</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Print Layout Styles */}
                <style type="text/css" media="print">
                    {`
                        @page {
                            size: A4 portrait;
                            margin: 6mm 8mm;
                        }
                        @media print {
                            body {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                background-color: #ffffff !important;
                            }
                            .no-print {
                                display: none !important;
                            }
                        }
                    `}
                </style>

                {/* INVOICE PAPER (A4 Dimension Optimized) */}
                <div
                    ref={componentRef}
                    className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 relative overflow-hidden mx-auto max-w-[210mm] min-h-[297mm] print:min-h-0 print:m-0 ring-1 ring-slate-200 print:ring-0 text-slate-900"
                    dir="rtl"
                >
                    {/* Watermark for Quotation */}
                    {viewMode === 'QUOTATION' && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 select-none">
                            <span className="text-[130px] font-black -rotate-45 text-slate-950 px-12 py-6 border-8 border-slate-950 rounded-[3rem]">
                                عرض سعر
                            </span>
                        </div>
                    )}

                    {/* Watermark for Delivery Note */}
                    {viewMode === 'DELIVERY' && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none z-0 select-none">
                            <span className="text-[110px] font-black -rotate-45 text-amber-950 px-10 py-4 border-8 border-amber-950 rounded-[3rem]">
                                إذن استلام
                            </span>
                        </div>
                    )}

                    {/* 1. Basmala Header */}
                    <div className="relative z-10 text-center text-xs font-serif font-bold text-slate-500 mb-2 print:mb-1 tracking-widest border-b border-slate-100 pb-1">
                        بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ
                    </div>

                    {/* 2. Official Header */}
                    <div className="relative z-10 flex justify-between items-center pb-4 mb-4 border-b-2 border-slate-800 gap-4">
                        {/* Right: Company and Branch Info */}
                        <div className="w-[36%] text-right space-y-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                                    {settings?.companyName || 'المصنع السوداني الماليزي'}
                                </h1>
                            </div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="inline-block bg-slate-900 text-white text-[11px] font-black px-2.5 py-0.5 rounded shadow-sm">
                                    {isMainBranch ? 'الفرع الرئيسي' : ((sale as any)?.branch?.name || 'فرع الشركة')}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600">
                                    صناعة وتجارة كافة أنواع وتخانات الحديد
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-700 font-bold space-y-0.5 pt-1">
                                <div className="flex items-center gap-1 text-slate-800">
                                    <Phone size={12} className="text-slate-600" />
                                    <span>م. محمد إسماعيل:</span>
                                    <span dir="ltr" className="font-mono">{settings?.phone || '0123456789'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-600 text-[10px]">
                                    <MapPin size={12} className="text-slate-500" />
                                    <span>{settings?.address || 'الدامر - المنطقة الصناعية - شمال سوق السبت'}</span>
                                </div>
                                {settings?.vatRate > 0 && (
                                    <div className="text-[10px] text-emerald-800 font-extrabold flex items-center gap-1">
                                        <ShieldCheck size={12} />
                                        <span>الرقم الضريبي معتمد ({settings.vatRate}%)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Center: Prestige Emblem / Industrial Logo */}
                        <div className="w-[34%] flex flex-col justify-center items-center">
                            {settings?.logoUrl ? (
                                <img
                                    src={settings.logoUrl}
                                    alt="Logo"
                                    className="h-24 print:h-20 max-w-full w-auto object-contain mix-blend-multiply"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            ) : (
                                <div className="relative w-full py-2.5 px-3 bg-gradient-to-b from-slate-50 to-slate-100 border-2 border-double border-slate-900 rounded-lg flex flex-col items-center justify-center select-none shadow-sm">
                                    {/* Corner industrial rivets */}
                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-400"></div>
                                    <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-400"></div>
                                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-400"></div>
                                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-400"></div>

                                    <span className="text-sm sm:text-base font-black text-slate-950 tracking-[0.15em] font-sans leading-tight text-center">
                                        الـمـصـنـع الـسـودانـي الـمـالـيـزي
                                    </span>
                                    <span className="text-[9px] font-black text-slate-600 tracking-wider mt-0.5">
                                        للـمـنـتـجـات الـحـديـديـة ومـواد الـبـنـاء
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Left: Document Badge Card */}
                        <div className="w-[30%] text-left">
                            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-right shadow-sm space-y-1">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                    <span className="text-xs font-bold text-slate-500">نوع المستند:</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                                        viewMode === 'INVOICE'
                                            ? 'bg-blue-100 text-blue-900'
                                            : viewMode === 'DELIVERY'
                                            ? 'bg-amber-100 text-amber-900'
                                            : 'bg-purple-100 text-purple-900'
                                    }`}>
                                        {viewMode === 'INVOICE' ? 'فاتورة مبيعات' : viewMode === 'DELIVERY' ? 'إذن استلام مخزن' : 'عرض سعر'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-0.5">
                                    <span className="font-bold text-slate-600">
                                        {viewMode === 'DELIVERY' ? 'رقم الإذن:' : 'رقم الفاتورة:'}
                                    </span>
                                    <span className="font-mono text-base font-black text-slate-950">
                                        #{sale.invoiceNumber || sale.id}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] pt-0.5">
                                    <span className="font-bold text-slate-600">التاريخ:</span>
                                    <span className="font-bold text-slate-800 font-mono">
                                        {new Date(sale.createdAt).toLocaleDateString('en-GB')}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-600">الوقت:</span>
                                    <span className="font-bold text-slate-700 font-mono" dir="ltr">
                                        {new Date(sale.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                                    <span className="font-bold text-slate-600">الحالة:</span>
                                    <span className={`font-black text-[10px] px-1.5 py-0.2 rounded ${
                                        sale.status === 'PAID'
                                            ? 'text-emerald-700 bg-emerald-50'
                                            : sale.status === 'CREDIT'
                                            ? 'text-red-700 bg-red-50'
                                            : 'text-amber-700 bg-amber-50'
                                    }`}>
                                        {sale.status === 'PAID' ? 'خالص السداد' : sale.status === 'CREDIT' ? 'آجل / غير خالص' : 'مسودة'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Client & Metadata Grid */}
                    <div className={`relative z-10 grid grid-cols-1 ${isForeignCurrency ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2 mb-4 text-xs`}>
                        {/* Box 1: Customer */}
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">العميل المكرم:</span>
                            <span className="font-black text-slate-950 text-sm block truncate">
                                {sale.customer || 'عميل نقدي'}
                            </span>
                        </div>

                        {/* Box 2: Payment Details (Handles Single/Multiple Bankak/Fawry/Cash/Cheque) */}
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">طريقة الدفع:</span>
                            {sale.paymentMethod === 'BANK' && (
                                <div>
                                    {bankTransfersList.length > 1 ? (
                                        <div className="space-y-1">
                                            <span className="font-black text-blue-900 block text-xs">
                                                تحويلات بنكية ({bankTransfersList.length} إشعارات):
                                            </span>
                                            <div className="space-y-1 mt-0.5 max-h-24 overflow-y-auto">
                                                {bankTransfersList.map((t, idx) => (
                                                    <div key={idx} className="bg-white/80 border border-blue-200 rounded px-1.5 py-0.5 text-[10px] flex justify-between items-center">
                                                        <span className="font-bold text-slate-800">
                                                            {t.bank} <span className="font-mono text-slate-600">(إشعار: {t.ref || '-'})</span>
                                                        </span>
                                                        {t.amount ? (
                                                            <span className="font-mono font-black text-blue-950 mr-1">
                                                                {Number(t.amount).toLocaleString()} ج.س
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <span className="font-black text-slate-800 block">
                                                تحويل بنكي ({bankTransfersList[0]?.bank || sale.bankName || 'بنك الخرطوم (بنكك)'})
                                            </span>
                                            <span className="text-[10px] text-slate-600 block mt-0.5 font-mono">
                                                إشعار: {bankTransfersList[0]?.ref || sale.bankRef || '-'}
                                            </span>
                                            {bankTransfersList[0]?.amount ? (
                                                <span className="text-[10px] text-blue-900 font-bold block mt-0.5">
                                                    المبلغ: {Number(bankTransfersList[0].amount).toLocaleString()} ج.س
                                                </span>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            )}

                            {sale.paymentMethod === 'CHEQUE' && (
                                <div>
                                    <span className="font-black text-slate-800 block">
                                        شيك مصرفي ({sale.chequeBank || 'البنك'})
                                    </span>
                                    <span className="text-[10px] text-slate-600 block mt-0.5 font-mono">
                                        شيك #: {sale.chequeNumber || '-'}
                                    </span>
                                </div>
                            )}

                            {sale.paymentMethod === 'MULTIPLE' && (
                                <div className="space-y-1">
                                    <span className="font-black text-amber-900 block text-xs">سداد مجزأ:</span>
                                    <div className="text-[10px] space-y-0.5">
                                        {(sale.cashAmount || 0) > 0 && (
                                            <div>كاش: <strong className="font-mono">{sale.cashAmount?.toLocaleString()} ج.س</strong></div>
                                        )}
                                        {bankTransfersList.length > 0 ? (
                                            <div className="space-y-0.5">
                                                {bankTransfersList.map((t, idx) => (
                                                    <div key={idx} className="bg-blue-50/50 border border-blue-200/60 rounded px-1.5 py-0.5">
                                                        بنك: <strong className="font-bold">{t.bank}</strong> (إشعار: <span className="font-mono">{t.ref || '-'}</span>) - <span className="font-mono font-bold text-blue-900">{Number(t.amount || sale.bankAmount || 0).toLocaleString()} ج.س</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (sale.bankAmount || 0) > 0 ? (
                                            <div>بنك: <strong className="font-mono">{sale.bankAmount?.toLocaleString()} ج.س</strong></div>
                                        ) : null}
                                        {(sale.chequeAmount || 0) > 0 && (
                                            <div>شيك: <strong className="font-mono">{sale.chequeAmount?.toLocaleString()} ج.س</strong> ({sale.chequeBank || 'بنك الشيك'} - #{sale.chequeNumber || '-'})</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {sale.paymentMethod === 'CASH' && (
                                <div>
                                    <span className="font-black text-slate-800 block">نقداً (كاش)</span>
                                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">تم استلام المبلغ نقداً بالخزينة</span>
                                </div>
                            )}
                        </div>

                        {/* Box 3: Currency & Rate - ONLY SHOWN IF NOT SDG */}
                        {isForeignCurrency && (
                            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">العملة وسعر الصرف:</span>
                                <span className="font-black text-slate-800 block">
                                    {sale.currency === 'USD' ? 'دولار ($ USD)' : 'درهم (AED د.إ)'}
                                </span>
                                <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">
                                    الصرف: {sale.currencyRate?.toLocaleString()} ج.س
                                </span>
                            </div>
                        )}

                        {/* Box 4 (or 3 if SDG): Dispatch Location */}
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">موقع الاستلام والصرف:</span>
                            <span className={`font-black block truncate ${
                                (sale.dispatchBranchId && sale.dispatchBranchId !== sale.branchId)
                                    ? 'text-amber-800'
                                    : 'text-slate-800'
                            }`}>
                                {sale.dispatchBranch?.name ? sale.dispatchBranch.name : 'مخازن الفرع الرئيسي'}
                            </span>
                            {(sale.dispatchBranchId && sale.dispatchBranchId !== sale.branchId) && (
                                <span className="text-[9px] font-black text-amber-700 block">
                                    ⚠️ توجيه استلام من فرع آخر
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Cross-Branch Alert Banner (If Dispatched from another branch) */}
                    {sale.dispatchBranch && sale.dispatchBranchId && sale.dispatchBranchId !== sale.branchId && (
                        <div className="relative z-10 mb-3 p-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 font-bold text-xs flex items-center gap-2">
                            <span className="text-xl">📍</span>
                            <div>
                                <span className="font-black text-amber-900 block text-xs">
                                    ملاحظة صرف مخزني: موقع تسليم البضاعة هو فرع ({sale.dispatchBranch.name})
                                </span>
                                <span className="text-[10px] text-amber-800 block font-medium">
                                    تم سداد القيمة في مكاتب ({sale.branch?.name || 'الفرع الصادر'})، وتسلَم البضاعة وتخصم من مخزون فرع ({sale.dispatchBranch.name}).
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 4. Products Table */}
                    <div className="relative z-10 mb-4">
                        {/* Mode A: FINANCIAL INVOICE & QUOTATION (No Quantity in Words column) */}
                        {(viewMode === 'INVOICE' || viewMode === 'QUOTATION') && (
                            <table className="w-full text-right border-collapse border border-slate-800">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-xs">
                                        <th className="py-2.5 px-2 w-[5%] text-center font-black border border-slate-700">#</th>
                                        <th className="py-2.5 px-3 w-[41%] text-right font-black border border-slate-700">بيان الصنف والمنتج</th>
                                        <th className="py-2.5 px-2 w-[11%] text-center font-black border border-slate-700">السماكة</th>
                                        <th className="py-2.5 px-2 w-[11%] text-center font-black border border-slate-700">النوع</th>
                                        <th className="py-2.5 px-2 w-[10%] text-center font-black border border-slate-700">الكمية</th>
                                        <th className="py-2.5 px-2 w-[11%] text-center font-black border border-slate-700">السعر الإفرادي</th>
                                        <th className="py-2.5 px-2 w-[11%] text-center font-black border border-slate-700">سعر الكمية</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-slate-300">
                                    {sale.items.map((item, index) => (
                                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                            <td className="py-1.5 px-2 text-center font-bold text-slate-600 border border-slate-300">
                                                {index + 1}
                                            </td>
                                            <td className="py-1.5 px-3 font-black text-slate-900 border border-slate-300 text-sm leading-tight">
                                                {item.product.name}
                                            </td>
                                            <td className="py-1.5 px-2 text-center font-bold font-mono text-slate-800 border border-slate-300">
                                                {item.product.thickness ? `${item.product.thickness} مم` : '-'}
                                            </td>
                                            <td className="py-1.5 px-2 text-center font-bold text-slate-700 border border-slate-300">
                                                {item.product.type || '-'}
                                            </td>
                                            <td className="py-1.5 px-2 text-center font-black font-mono text-slate-950 text-sm border border-slate-300">
                                                {item.quantity}
                                            </td>
                                            <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-800 border border-slate-300">
                                                {item.price.toLocaleString()}
                                            </td>
                                            <td className="py-1.5 px-2 text-center font-mono font-black text-slate-950 border border-slate-300">
                                                {(item.price * item.quantity).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Mode B: WAREHOUSE DELIVERY NOTE (Keeps Quantity in Words for storekeeper security) */}
                        {viewMode === 'DELIVERY' && (
                            <table className="w-full text-right border-collapse border border-slate-800">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-xs">
                                        <th className="py-2.5 px-2 w-[6%] text-center font-black border border-slate-700">م</th>
                                        <th className="py-2.5 px-3 w-[36%] text-right font-black border border-slate-700">بيان الصنف والمواصفات</th>
                                        <th className="py-2.5 px-2 w-[12%] text-center font-black border border-slate-700">السماكة</th>
                                        <th className="py-2.5 px-2 w-[12%] text-center font-black border border-slate-700">النوع</th>
                                        <th className="py-2.5 px-2 w-[12%] text-center font-black border border-slate-700">الكمية رقماً</th>
                                        <th className="py-2.5 px-2 w-[22%] text-center font-black border border-slate-700">الكمية كتابة بالأحرف</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-slate-300">
                                    {sale.items.map((item, index) => (
                                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                            <td className="py-2 px-2 text-center font-bold text-slate-600 border border-slate-300">
                                                {index + 1}
                                            </td>
                                            <td className="py-2 px-3 font-black text-slate-900 border border-slate-300 text-sm leading-tight">
                                                {item.product.name}
                                            </td>
                                            <td className="py-2 px-2 text-center font-bold font-mono text-slate-800 border border-slate-300 text-sm">
                                                {item.product.thickness ? `${item.product.thickness} مم` : '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-bold text-slate-700 border border-slate-300">
                                                {item.product.type || '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-black font-mono text-slate-950 text-base border border-slate-300">
                                                {item.quantity}
                                            </td>
                                            <td className="py-2 px-2 text-center font-black text-slate-900 border border-slate-300 text-xs leading-snug">
                                                {numberToArabicWords(item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* 5. Financial Totals & Tafqeet Section (Shown for INVOICE & QUOTATION) */}
                    {(viewMode === 'INVOICE' || viewMode === 'QUOTATION') && (
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Right: Tafqeet & Payment Details */}
                            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 flex flex-col justify-between">
                                <div>
                                    <span className="text-[11px] font-black text-slate-500 block mb-1">المبلغ كتابة:</span>
                                    <div className="text-sm font-black text-slate-900 leading-relaxed bg-white border border-slate-200 p-2.5 rounded-lg shadow-inner">
                                        {tafqeetCurrency(Math.round(finalTotalWithVat), sale.currency || 'SDG')}
                                    </div>
                                </div>

                                {isForeignCurrency && (
                                    <div className="mt-2 text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 p-2 rounded-lg flex justify-between items-center">
                                        <span>القيمة بعملة الفاتورة ({sale.currency}):</span>
                                        <span className="font-mono text-sm font-black">
                                            {(finalTotalWithVat / (sale.currencyRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sale.currency === 'USD' ? '$ USD' : 'AED د.إ'}
                                        </span>
                                    </div>
                                )}

                                {sale.status === 'CREDIT' && (
                                    <div className="mt-2 text-xs grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                                        <div className="text-slate-700">
                                            <span>المدفوع:</span> <strong className="text-emerald-700 font-mono">{(sale.paidAmount || 0).toLocaleString()} ج.س</strong>
                                        </div>
                                        <div className="text-slate-700 text-left">
                                            <span>المتبقي:</span> <strong className="text-red-700 font-mono">{(sale.remainingAmount || 0).toLocaleString()} ج.س</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Left: Summary Table */}
                            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5">
                                <table className="w-full text-xs">
                                    <tbody className="divide-y divide-slate-200">
                                        <tr>
                                            <td className="py-1.5 text-slate-600 font-bold">إجمالي الأصناف (المجموع الفرعي):</td>
                                            <td className="py-1.5 text-left font-mono font-bold text-slate-800 text-sm">
                                                {sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} <span className="text-[10px] font-sans">ج.س</span>
                                            </td>
                                        </tr>

                                        {sale.discount > 0 && (
                                            <tr>
                                                <td className="py-1.5 text-red-600 font-bold">الخصم الممنوح:</td>
                                                <td className="py-1.5 text-left font-mono font-bold text-red-600 text-sm">
                                                    -{(sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - sale.total).toLocaleString()} <span className="text-[10px] font-sans">ج.س</span>
                                                </td>
                                            </tr>
                                        )}

                                        {settings?.vatRate > 0 && (
                                            <tr>
                                                <td className="py-1.5 text-slate-600 font-bold">ضريبة القيمة المضافة ({settings.vatRate}%):</td>
                                                <td className="py-1.5 text-left font-mono font-bold text-slate-800">
                                                    +{vatAmount.toLocaleString()} <span className="text-[10px] font-sans">ج.س</span>
                                                </td>
                                            </tr>
                                        )}

                                        <tr className="border-t-2 border-slate-800">
                                            <td className="py-2.5 text-slate-950 font-black text-sm sm:text-base">الصافي النهائي المطلوب:</td>
                                            <td className="py-2.5 text-left font-mono font-black text-slate-950 text-lg sm:text-xl">
                                                {finalTotalWithVat.toLocaleString()} <span className="text-xs font-sans text-slate-600">ج.س</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 6. Signatures and Approval Section */}
                    {/* Variant A: For Invoice & Quotation */}
                    {(viewMode === 'INVOICE' || viewMode === 'QUOTATION') && (
                        <div className="relative z-10 pt-4 border-t-2 border-slate-800">
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between h-24">
                                    <span className="font-bold text-slate-700">توقيع المستلم / العميل</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
                                </div>

                                <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between h-24">
                                    <span className="font-bold text-slate-700">أمين المستودع / الصرف</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
                                </div>

                                <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between h-24">
                                    <span className="font-bold text-slate-700">المحاسب / المبيعات</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
                                </div>

                                <div className="border-2 border-dashed border-slate-400 rounded-xl p-2.5 flex flex-col items-center justify-center h-24 bg-slate-50/30">
                                    <span className="text-[10px] font-bold text-slate-400">مكان الختم الرسمي</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Variant B: For Warehouse Delivery Note */}
                    {viewMode === 'DELIVERY' && (
                        <div className="relative z-10 pt-4 border-t-2 border-slate-800 space-y-4">
                            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs">
                                <p className="font-bold text-slate-800 mb-2">
                                    إقرار استلام: أقر أنا الموقع أدناه باستلام كامل الأصناف والكميات المذكورة بعاليه من مستودعات المصنع بحالة جيدة وسليمة ومطابقة للمواصفات المطلوبة.
                                </p>
                                <div className="grid grid-cols-3 gap-3 text-slate-700 pt-1">
                                    <div>اسم المستلم / السائق: .......................................</div>
                                    <div>رقم الهاتف / الإثبات: .......................................</div>
                                    <div>رقم مركبة الشحن (العربة): .......................................</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center text-xs">
                                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-24">
                                    <span className="font-bold text-slate-700">توقيع المستلم / السائق</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
                                </div>

                                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-24">
                                    <span className="font-bold text-slate-700">أمين المستودع ومسؤول الصرف</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
                                </div>

                                <div className="border-2 border-dashed border-slate-400 rounded-xl p-3 flex flex-col items-center justify-center h-24 bg-slate-50/30">
                                    <span className="text-[10px] font-bold text-slate-400">ختم أمن البوابة وتصريح الخروج</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. Footer Note */}
                    <div className="relative z-10 mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-bold space-y-0.5">
                        <p>
                            {viewMode === 'DELIVERY'
                                ? 'يجب إبراز هذا الإذن المعتمد لأمن البوابة عند الخروج من حرم المصنع.'
                                : viewMode === 'QUOTATION'
                                ? 'هذا العرض مبدئي وسعره ساري لمدة محددة تبعاً لتقلبات أسعار الصرف وخامات الحديد في السوق.'
                                : 'البضاعة التي تخرج من حرم المصنع لا ترد ولا تستبدل إلا بموافقة الإدارة ووفقاً لللوائح المعتمدة.'}
                        </p>
                        <p className="text-slate-400">
                            {settings?.companyName || 'المصنع السوداني الماليزي للمنتجات الحديدية'} | الدامر - المنطقة الصناعية | هاتف: {settings?.phone || '0123456789'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden p-4">
                    <Card className="w-full max-w-md p-6 bg-white shadow-2xl animate-in zoom-in-95 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-black flex items-center gap-2 text-slate-900">
                                <AlertCircle size={22} className="text-amber-500" />
                                تسجيل دفعة نقدية جديدة
                            </h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={22} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-slate-600 text-xs">المبلغ المتبقي على العميل:</span>
                                <span className="font-mono text-lg text-red-600 font-black">
                                    {sale?.remainingAmount?.toLocaleString()} <span className="text-xs font-normal">ج.س</span>
                                </span>
                            </div>

                            <Input
                                label="قيمة الدفعة المسددة الآن"
                                type="number"
                                placeholder="أدخل المبلغ المسدد..."
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                min="1"
                                max={sale?.remainingAmount}
                            />

                            <div className="flex gap-2 pt-3">
                                <Button
                                    onClick={() => setShowPaymentModal(false)}
                                    variant="outline"
                                    className="flex-1 font-bold text-xs"
                                    disabled={paying}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={handlePayment}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
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
