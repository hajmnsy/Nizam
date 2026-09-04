'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Eye, FileText, CheckCircle, Clock, ChevronRight, ChevronLeft, CreditCard, X, Loader2, Printer, Edit } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Sale {
    id: number
    invoiceNumber?: number
    customer: string
    total: number
    paidAmount?: number
    remainingAmount?: number
    status: string
    createdAt: string
    items: any[]
}

export default function SalesList() {
    // Default to today in YYYY-MM-DD local format
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'ALL' | 'PAID' | 'CREDIT' | 'QUOTATION'>('PAID')
    const [date, setDate] = useState<string>(getTodayLocal())
    const [customerFilter, setCustomerFilter] = useState<string>('')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const cust = params.get('customer')
        if (cust) {
            setCustomerFilter(cust)
            setDate('') // Clear date filter to show all invoices for the customer
            setTab('ALL') // Switch to ALL tab to show all their invoices regardless of status
        }
    }, [])
    
    // Quick Payment State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [paymentAmount, setPaymentAmount] = useState<string>('')
    const [submittingPayment, setSubmittingPayment] = useState(false)

    const changeDateByDays = (days: number) => {
        if (!date) {
            setDate(getTodayLocal());
            return;
        }
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + days);
        const newDateStr = currentDate.toISOString().split('T')[0];
        setDate(newDateStr);
    }

    const refreshSales = () => {
        setLoading(true)
        const dateQuery = date ? `&date=${date}` : ''
        const customerQuery = customerFilter ? `&customer=${encodeURIComponent(customerFilter)}` : ''
        fetch(`/api/sales?status=${tab}${dateQuery}${customerQuery}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setSales(data)
                setLoading(false)
            })
            .catch(console.error)
    }

    useEffect(() => {
        refreshSales()
    }, [tab, date, customerFilter])

    const handleQuickPayment = async () => {
        if (!selectedSale || !paymentAmount || isNaN(parseFloat(paymentAmount))) return
        setSubmittingPayment(true)

        try {
            const res = await fetch(`/api/sales/${selectedSale.id}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: paymentAmount })
            })

            if (res.ok) {
                setPaymentModalOpen(false)
                setPaymentAmount('')
                refreshSales()
            } else {
                alert('حدث خطأ أثناء تسجيل الدفعة')
            }
        } catch (error) {
            console.error(error)
            alert('تعذر الاتصال بالخادم')
        } finally {
            setSubmittingPayment(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-7xl animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {tab === 'ALL' ? <FileText className="text-slate-500" /> : tab === 'PAID' ? <CheckCircle className="text-emerald-500" /> : tab === 'CREDIT' ? <Clock className="text-amber-500" /> : <FileText className="text-blue-500" />}
                            {tab === 'ALL' ? 'كل المبيعات' : tab === 'PAID' ? 'فواتير المبيعات' : tab === 'CREDIT' ? 'مبيعات آجلة' : 'عروض الأسعار'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {tab === 'ALL' ? 'جميع فواتير وعروض أسعار المبيعات' : tab === 'PAID' ? 'سجل عمليات البيع المكتملة الدفع' : tab === 'CREDIT' ? 'مبيعات غير مسددة بالكامل' : 'المسودات وعروض الأسعار المحفوظة'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/sales/daily">
                            <Button variant="outline" className="flex items-center gap-2 py-3 px-6 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
                                <FileText size={20} />
                                تقرير اليومية
                            </Button>
                        </Link>
                        <Link href="/sales/new">
                            <Button className="flex items-center gap-2 py-3 px-6 shadow-lg shadow-blue-200">
                                <Plus size={20} />
                                فاتورة جديدة
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Tabs & Filters */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 border-b border-gray-200">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab('ALL')}
                            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${tab === 'ALL'
                                ? 'border-slate-500 text-slate-700 bg-slate-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            الكل
                        </button>
                        <button
                            onClick={() => setTab('PAID')}
                            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${tab === 'PAID'
                                ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            الفواتير المسددة
                        </button>
                        <button
                            onClick={() => setTab('CREDIT')}
                            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${tab === 'CREDIT'
                                ? 'border-amber-500 text-amber-700 bg-amber-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            المبيعات الآجلة
                        </button>
                        <button
                            onClick={() => setTab('QUOTATION')}
                            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${tab === 'QUOTATION'
                                ? 'border-blue-500 text-blue-700 bg-blue-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            عروض الأسعار
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2 sm:mb-0 sm:pb-2">
                        <span className="text-sm font-bold text-slate-600 font-sans hidden md:inline">تاريخ العرض:</span>
                        
                        <div className="flex items-center bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
                            <button
                                onClick={() => changeDateByDays(1)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 transition-colors border-l border-slate-200"
                                title="اليوم التالى"
                            >
                                <ChevronRight size={16} />
                            </button>
                            
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="border-none px-2 py-1.5 text-sm font-bold text-slate-800 outline-none w-32 bg-transparent"
                            />
                            
                            <button
                                onClick={() => changeDateByDays(-1)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 transition-colors border-r border-slate-200"
                                title="اليوم السابق"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => setDate('')}
                            className={`text-xs px-2 py-1.5 rounded-lg border font-bold transition-all ${date === '' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300'}`}
                        >
                            الكل
                        </button>
                    </div>
                </div>

                {customerFilter && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-6 flex items-center justify-between shadow-sm">
                        <span className="font-bold flex items-center gap-2">
                            <CheckCircle size={18} className="text-emerald-500" /> 
                            يتم عرض نتائج البحث الخاصة بالعميل: <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{customerFilter}</span>
                        </span>
                        <button 
                            onClick={() => {
                                setCustomerFilter('')
                                setDate(getTodayLocal())
                                // Remove ?customer from url
                                window.history.replaceState({}, '', '/sales')
                            }} 
                            className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-full transition-colors"
                            title="إلغاء الفلتر"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                <Card className="overflow-hidden border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-4">{tab === 'QUOTATION' ? 'الرمز' : 'رقم الفاتورة'}</th>
                                    <th className="p-4">العميل</th>
                                    <th className="p-4">التاريخ</th>
                                    <th className="p-4">الإجمالي</th>
                                    <th className="p-4">تفاصيل الأصناف</th>
                                    <th className="p-4">الحالة</th>
                                    <th className="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                                    </tr>
                                ) : sales.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-400 flex flex-col items-center">
                                            <FileText size={48} className="mb-2 opacity-50" />
                                            لا توجد سجلات لعرضها
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map(sale => (
                                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-slate-700">
                                                {sale.status === 'QUOTATION' ? '-' : `#${sale.invoiceNumber || sale.id}`}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">{sale.customer || 'عميل نقدي'}</td>
                                            <td className="p-4 text-gray-600 text-sm">
                                                {new Date(sale.createdAt).toLocaleDateString('ar-SD')}
                                                <br />
                                                <span className="text-xs text-gray-400">
                                                    {new Date(sale.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{sale.total.toLocaleString()} ج.س</div>
                                                {(sale as any).currency && (sale as any).currency !== 'SDG' && (
                                                    <span className="text-[11px] font-mono font-bold text-emerald-700 block">
                                                        {((sale.total / ((sale as any).currencyRate || 1))).toLocaleString(undefined, { maximumFractionDigits: 2 })} {(sale as any).currency}
                                                    </span>
                                                )}
                                                {(sale as any).paymentMethod && (sale as any).paymentMethod !== 'CASH' && (
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold mt-0.5 inline-block border border-slate-200">
                                                        {(sale as any).paymentMethod === 'BANK' ? `بنك: ${(sale as any).bankName || 'تحويل'}` : (sale as any).paymentMethod === 'CHEQUE' ? `شيك #${(sale as any).chequeNumber || ''}` : 'مجزأ'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 max-w-[250px]">
                                                    {sale.items.map((item: any, i: number) => (
                                                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 w-fit whitespace-normal text-right leading-tight">
                                                            <span className="font-bold text-blue-600 text-sm">{item.quantity}</span> × {item.product?.name || 'محذوف'} {item.product?.thickness ? `(${item.product.thickness}mm)` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {sale.status === 'PAID' ? (
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                        <CheckCircle size={12} /> مسددة
                                                    </span>
                                                ) : sale.status === 'CREDIT' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                            <Clock size={12} /> آجلة
                                                        </span>
                                                        <span className="text-xs text-red-500 font-bold whitespace-nowrap">الباقي: {sale.remainingAmount?.toLocaleString() || 0}</span>
                                                    </div>
                                                ) : (
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                        <FileText size={12} /> عرض سعر
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 flex gap-2 justify-end">
                                                {sale.status === 'CREDIT' && (
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => {
                                                            setSelectedSale(sale)
                                                            setPaymentAmount(sale.remainingAmount?.toString() || '')
                                                            setPaymentModalOpen(true)
                                                        }}
                                                        className="px-3 py-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold"
                                                    >
                                                        <CreditCard size={14} className="ml-1" />
                                                        تسديد
                                                    </Button>
                                                )}
                                                <Link href={`/sales/${sale.id}`}>
                                                    <Button variant="outline" className="px-2 py-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 font-bold" title="عرض التفاصيل">
                                                        <Eye size={14} className="ml-1" />
                                                        عرض
                                                    </Button>
                                                </Link>
                                                <Link href={`/sales/${sale.id}/edit`}>
                                                    <Button variant="outline" className="px-2 py-1 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold" title="تعديل الفاتورة">
                                                        <Edit size={14} className="ml-1" />
                                                        تعديل
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => window.open(`/sales/${sale.id}?print=true`, '_blank')}
                                                    className="px-2 py-1 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold"
                                                    title="طباعة الإيصال"
                                                >
                                                    <Printer size={14} className="ml-1" />
                                                    طباعة
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Quick Payment Modal */}
            {paymentModalOpen && selectedSale && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-slide-up">
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-black text-slate-800 text-lg sm:text-xl flex items-center gap-2">
                                <CreditCard className="text-amber-500" size={24} />
                                تسديد دفعة جديدة
                            </h3>
                            <button
                                onClick={() => setPaymentModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                <div className="text-sm font-bold text-slate-700 flex justify-between mb-2">
                                    <span>الفاتورة:</span>
                                    <span>#{selectedSale.invoiceNumber || selectedSale.id}</span>
                                </div>
                                <div className="text-sm font-bold text-slate-700 flex justify-between mb-2">
                                    <span>العميل:</span>
                                    <span>{selectedSale.customer || 'عميل نقدي'}</span>
                                </div>
                                <div className="text-sm font-bold text-slate-700 flex justify-between mb-2">
                                    <span>الإجمالي:</span>
                                    <span className="text-blue-600">{selectedSale.total.toLocaleString()} ج.س</span>
                                </div>
                                <div className="text-sm font-black text-rose-600 flex justify-between pt-2 border-t border-slate-200 mt-2">
                                    <span>الباقي للمطلبة:</span>
                                    <span>{selectedSale.remainingAmount?.toLocaleString()} ج.س</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        المبلغ المدفوع (ج.س) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 text-lg outline-none focus:border-amber-500 transition-all bg-white"
                                        placeholder="0"
                                        min="1"
                                        max={selectedSale.remainingAmount}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleQuickPayment()
                                        }}
                                    />
                                    {parseFloat(paymentAmount) > (selectedSale.remainingAmount || 0) && (
                                        <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1">
                                            المبلغ المدفوع أكبر من الباقي!
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setPaymentModalOpen(false)}
                                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-200 hover:text-slate-800"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleQuickPayment}
                                disabled={submittingPayment || !paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > (selectedSale.remainingAmount || 0)}
                                className="flex-1 py-3 border-transparent"
                            >
                                {submittingPayment ? (
                                    <><Loader2 className="animate-spin ml-2" size={18} /> جاري الحفظ...</>
                                ) : (
                                    <>حفظ الدفعة</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
