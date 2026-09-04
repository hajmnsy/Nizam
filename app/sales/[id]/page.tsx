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
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);
    const words = numberToArabicWords(integerPart);
    let currText = 'جنيه سوداني';
    let subText = 'قرش';
    if (currency === 'USD') {
        currText = 'دولار أمريكي';
        subText = 'سنت';
    } else if (currency === 'AED') {
        currText = 'درهم إماراتي';
        subText = 'فلس';
    }

    if (decimalPart > 0) {
        const decWords = numberToArabicWords(decimalPart);
        return `فقط وقدره ${words} ${currText} و${decWords} ${subText} لا غير`;
    }
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
    bankSender?: string | null
    bankRecipient?: string | null
    chequeNumber?: string | null
    chequeBank?: string | null
    chequeSender?: string | null
    chequeRecipient?: string | null
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
    sender?: string | null
    recipient?: string | null
}

function getBankTransfersList(sale: Sale): BankTransferEntry[] {
    if (sale.bankTransfers) {
        try {
            const parsed = JSON.parse(sale.bankTransfers)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((t: any, idx: number) => ({
                    ...t,
                    sender: t.sender || (idx === 0 ? sale.bankSender : null),
                    recipient: t.recipient || (idx === 0 ? sale.bankRecipient : null)
                }))
            }
        } catch (e) {}
    }
    if (sale.bankRef && sale.bankRef.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(sale.bankRef)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((t: any, idx: number) => ({
                    ...t,
                    sender: t.sender || (idx === 0 ? sale.bankSender : null),
                    recipient: t.recipient || (idx === 0 ? sale.bankRecipient : null)
                }))
            }
        } catch (e) {}
    }
    if (sale.bankRef || sale.bankName || sale.bankSender || sale.bankRecipient) {
        return [{
            bank: sale.bankName || 'تحويل بنكي',
            ref: sale.bankRef || '',
            amount: sale.bankAmount || 0,
            sender: sale.bankSender || null,
            recipient: sale.bankRecipient || null
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
    const currencyRate = sale.currencyRate && sale.currencyRate > 0 ? sale.currencyRate : 1
    const currencyCode = sale.currency || 'SDG'
    const currencySymbol = currencyCode === 'USD' ? '$ USD' : currencyCode === 'AED' ? 'د.إ (AED)' : 'ج.س'
    const shortCurrencySymbol = currencyCode === 'USD' ? '$' : currencyCode === 'AED' ? 'د.إ' : 'ج.س'

    // Amounts in invoice currency vs SDG
    const subtotalSDG = sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountSDG = sale.discount || 0
    const vatAmountSDG = vatAmount
    const finalTotalSDG = finalTotalWithVat

    const subtotalCurrency = isForeignCurrency ? subtotalSDG / currencyRate : subtotalSDG
    const discountCurrency = isForeignCurrency ? discountSDG / currencyRate : discountSDG
    const vatAmountCurrency = isForeignCurrency ? vatAmountSDG / currencyRate : vatAmountSDG
    const finalTotalCurrency = isForeignCurrency ? finalTotalSDG / currencyRate : finalTotalSDG

    const bankTransfersList = getBankTransfersList(sale)

    interface PaymentRow {
        type: string
        refNumber: string
        sender: string
        recipient: string
        amount: number
    }

    const paymentRows: PaymentRow[] = []

    if (sale.paymentMethod === 'CASH') {
        paymentRows.push({
            type: 'نقداً (كاش - الخزينة)',
            refNumber: '-',
            sender: sale.customer || 'العميل',
            recipient: 'خزينة الفرع',
            amount: Number(sale.cashAmount || sale.paidAmount || (sale.status === 'PAID' ? sale.total : 0))
        })
    } else if (sale.paymentMethod === 'BANK') {
        if (bankTransfersList.length > 0) {
            bankTransfersList.forEach((t) => {
                paymentRows.push({
                    type: `تحويل بنكي (${t.bank})`,
                    refNumber: t.ref || 'بدون إشعار',
                    sender: t.sender || '-',
                    recipient: t.recipient || '-',
                    amount: Number(t.amount || (bankTransfersList.length === 1 ? (sale.bankAmount || sale.paidAmount || sale.total) : 0))
                })
            })
        } else {
            paymentRows.push({
                type: `تحويل بنكي (${sale.bankName || 'بنك الخرطوم (بنكك)'})`,
                refNumber: sale.bankRef || '-',
                sender: sale.bankSender || '-',
                recipient: sale.bankRecipient || '-',
                amount: Number(sale.bankAmount || sale.paidAmount || sale.total || 0)
            })
        }
    } else if (sale.paymentMethod === 'CHEQUE') {
        paymentRows.push({
            type: `شيك مصرفي (${sale.chequeBank || 'البنك'})`,
            refNumber: sale.chequeNumber || '-',
            sender: sale.chequeSender || '-',
            recipient: sale.chequeRecipient || '-',
            amount: Number(sale.chequeAmount || sale.paidAmount || sale.total || 0)
        })
    } else if (sale.paymentMethod === 'MULTIPLE') {
        if ((sale.cashAmount || 0) > 0) {
            paymentRows.push({
                type: 'نقداً (كاش)',
                refNumber: '-',
                sender: sale.customer || 'العميل',
                recipient: 'خزينة الفرع',
                amount: Number(sale.cashAmount)
            })
        }
        if ((sale.chequeAmount || 0) > 0) {
            paymentRows.push({
                type: `شيك مصرفي (${sale.chequeBank || 'البنك'})`,
                refNumber: sale.chequeNumber || '-',
                sender: sale.chequeSender || '-',
                recipient: sale.chequeRecipient || '-',
                amount: Number(sale.chequeAmount)
            })
        }
        if (bankTransfersList.length > 0) {
            bankTransfersList.forEach((t) => {
                paymentRows.push({
                    type: `تحويل بنكي (${t.bank})`,
                    refNumber: t.ref || 'بدون إشعار',
                    sender: t.sender || '-',
                    recipient: t.recipient || '-',
                    amount: Number(t.amount || 0)
                })
            })
        } else if ((sale.bankAmount || 0) > 0) {
            paymentRows.push({
                type: `تحويل بنكي (${sale.bankName || 'بنك الخرطوم (بنكك)'})`,
                refNumber: sale.bankRef || '-',
                sender: sale.bankSender || '-',
                recipient: sale.bankRecipient || '-',
                amount: Number(sale.bankAmount)
            })
        }
    }

    // Calculate total rows to dynamically optimize print density for a single A4 sheet
    const totalPrintRows = (sale?.items?.length || 0) + (paymentRows?.length || 1);

    return (
        <main className="min-h-screen bg-slate-100 print:bg-white print:min-h-0 print:m-0 print:p-0 pb-16 print:pb-0 font-sans">
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

                {/* Print Guidance Alert (Screen only) */}
                <div className="mb-4 bg-blue-50 border-r-4 border-blue-600 text-blue-900 p-2.5 rounded-lg flex items-center justify-between print:hidden shadow-xs text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🖨️</span>
                        <div>
                            <span className="font-bold block">ملاحظة لطباعة ألوان كاملة وواضحة:</span>
                            <span>في نافذة الطباعة (Ctrl+P)، انقر على «المزيد من الإعدادات / More settings» وتأكد من تفعيل خيار <strong>«رسومات الخلفية / Background graphics»</strong> لتظهر كافة الخلفيات والألوان المميزة.</span>
                        </div>
                    </div>
                </div>

                {/* Print Layout Styles - Strictly Single A4 Sheet Guarantee */}
                <style type="text/css" media="print">
                    {`
                        @page {
                            size: A4 portrait;
                            margin: 5mm 6mm 4mm 6mm;
                        }
                        @media print {
                            *, *::before, *::after {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                box-sizing: border-box !important;
                            }
                            html, body {
                                width: 100% !important;
                                height: 100% !important;
                                max-height: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background-color: #ffffff !important;
                                overflow: hidden !important;
                            }
                            .no-print {
                                display: none !important;
                            }
                            .invoice-a4-sheet {
                                width: 100% !important;
                                max-width: 100% !important;
                                min-height: 0 !important;
                                height: auto !important;
                                max-height: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                border: none !important;
                                box-shadow: none !important;
                                overflow: hidden !important;
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                                page-break-after: avoid !important;
                                break-after: avoid !important;
                            }
                            table {
                                width: 100% !important;
                                border-collapse: collapse !important;
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                            tr, td, th {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                        }
                    `}
                </style>

                {/* INVOICE PAPER (A4 Dimension Optimized) */}
                <div
                    ref={componentRef}
                    className="invoice-a4-sheet bg-white p-8 sm:p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 relative overflow-hidden mx-auto max-w-[210mm] print:max-w-none print:w-full min-h-[297mm] print:min-h-0 print:m-0 ring-1 ring-slate-200 print:ring-0 text-slate-900"
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
                    <div className="relative z-10 text-center text-xs font-serif font-bold text-slate-500 mb-2 print:mb-0.5 tracking-widest border-b border-slate-100 pb-1 print:pb-0.5 print:text-[10px]">
                        بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ
                    </div>

                    {/* 2. Official Header */}
                    <div className="relative z-10 grid grid-cols-3 items-center pb-3 mb-3 border-b-2 border-slate-900 gap-2 print:pb-1.5 print:mb-1.5 print:gap-1.5">
                        {/* Right: Company and Branch Info */}
                        <div className="text-right space-y-1 print:space-y-0.5">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight print:text-base">
                                المصنع السوداني الماليزي
                            </h1>
                            <div className="flex items-center gap-1.5 pt-0.5 print:gap-1 print:pt-0">
                                <span className="inline-block bg-slate-900 text-white text-[11px] font-black px-2.5 py-0.5 rounded shadow-sm print:text-[9px] print:px-1.5 print:py-0 print:bg-slate-900">
                                    {isMainBranch ? 'الفرع الرئيسي' : ((sale as any)?.branch?.name || 'فرع الشركة')}
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-700 font-bold space-y-0.5 pt-1 print:text-[9px] print:space-y-0 print:pt-0.5">
                                <div className="flex items-center gap-1 text-slate-900 print:gap-0.5">
                                    <Phone size={12} className="text-slate-600 print:w-2.5 print:h-2.5" />
                                    <span className="font-black">صالح عوض صالح:</span>
                                    <span dir="ltr" className="font-mono font-black">0120021085</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-700 text-[10.5px] print:text-[8.5px] print:gap-0.5">
                                    <MapPin size={12} className="text-slate-500 print:w-2.5 print:h-2.5" />
                                    <span className="font-bold">الموقع: سوق عطبرة - السينما الوطنية</span>
                                </div>
                                {settings?.vatRate > 0 && (
                                    <div className="text-[10px] text-emerald-800 font-extrabold flex items-center gap-1 print:text-[8.5px] print:gap-0.5">
                                        <ShieldCheck size={12} className="print:w-2.5 print:h-2.5" />
                                        <span>الرقم الضريبي معتمد ({settings.vatRate}%)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Center: Exactly Centered High-End Industrial Textual Logo */}
                        <div className="flex flex-col justify-center items-center text-center">
                            <div className="relative w-full max-w-[260px] py-2 px-3 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center select-none shadow-md print:shadow-none print:py-1.5 print:px-2 print:bg-slate-950 print:border-slate-900 mx-auto">
                                {/* Corner steel rivets */}
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 print:bg-amber-300"></div>
                                <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400 print:bg-amber-300"></div>
                                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 print:bg-amber-300"></div>
                                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400 print:bg-amber-300"></div>

                                <div className="flex items-center gap-1 mb-0.5">
                                    <svg className="w-4 h-4 print:w-3.5 print:h-3.5 text-amber-400 print:text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8L19.5 8 12 11.2 4.5 8 12 4.8zM4 9.6l7 3.7v7.1-7-3.5V9.6zm9 10.8v-7.1l7-3.7v7.3l-7 3.5z"/>
                                    </svg>
                                    <span className="text-[11px] sm:text-xs font-black tracking-wider text-amber-400 print:text-amber-300 font-sans">
                                        SMS STEEL
                                    </span>
                                </div>

                                <span className="text-xs sm:text-sm font-black text-white tracking-tight leading-tight text-center">
                                    الـمـصـنـع الـسـودانـي الـمـالـيـزي
                                </span>
                                <span className="text-[8.5px] font-bold text-slate-200 tracking-wider mt-0.5 text-center">
                                    للـحـديـد والـصـلـب ومـواد الـبـنـاء
                                </span>
                                <span className="text-[7px] font-mono tracking-wider text-slate-400 uppercase mt-0.5 text-center">
                                    Sudanese Malaysian Steel Factory
                                </span>
                            </div>
                        </div>

                        {/* Left: Document Badge Card */}
                        <div className="flex justify-end text-left">
                            <div className="w-full max-w-[220px] bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 text-right shadow-sm space-y-1 print:p-1.5 print:space-y-0.5 print:rounded-lg print:border-slate-400">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-1 print:pb-0.5">
                                    <span className="text-xs font-bold text-slate-500 print:text-[9px]">المستند:</span>
                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded print:text-[9px] print:px-1.5 print:py-0 ${
                                        viewMode === 'INVOICE'
                                            ? 'bg-blue-600 text-white print:bg-blue-600 print:text-white'
                                            : viewMode === 'DELIVERY'
                                            ? 'bg-amber-600 text-white print:bg-amber-600 print:text-white'
                                            : 'bg-purple-600 text-white print:bg-purple-600 print:text-white'
                                    }`}>
                                        {viewMode === 'INVOICE' ? 'فاتورة مبيعات' : viewMode === 'DELIVERY' ? 'إذن استلام مخزن' : 'عرض سعر'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-0.5 print:text-[9px] print:pt-0">
                                    <span className="font-bold text-slate-600 print:text-[9px]">
                                        {viewMode === 'DELIVERY' ? 'رقم الإذن:' : 'الرقم:'}
                                    </span>
                                    <span className="font-mono text-sm sm:text-base font-black text-slate-950 print:text-xs">
                                        #{sale.invoiceNumber || sale.id}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] pt-0.5 print:text-[8.5px] print:pt-0">
                                    <span className="font-bold text-slate-600">التاريخ:</span>
                                    <span className="font-bold text-slate-800 font-mono">
                                        {new Date(sale.createdAt).toLocaleDateString('en-GB')}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] print:text-[8.5px]">
                                    <span className="font-bold text-slate-600">الوقت:</span>
                                    <span className="font-bold text-slate-700 font-mono" dir="ltr">
                                        {new Date(sale.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 print:text-[8.5px] print:pt-0.5">
                                    <span className="font-bold text-slate-600">الحالة:</span>
                                    <span className={`font-black text-[10px] px-1.5 py-0.5 rounded print:text-[8px] print:px-1 print:py-0 ${
                                        sale.status === 'PAID'
                                            ? 'text-emerald-700 bg-emerald-100 border border-emerald-300 print:bg-emerald-600 print:text-white'
                                            : sale.status === 'CREDIT'
                                            ? 'text-red-700 bg-red-100 border border-red-300 print:bg-red-600 print:text-white'
                                            : 'text-amber-700 bg-amber-100 border border-amber-300 print:bg-amber-600 print:text-white'
                                    }`}>
                                        {sale.status === 'PAID' ? 'خالص السداد' : sale.status === 'CREDIT' ? 'آجل / غير خالص' : 'مسودة'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Client & Metadata Grid */}
                    <div className={`relative z-10 grid grid-cols-1 ${isForeignCurrency ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 mb-4 text-xs print:gap-1.5 print:mb-1.5 print:text-[10px]`}>
                        {/* Box 1: Customer */}
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg print:p-1.5 print:rounded-md">
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5 print:text-[9px] print:mb-0">العميل المكرم:</span>
                            <span className="font-black text-slate-950 text-sm block truncate print:text-xs">
                                {sale.customer || 'عميل نقدي'}
                            </span>
                        </div>

                        {/* Box 2: Dispatch Location */}
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg print:p-1.5 print:rounded-md">
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5 print:text-[9px] print:mb-0">موقع الاستلام والصرف:</span>
                            <span className={`font-black block truncate print:text-xs ${
                                (sale.dispatchBranchId && sale.dispatchBranchId !== sale.branchId)
                                    ? 'text-amber-800'
                                    : 'text-slate-800'
                            }`}>
                                {sale.dispatchBranch?.name ? sale.dispatchBranch.name : 'مخازن الفرع الرئيسي'}
                            </span>
                            {(sale.dispatchBranchId && sale.dispatchBranchId !== sale.branchId) && (
                                <span className="text-[9px] font-black text-amber-700 block print:text-[8px]">
                                    ⚠️ توجيه استلام من فرع آخر
                                </span>
                            )}
                        </div>

                        {/* Box 3: Currency & Rate - ONLY SHOWN IF NOT SDG */}
                        {isForeignCurrency && (
                            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg print:p-1.5 print:rounded-md">
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5 print:text-[9px] print:mb-0">العملة وسعر الصرف:</span>
                                <span className="font-black text-slate-800 block print:text-xs">
                                    {sale.currency === 'USD' ? 'دولار ($ USD)' : 'درهم (AED د.إ)'}
                                </span>
                                <span className="text-[10px] text-indigo-700 font-bold block mt-0.5 print:text-[8.5px] print:mt-0">
                                    الصرف: {sale.currencyRate?.toLocaleString()} ج.س
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Cross-Branch Alert Banner (If Dispatched from another branch) */}
                    {sale.dispatchBranch && sale.dispatchBranchId && sale.dispatchBranchId !== sale.branchId && (
                        <div className="relative z-10 mb-3 p-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 font-bold text-xs flex items-center gap-2 print:mb-1 print:p-1.5 print:text-[9px] print:rounded-lg">
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
                    <div className="relative z-10 mb-4 print:mb-1.5">
                        {/* Mode A: FINANCIAL INVOICE & QUOTATION (No Quantity in Words column) */}
                        {(viewMode === 'INVOICE' || viewMode === 'QUOTATION') && (
                            <table className="w-full text-right border-collapse border border-slate-800">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-xs print:text-[10px] print:bg-slate-900">
                                        <th className="py-2 px-1.5 w-[4%] text-center font-black border border-slate-700 print:py-1 print:px-0.5">#</th>
                                        <th className="py-2 px-2.5 w-[38%] text-right font-black border border-slate-700 print:py-1 print:px-1.5">بيان الصنف والمنتج</th>
                                        <th className="py-2 px-1.5 w-[10%] text-center font-black border border-slate-700 print:py-1 print:px-1">السماكة</th>
                                        <th className="py-2 px-1.5 w-[10%] text-center font-black border border-slate-700 print:py-1 print:px-1">النوع</th>
                                        <th className="py-2 px-1.5 w-[10%] text-center font-black border border-slate-700 print:py-1 print:px-1">الكمية</th>
                                        <th className="py-2 px-1.5 w-[14%] text-center font-black border border-slate-700 print:py-1 print:px-1">
                                            السعر الإفرادي (ج.س)
                                        </th>
                                        <th className="py-2 px-1.5 w-[14%] text-center font-black border border-slate-700 print:py-1 print:px-1">
                                            سعر الكمية (ج.س)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-slate-300 print:text-[10px]">
                                    {sale.items.map((item, index) => {
                                        const itemUnitPriceCurrency = isForeignCurrency ? item.price / currencyRate : item.price
                                        const itemTotalPriceCurrency = isForeignCurrency ? (item.price * item.quantity) / currencyRate : item.price * item.quantity

                                        return (
                                            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                                <td className="py-1.5 px-2 text-center font-bold text-slate-600 border border-slate-300 print:py-0.5 print:px-1">
                                                    {index + 1}
                                                </td>
                                                <td className="py-1.5 px-3 font-black text-slate-900 border border-slate-300 text-sm leading-tight print:py-0.5 print:px-1.5 print:text-xs">
                                                    {item.product.name}
                                                </td>
                                                <td className="py-1.5 px-2 text-center font-bold font-mono text-slate-800 border border-slate-300 print:py-0.5 print:px-1">
                                                    {item.product.thickness ? `${item.product.thickness} مم` : '-'}
                                                </td>
                                                <td className="py-1.5 px-2 text-center font-bold text-slate-700 border border-slate-300 print:py-0.5 print:px-1">
                                                    {item.product.type || '-'}
                                                </td>
                                                <td className="py-1.5 px-2 text-center font-black font-mono text-slate-950 text-sm border border-slate-300 print:py-0.5 print:px-1 print:text-xs">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-1.5 px-2 text-center border border-slate-300 print:py-0.5 print:px-1">
                                                    <span className="font-mono font-bold text-slate-900 text-xs print:text-[10px]">
                                                        {item.price.toLocaleString()}
                                                    </span>
                                                    {isForeignCurrency && (
                                                        <span className="text-[10px] text-slate-500 block font-mono print:text-[8px]">
                                                            ({itemUnitPriceCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {shortCurrencySymbol})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-1.5 px-2 text-center border border-slate-300 print:py-0.5 print:px-1">
                                                    <span className="font-mono font-black text-slate-950 text-xs print:text-[10px]">
                                                        {(item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                    {isForeignCurrency && (
                                                        <span className="text-[10px] text-slate-500 block font-mono print:text-[8px]">
                                                            ({itemTotalPriceCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {shortCurrencySymbol})
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}

                        {/* Mode B: WAREHOUSE DELIVERY NOTE (Keeps Quantity in Words for storekeeper security) */}
                        {viewMode === 'DELIVERY' && (
                            <table className="w-full text-right border-collapse border border-slate-800">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-xs print:text-[10px]">
                                        <th className="py-2.5 px-2 w-[6%] text-center font-black border border-slate-700 print:py-1 print:px-1">م</th>
                                        <th className="py-2.5 px-3 w-[36%] text-right font-black border border-slate-700 print:py-1 print:px-1.5">بيان الصنف والمواصفات</th>
                                        <th className="py-2.5 px-2 w-[12%] text-center font-black border border-slate-700 print:py-1 print:px-1">السماكة</th>
                                        <th className="py-2.5 px-2 w-[12%] text-center font-black border border-slate-700 print:py-1 print:px-1">النوع</th>
                                        <th className="py-2.5 px-2 w-[12%] text-center font-black border border-slate-700 print:py-1 print:px-1">الكمية رقماً</th>
                                        <th className="py-2.5 px-2 w-[22%] text-center font-black border border-slate-700 print:py-1 print:px-1">الكمية كتابة بالأحرف</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-slate-300 print:text-[10px]">
                                    {sale.items.map((item, index) => (
                                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                            <td className="py-2 px-2 text-center font-bold text-slate-600 border border-slate-300 print:py-0.5 print:px-1">
                                                {index + 1}
                                            </td>
                                            <td className="py-2 px-3 font-black text-slate-900 border border-slate-300 text-sm leading-tight print:py-0.5 print:px-1.5 print:text-xs">
                                                {item.product.name}
                                            </td>
                                            <td className="py-2 px-2 text-center font-bold font-mono text-slate-800 border border-slate-300 text-sm print:py-0.5 print:px-1 print:text-xs">
                                                {item.product.thickness ? `${item.product.thickness} مم` : '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-bold text-slate-700 border border-slate-300 print:py-0.5 print:px-1">
                                                {item.product.type || '-'}
                                            </td>
                                            <td className="py-2 px-2 text-center font-black font-mono text-slate-950 text-base border border-slate-300 print:py-0.5 print:px-1 print:text-xs">
                                                {item.quantity}
                                            </td>
                                            <td className="py-2 px-2 text-center font-black text-slate-900 border border-slate-300 text-xs leading-snug print:py-0.5 print:px-1 print:text-[9.5px]">
                                                {numberToArabicWords(item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* 4.5. Payment Details & Bank Transfer Notifications (أسفل جدول بيانات الأصناف مباشرة) */}
                    {(viewMode === 'INVOICE' || viewMode === 'QUOTATION') && (
                        <div className="relative z-10 mb-4 bg-slate-50 border-2 border-slate-300 rounded-xl p-3 shadow-xs print:mb-1.5 print:p-1.5 print:border print:rounded-lg">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-200 print:pb-1 print:mb-1 print:gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">💳</span>
                                    <span className="text-xs font-black text-slate-800">بيانات وطريقة السداد:</span>
                                    <span className={`text-xs font-black px-2.5 py-0.5 rounded ${
                                        sale.paymentMethod === 'CASH'
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : sale.paymentMethod === 'BANK'
                                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                            : sale.paymentMethod === 'CHEQUE'
                                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}>
                                        {sale.paymentMethod === 'CASH' && 'نقداً (كاش)'}
                                        {sale.paymentMethod === 'BANK' && (bankTransfersList.length > 1 ? `تحويلات بنكية (${bankTransfersList.length} إشعارات)` : 'تحويل بنكي')}
                                        {sale.paymentMethod === 'CHEQUE' && 'شيك مصرفي'}
                                        {sale.paymentMethod === 'MULTIPLE' && 'سداد مجزأ (نقداً / بنك / شيك)'}
                                    </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-600">
                                    حالة الفاتورة: <strong className={sale.status === 'PAID' ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}>
                                        {sale.status === 'PAID' ? 'خالص السداد بالكامل' : `متبقي آجل: ${(sale.remainingAmount || 0).toLocaleString()} ج.س`}
                                    </strong>
                                </div>
                            </div>

                            {/* Detailed Payment Display in Table Form */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse border border-slate-300 bg-white">
                                    <thead>
                                        <tr className="bg-slate-800 text-white text-[11px] print:text-[9px] print:bg-slate-800">
                                            <th className="py-1.5 px-1 text-center font-black border border-slate-500 w-[4%] print:py-0.5 print:px-0.5">#</th>
                                            <th className="py-1.5 px-2 text-right font-black border border-slate-500 w-[22%] print:py-0.5 print:px-1.5">طريقة السداد / البنك</th>
                                            <th className="py-1.5 px-1.5 text-center font-black border border-slate-500 w-[16%] print:py-0.5 print:px-1">رقم الإشعار / الشيك</th>
                                            <th className="py-1.5 px-1.5 text-center font-black border border-slate-500 w-[18%] print:py-0.5 print:px-1">المحول منه (المرسل / الساحب)</th>
                                            <th className="py-1.5 px-1.5 text-center font-black border border-slate-500 w-[18%] print:py-0.5 print:px-1">المحول لحسابه (المستلم / المستفيد)</th>
                                            <th className="py-1.5 px-2 text-center font-black border border-slate-500 w-[22%] print:py-0.5 print:px-1.5">المبلغ المدفوع</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs divide-y divide-slate-200">
                                        {paymentRows.length > 0 ? (
                                            paymentRows.map((row, rIdx) => (
                                                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                                    <td className="py-1.5 px-2 text-center font-bold text-slate-600 border border-slate-300 print:py-0.5 print:px-1">
                                                        {rIdx + 1}
                                                    </td>
                                                    <td className="py-1.5 px-2.5 font-black text-slate-900 border border-slate-300 print:py-0.5 print:px-1.5 print:text-[9.5px]">
                                                        {row.type}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-800 border border-slate-300 text-xs print:py-0.5 print:px-1 print:text-[9px]">
                                                        {row.refNumber !== '-' ? (
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tracking-wider print:px-1 print:py-0">
                                                                {row.refNumber}
                                                            </span>
                                                        ) : <span className="text-slate-400">-</span>}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-center font-bold text-slate-700 border border-slate-300 print:py-0.5 print:px-1 print:text-[9px]">
                                                        {row.sender !== '-' ? (
                                                            <span className="text-slate-900 font-bold">{row.sender}</span>
                                                        ) : <span className="text-slate-400">-</span>}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-center font-bold border border-slate-300 print:py-0.5 print:px-1">
                                                        {row.recipient !== '-' ? (
                                                            <span className="text-blue-950 font-black bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block print:px-1 print:py-0 print:text-[9px]">
                                                                {row.recipient}
                                                            </span>
                                                        ) : <span className="text-slate-400">-</span>}
                                                    </td>
                                                    <td className="py-1.5 px-2.5 text-center font-mono font-black text-slate-950 border border-slate-300 print:py-0.5 print:px-1.5 print:text-[9.5px]">
                                                        <div>{row.amount.toLocaleString()} ج.س</div>
                                                        {isForeignCurrency && (
                                                            <div className="text-[9px] text-slate-500 font-normal print:text-[8px]">
                                                                ({(row.amount / currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {shortCurrencySymbol})
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-3 px-3 text-center text-slate-500 font-bold border border-slate-300">
                                                    {sale.status === 'QUOTATION' ? 'عرض سعر (يتم تحديد طريقة السداد عند اعتماد الفاتورة)' : 'آجل بالكامل (لم يتم تسجيل دفعات)'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        {paymentRows.length > 1 && (
                                            <tr className="bg-slate-100 font-black text-xs">
                                                <td colSpan={5} className="py-1.5 px-3 text-left font-black text-slate-800 border border-slate-300">
                                                    إجمالي المبالغ المسددة:
                                                </td>
                                                <td className="py-1.5 px-2.5 text-center font-mono font-black text-blue-950 border border-slate-300">
                                                    <div>{paymentRows.reduce((sum, r) => sum + r.amount, 0).toLocaleString()} ج.س</div>
                                                    {isForeignCurrency && (
                                                        <div className="text-[9px] text-slate-500 font-normal">
                                                            ({(paymentRows.reduce((sum, r) => sum + r.amount, 0) / currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {shortCurrencySymbol})
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                        {sale.status === 'CREDIT' && (sale.remainingAmount || 0) > 0 && (
                                            <tr className="bg-amber-50/80 font-black text-xs text-red-700">
                                                <td colSpan={5} className="py-1.5 px-3 text-left font-black border border-slate-300">
                                                    المتبقي آجل (غير مسدد):
                                                </td>
                                                <td className="py-1.5 px-2.5 text-center font-mono font-black text-red-700 border border-slate-300">
                                                    <div>{(sale.remainingAmount || 0).toLocaleString()} ج.س</div>
                                                    {isForeignCurrency && (
                                                        <div className="text-[9px] text-red-600/80 font-normal">
                                                            ({((sale.remainingAmount || 0) / currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {shortCurrencySymbol})
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {viewMode === 'DELIVERY' && (
                        <div className="relative z-10 mb-4 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs flex flex-wrap items-center justify-between gap-2 print:mb-1.5 print:p-1.5 print:text-[9.5px] print:rounded-lg">
                            <span className="font-bold text-slate-700">حالة السداد المخزني: <strong className={sale.status === 'PAID' ? 'text-emerald-700 font-black' : 'text-amber-700 font-black'}>{sale.status === 'PAID' ? 'خالص السداد (معتمد للصرف والتسليم)' : 'آجل / غير خالص'}</strong></span>
                            {bankTransfersList.length > 0 && (
                                <span className="text-[11px] font-mono font-bold text-slate-600">
                                    إشعارات البنك: {bankTransfersList.map(t => `${t.bank} (${t.ref || '-'})${t.recipient ? ` [لحساب: ${t.recipient}]` : ''}`).join(' | ')}
                                </span>
                            )}
                        </div>
                    )}

                    {/* 5. Financial Totals & Tafqeet Section (Shown for INVOICE & QUOTATION) */}
                    {(viewMode === 'INVOICE' || viewMode === 'QUOTATION') && (
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:gap-2 print:mb-1.5">
                            {/* Right: Tafqeet & Payment Details */}
                            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 flex flex-col justify-between print:p-1.5 print:rounded-lg">
                                <div>
                                    <span className="text-[11px] font-black text-slate-500 block mb-1 print:text-[9px] print:mb-0.5">المبلغ كتابة (المطلوب سداده):</span>
                                    <div className="text-sm font-black text-slate-900 leading-relaxed bg-white border border-slate-200 p-2.5 rounded-lg shadow-inner print:p-1.5 print:text-[10px] print:leading-tight print:rounded-md">
                                        {isForeignCurrency ? (
                                            <div className="space-y-1">
                                                <div className="text-indigo-950">
                                                    {tafqeetCurrency(finalTotalCurrency, sale.currency || 'SDG')}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-bold pt-1 border-t border-slate-100">
                                                    يعادل بالجنيه: {tafqeetCurrency(Math.round(finalTotalSDG), 'SDG')}
                                                </div>
                                            </div>
                                        ) : (
                                            tafqeetCurrency(Math.round(finalTotalSDG), 'SDG')
                                        )}
                                    </div>
                                </div>

                                {isForeignCurrency && (
                                    <div className="mt-2 text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 p-2 rounded-lg flex justify-between items-center print:mt-1 print:p-1 print:text-[9px] print:rounded-md">
                                        <span>القيمة بعملة الفاتورة ({sale.currency}):</span>
                                        <span className="font-mono text-sm font-black">
                                            {finalTotalCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                                        </span>
                                    </div>
                                )}

                                {sale.status === 'CREDIT' && (
                                    <div className="mt-2 text-xs grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 print:mt-1 print:pt-1 print:text-[9px]">
                                        <div className="text-slate-700">
                                            <span>المدفوع:</span>{' '}
                                            <strong className="text-emerald-700 font-mono">
                                                {isForeignCurrency
                                                    ? `${((sale.paidAmount || 0) / currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${shortCurrencySymbol}`
                                                    : `${(sale.paidAmount || 0).toLocaleString()} ج.س`}
                                            </strong>
                                            {isForeignCurrency && (
                                                <span className="text-[10px] text-slate-500 block font-mono">
                                                    ({(sale.paidAmount || 0).toLocaleString()} ج.س)
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-slate-700 text-left">
                                            <span>المتبقي:</span>{' '}
                                            <strong className="text-red-700 font-mono">
                                                {isForeignCurrency
                                                    ? `${((sale.remainingAmount || 0) / currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${shortCurrencySymbol}`
                                                    : `${(sale.remainingAmount || 0).toLocaleString()} ج.س`}
                                            </strong>
                                            {isForeignCurrency && (
                                                <span className="text-[10px] text-red-500 block font-mono">
                                                    ({(sale.remainingAmount || 0).toLocaleString()} ج.س)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Left: Summary Table */}
                            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 print:p-1.5 print:rounded-lg">
                                <table className="w-full text-xs print:text-[10px]">
                                    <tbody className="divide-y divide-slate-200">
                                        <tr>
                                            <td className="py-1.5 text-slate-600 font-bold">إجمالي الأصناف (المجموع الفرعي):</td>
                                            <td className="py-1.5 text-left font-mono font-bold text-slate-800 text-sm">
                                                {isForeignCurrency ? (
                                                    <div>
                                                        <span className="text-indigo-950 font-black">{subtotalCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> <span className="text-xs font-sans font-bold text-indigo-700">{shortCurrencySymbol}</span>
                                                        <span className="text-[10px] text-slate-500 font-sans block">
                                                            (يعادل: {subtotalSDG.toLocaleString()} ج.س)
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {subtotalSDG.toLocaleString()} <span className="text-[10px] font-sans">ج.س</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>

                                        {sale.discount > 0 && (
                                            <tr>
                                                <td className="py-1.5 text-red-600 font-bold">الخصم الممنوح:</td>
                                                <td className="py-1.5 text-left font-mono font-bold text-red-600 text-sm">
                                                    {isForeignCurrency ? (
                                                        <div>
                                                            <span>- {discountCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> <span className="text-xs font-sans font-bold">{shortCurrencySymbol}</span>
                                                            <span className="text-[10px] text-red-400 font-sans block">
                                                                (-{discountSDG.toLocaleString()} ج.س)
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            -{discountSDG.toLocaleString()} <span className="text-[10px] font-sans">ج.س</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}

                                        {settings?.vatRate > 0 && (
                                            <tr>
                                                <td className="py-1.5 text-slate-600 font-bold">ضريبة القيمة المضافة ({settings.vatRate}%):</td>
                                                <td className="py-1.5 text-left font-mono font-bold text-slate-800">
                                                    {isForeignCurrency ? (
                                                        <div>
                                                            <span>+ {vatAmountCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> <span className="text-xs font-sans">{shortCurrencySymbol}</span>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            +{vatAmountSDG.toLocaleString()} <span className="text-[10px] font-sans">ج.س</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}

                                        <tr className="border-t-2 border-slate-900 bg-slate-900 text-white rounded-lg print:bg-slate-900 print:text-white">
                                            <td className="py-2 px-2.5 text-white font-black text-sm sm:text-base print:py-1 print:px-2 print:text-xs">
                                                الصافي النهائي المطلوب {isForeignCurrency ? `(${currencyCode})` : ''}:
                                            </td>
                                            <td className="py-2 px-2.5 text-left font-mono font-black text-white text-base sm:text-xl print:py-1 print:px-2 print:text-sm">
                                                {isForeignCurrency ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-indigo-950">
                                                            <span>{finalTotalCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> <span className="text-sm font-sans font-black text-indigo-700">{currencySymbol}</span>
                                                        </div>
                                                        <div className="text-[11px] font-sans font-bold text-slate-600">
                                                            ما يعادل: <strong className="font-mono text-slate-900">{finalTotalSDG.toLocaleString()} ج.س</strong>
                                                        </div>
                                                        <div className="text-[10px] font-sans font-medium text-slate-500">
                                                            سعر الصرف المعتمد: 1 {currencyCode} = {currencyRate.toLocaleString()} ج.س
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {finalTotalSDG.toLocaleString()} <span className="text-xs font-sans text-slate-600">ج.س</span>
                                                    </div>
                                                )}
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
                        <div className="relative z-10 pt-4 border-t-2 border-slate-800 print:pt-1 print:border-t">
                            <div className="grid grid-cols-4 gap-2 text-center text-xs print:gap-1.5 print:text-[9px]">
                                <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between h-24 print:h-11 print:p-1 print:rounded-md">
                                    <span className="font-bold text-slate-700 print:text-[9px]">توقيع المستلم / العميل</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1 print:mb-0"></div>
                                </div>

                                <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between h-24 print:h-11 print:p-1 print:rounded-md">
                                    <span className="font-bold text-slate-700 print:text-[9px]">أمين المستودع / الصرف</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1 print:mb-0"></div>
                                </div>

                                <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between h-24 print:h-11 print:p-1 print:rounded-md">
                                    <span className="font-bold text-slate-700 print:text-[9px]">المحاسب / المبيعات</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1 print:mb-0"></div>
                                </div>

                                <div className="border-2 border-dashed border-slate-400 rounded-xl p-2.5 flex flex-col items-center justify-center h-24 bg-slate-50/30 print:h-11 print:p-1 print:rounded-md">
                                    <span className="text-[10px] font-bold text-slate-400 print:text-[8px]">مكان الختم الرسمي</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Variant B: For Warehouse Delivery Note */}
                    {viewMode === 'DELIVERY' && (
                        <div className="relative z-10 pt-4 border-t-2 border-slate-800 space-y-4 print:pt-1 print:space-y-1.5 print:border-t">
                            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs print:p-1.5 print:text-[9.5px] print:rounded-md">
                                <p className="font-bold text-slate-800 mb-2 print:mb-1">
                                    إقرار استلام: أقر أنا الموقع أدناه باستلام كامل الأصناف والكميات المذكورة بعاليه من مستودعات المصنع بحالة جيدة وسليمة ومطابقة للمواصفات المطلوبة.
                                </p>
                                <div className="grid grid-cols-3 gap-3 text-slate-700 pt-1 print:pt-0.5 print:gap-1.5 print:text-[9px]">
                                    <div>اسم المستلم / السائق: .......................................</div>
                                    <div>رقم الهاتف / الإثبات: .......................................</div>
                                    <div>رقم مركبة الشحن (العربة): .......................................</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center text-xs print:gap-1.5 print:text-[9px]">
                                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-24 print:h-11 print:p-1 print:rounded-md">
                                    <span className="font-bold text-slate-700 print:text-[9px]">توقيع المستلم / السائق</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1 print:mb-0"></div>
                                </div>

                                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-24 print:h-11 print:p-1 print:rounded-md">
                                    <span className="font-bold text-slate-700 print:text-[9px]">أمين المستودع ومسؤول الصرف</span>
                                    <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1 print:mb-0"></div>
                                </div>

                                <div className="border-2 border-dashed border-slate-400 rounded-xl p-3 flex flex-col items-center justify-center h-24 bg-slate-50/30 print:h-11 print:p-1 print:rounded-md">
                                    <span className="text-[10px] font-bold text-slate-400 print:text-[8px]">ختم أمن البوابة وتصريح الخروج</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. Footer Note */}
                    <div className="relative z-10 mt-4 pt-2 border-t border-slate-300 text-center text-[10px] text-slate-600 font-bold space-y-0.5 print:mt-1 print:pt-0.5 print:text-[8px] print:space-y-0">
                        <p>
                            {viewMode === 'DELIVERY'
                                ? 'يجب إبراز هذا الإذن المعتمد لأمن البوابة عند الخروج من حرم المصنع.'
                                : viewMode === 'QUOTATION'
                                ? 'هذا العرض مبدئي وسعره ساري لمدة محددة تبعاً لتقلبات أسعار الصرف وخامات الحديد في السوق.'
                                : 'البضاعة التي تخرج من حرم المصنع لا ترد ولا تستبدل إلا بموافقة الإدارة ووفقاً لللوائح المعتمدة.'}
                        </p>
                        <p className="text-slate-500 font-bold">
                            المصنع السوداني الماليزي للمنتجات الحديدية | الموقع: سوق عطبرة - السينما الوطنية | هاتف: 0120021085
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
