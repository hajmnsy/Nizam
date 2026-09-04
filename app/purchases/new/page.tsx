'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
    Plus,
    Trash2,
    Package,
    Save,
    ArrowRight,
    Loader2,
    Calendar,
    Wallet,
    Building2,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface Product {
    id: number
    name: string
    quantity: number
    type?: string
    thickness?: number
    purchasePriceUSD: number
    price: number
    category?: {
        sellingPricePerTonUSD?: number
    }
}

interface PurchaseItem {
    productId: string
    quantity: number
    price: number // price in SDG
    purchasePriceCurrency: number // price in selected currency (e.g. USD / AED)
    sellingPrice: number // selling price in SDG
}

export default function NewPurchase() {
    const router = useRouter()
    
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [supplier, setSupplier] = useState('')
    const [supplierId, setSupplierId] = useState('')
    const [suppliersList, setSuppliersList] = useState<any[]>([])
    const [selectedSupplierObj, setSelectedSupplierObj] = useState<any>(null)
    const [date, setDate] = useState(getTodayLocal())

    // Currency & Exchange Rate
    const [currency, setCurrency] = useState<'SDG' | 'USD' | 'AED' | string>('USD')
    const [currencyRate, setCurrencyRate] = useState<string>('2700') // default or fetch from exchange rate API

    // Payment Method & Bank/Cheque Details
    const [paymentMethod, setPaymentMethod] = useState<'DEPOSIT_DEDUCTION' | 'BANK' | 'CHEQUE' | 'CASH' | 'CREDIT'>('DEPOSIT_DEDUCTION')
    const [bankName, setBankName] = useState('بنك الخرطوم (بنكك)')
    const [customBankName, setCustomBankName] = useState('')
    const [bankRef, setBankRef] = useState('')
    const [chequeNumber, setChequeNumber] = useState('')
    const [chequeBank, setChequeBank] = useState('')
    const [depositDeducted, setDepositDeducted] = useState<string>('')

    const [updateSellingPrices, setUpdateSellingPrices] = useState(true)
    
    const [items, setItems] = useState<PurchaseItem[]>([
        { productId: '', quantity: 1, price: 0, purchasePriceCurrency: 0, sellingPrice: 0 }
    ])

    useEffect(() => {
        Promise.all([
            fetch('/api/products').then(res => res.json()),
            fetch('/api/suppliers').then(res => res.json()),
            fetch('/api/exchange-rate').then(res => res.json())
        ]).then(([productsData, suppliersData, rateData]) => {
            if (Array.isArray(productsData)) setProducts(productsData)
            if (Array.isArray(suppliersData)) setSuppliersList(suppliersData)
            if (rateData && rateData.rate > 0) {
                setCurrencyRate(rateData.rate.toString())
            }
            setLoading(false)
        }).catch(console.error)
    }, [])

    const rateVal = parseFloat(currencyRate) || 1

    const addItem = () => {
        setItems([...items, { productId: '', quantity: 1, price: 0, purchasePriceCurrency: 0, sellingPrice: 0 }])
    }

    const removeItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...items]
        const current = { ...newItems[index], [field]: value }

        if (field === 'productId' && value) {
            const product = products.find(p => p.id.toString() === value)
            if (product) {
                const initialPriceCurr = currency === 'USD' ? (product.purchasePriceUSD || 0) : 0
                current.purchasePriceCurrency = initialPriceCurr
                current.price = currency === 'SDG' ? (product.price || 0) : Math.round(initialPriceCurr * rateVal)
                current.sellingPrice = product.price || Math.round(current.price * 1.15) // suggested 15% margin
            }
        }

        if (field === 'purchasePriceCurrency') {
            const priceCurr = parseFloat(value) || 0
            current.price = currency === 'SDG' ? priceCurr : Math.round(priceCurr * rateVal)
            if (!current.sellingPrice || current.sellingPrice <= current.price) {
                current.sellingPrice = Math.round(current.price * 1.12)
            }
        }

        if (field === 'price') {
            const pSDG = parseFloat(value) || 0
            if (currency !== 'SDG' && rateVal > 0) {
                current.purchasePriceCurrency = parseFloat((pSDG / rateVal).toFixed(2))
            }
        }

        newItems[index] = current
        setItems(newItems)
    }

    // Totals in Currency & in SDG
    const totalInCurrency = items.reduce((sum, item) => sum + ((currency === 'SDG' ? item.price : item.purchasePriceCurrency) * item.quantity), 0)
    const totalInSDG = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Handle supplier selection and check advance deposit balance
    const handleSupplierChange = (id: string) => {
        setSupplierId(id)
        const found = suppliersList.find(s => s.id.toString() === id)
        setSelectedSupplierObj(found || null)
        if (found) {
            setSupplier(found.name)
            // If factory has advance balance in current currency, default to DEPOSIT_DEDUCTION
            const advBalance = found.advanceBalanceByCurrency?.[currency] || 0
            if (advBalance > 0) {
                setPaymentMethod('DEPOSIT_DEDUCTION')
            }
        } else {
            setSupplier('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (items.some(item => !item.productId || item.quantity <= 0)) {
            alert('يرجى التحقق من جميع الأصناف والكميات')
            return
        }

        setSubmitting(true)

        const finalBankName = bankName === 'OTHER' ? customBankName : bankName

        let finalDepositDeducted = 0
        if (paymentMethod === 'DEPOSIT_DEDUCTION') {
            finalDepositDeducted = totalInCurrency
        } else if (depositDeducted) {
            finalDepositDeducted = parseFloat(depositDeducted) || 0
        }

        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceNumber,
                    supplier: supplier || 'مورد عام',
                    supplierId: supplierId || null,
                    currency,
                    currencyRate: rateVal,
                    paymentMethod,
                    bankName: paymentMethod === 'BANK' ? finalBankName : null,
                    bankRef: paymentMethod === 'BANK' ? bankRef : null,
                    chequeNumber: paymentMethod === 'CHEQUE' ? chequeNumber : null,
                    chequeBank: paymentMethod === 'CHEQUE' ? chequeBank : null,
                    depositDeducted: finalDepositDeducted,
                    createdAt: date,
                    items: items.map(it => ({
                        productId: it.productId,
                        quantity: it.quantity,
                        price: it.price, // unit price in SDG
                        purchasePriceCurrency: it.purchasePriceCurrency,
                        sellingPrice: updateSellingPrices ? it.sellingPrice : null
                    }))
                })
            })

            if (res.ok) {
                router.push('/purchases')
            } else {
                const data = await res.json()
                alert(data.error || 'حدث خطأ أثناء حفظ الفاتورة')
                setSubmitting(false)
            }
        } catch (error) {
            console.error(error)
            alert('تعذر الاتصال بالخادم')
            setSubmitting(false)
        }
    }

    if (loading) return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-purple-500" size={48} />
        </main>
    )

    // Current supplier advance balance in selected currency
    const availableAdvance = selectedSupplierObj?.advanceBalanceByCurrency?.[currency] || 0

    return (
        <main className="min-h-screen bg-slate-50 pb-20 font-sans">
            <Navbar />
            <div className="container mx-auto p-4 max-w-6xl animate-fade-in space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/purchases">
                            <button className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-colors shadow-sm">
                                <ArrowRight className="text-slate-600" size={20} />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2">
                                <Package className="text-purple-600" size={30} />
                                <span>فاتورة مشتريات وتوريد شحنة جديدة</span>
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 font-bold mt-1">
                                استلام وتسعير الشحنات، الخصم من ودائع المصانع، واحتساب تكلفة المخزن وسعر البيع
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Factory / Supplier & Advance Deposits Banner */}
                    <Card className="p-5 border border-slate-200 shadow-sm rounded-3xl bg-white space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Building2 size={16} className="text-purple-600" />
                                    <span>المصنع / المورد المسجل:</span>
                                </label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => handleSupplierChange(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-black text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                >
                                    <option value="">-- مورد عام / جديد --</option>
                                    {suppliersList.map(s => (
                                        <option key={s.id} value={s.id}>
                                            🏢 {s.name} {s.company ? `(${s.company})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">اسم المورد (للفاتورة)</label>
                                <input
                                    type="text"
                                    value={supplier}
                                    onChange={e => {
                                        setSupplier(e.target.value)
                                        setSupplierId('')
                                        setSelectedSupplierObj(null)
                                    }}
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 bg-slate-50/70 focus:bg-white outline-none text-sm"
                                    placeholder="مورد عام / مصنع..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">رقم الفاتورة</label>
                                    <input
                                        type="text"
                                        value={invoiceNumber}
                                        onChange={e => setInvoiceNumber(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 bg-slate-50/70 focus:bg-white outline-none text-sm"
                                        placeholder="INV-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5">التاريخ</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 font-bold text-slate-800 bg-slate-50/70 focus:bg-white outline-none text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Advance Deposit Highlight Banner if Supplier is Selected */}
                        {selectedSupplierObj && (
                            <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 animate-fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-md">
                                        <Wallet size={24} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black text-purple-900 block">
                                            أرصدة ودائعنا المسبقة لدى {selectedSupplierObj.name}:
                                        </span>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <span className="bg-white border border-purple-200 px-3 py-1 rounded-xl text-xs font-mono font-black text-emerald-700">
                                                دولار: ${(selectedSupplierObj.advanceBalanceByCurrency?.USD || 0).toLocaleString()}
                                            </span>
                                            <span className="bg-white border border-purple-200 px-3 py-1 rounded-xl text-xs font-mono font-black text-blue-700">
                                                درهم: {(selectedSupplierObj.advanceBalanceByCurrency?.AED || 0).toLocaleString()} د.إ
                                            </span>
                                            <span className="bg-white border border-purple-200 px-3 py-1 rounded-xl text-xs font-mono font-black text-slate-700">
                                                جنيه: {(selectedSupplierObj.advanceBalanceByCurrency?.SDG || 0).toLocaleString()} ج.س
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {availableAdvance > 0 && (
                                    <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                                        <CheckCircle2 size={16} />
                                        <span>متاح رصيد مودع: {availableAdvance.toLocaleString()} {currency === 'USD' ? '$' : currency === 'AED' ? 'د.إ' : 'ج.س'}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Section 2: Currency & Payment Method */}
                    <Card className="p-5 border border-slate-200 shadow-sm rounded-3xl bg-white space-y-4">
                        <h3 className="text-sm font-black text-slate-800 border-b pb-2 flex items-center gap-2">
                            <DollarSign className="text-emerald-600" size={18} />
                            <span>عملة الشراء وطريقة السداد / الخصم:</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">عملة الفاتورة</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-black text-sm bg-slate-50 focus:bg-white outline-none"
                                >
                                    <option value="USD">🇺🇸 دولار أمريكي (USD $)</option>
                                    <option value="AED">🇦🇪 درهم إماراتي (AED د.إ)</option>
                                    <option value="SDG">🇸🇩 جنيه سوداني (SDG ج.س)</option>
                                </select>
                            </div>

                            {currency !== 'SDG' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        سعر الصرف (سعر {currency === 'USD' ? 'الدولار' : 'الدرهم'} مقابل الجنيه)
                                    </label>
                                    <input
                                        type="number"
                                        value={currencyRate}
                                        onChange={(e) => setCurrencyRate(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-black font-mono text-sm text-emerald-700 bg-slate-50 focus:bg-white outline-none"
                                        placeholder="2700"
                                    />
                                </div>
                            )}

                            <div className={currency === 'SDG' ? 'md:col-span-2' : ''}>
                                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد / الخصم</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-black text-sm bg-purple-50 text-purple-900 border-purple-200 focus:bg-white outline-none"
                                >
                                    <option value="DEPOSIT_DEDUCTION">🏦 خصم من رصيدنا المودع مسبقاً لدى المصنع</option>
                                    <option value="BANK">💳 تحويل بنكي من حسابنا في البنك</option>
                                    <option value="CHEQUE">📝 شيك مصرفي</option>
                                    <option value="CASH">💵 كاش (نقداً)</option>
                                    <option value="CREDIT">⏳ آجل (على الحساب)</option>
                                </select>
                            </div>
                        </div>

                        {/* Custom Bank Details Input */}
                        {paymentMethod === 'BANK' && (
                            <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl space-y-3 animate-fade-in">
                                <span className="text-xs font-black text-blue-900 block">تفاصيل التحويل البنكي للمصنع:</span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم البنك المحول منه/إليه</label>
                                        <select
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white text-xs font-bold outline-none"
                                        >
                                            <option value="بنك الخرطوم (بنكك)">بنك الخرطوم (بنكك)</option>
                                            <option value="بنك فيصل الإسلامي">بنك فيصل الإسلامي</option>
                                            <option value="بنك أم درمان الوطني">بنك أم درمان الوطني</option>
                                            <option value="بنك النيل">بنك النيل</option>
                                            <option value="بنك البركة">بنك البركة</option>
                                            <option value="بنك دبي الإسلامي">بنك دبي الإسلامي (الإمارات)</option>
                                            <option value="بنك أبوظبي الأول">بنك أبوظبي الأول (FAB)</option>
                                            <option value="OTHER">بنك آخر (كتابة يدوية)...</option>
                                        </select>
                                    </div>

                                    {bankName === 'OTHER' && (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">اكتب اسم البنك</label>
                                            <input
                                                type="text"
                                                value={customBankName}
                                                onChange={(e) => setCustomBankName(e.target.value)}
                                                placeholder="اسم البنك..."
                                                className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white text-xs font-bold outline-none"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الإشعار / المرجع (Reference No) *</label>
                                        <input
                                            type="text"
                                            value={bankRef}
                                            onChange={(e) => setBankRef(e.target.value)}
                                            placeholder="مثال: TRX-9874521"
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white text-xs font-black font-mono outline-none text-blue-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cheque Details Input */}
                        {paymentMethod === 'CHEQUE' && (
                            <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl space-y-3 animate-fade-in">
                                <span className="text-xs font-black text-purple-900 block">بيانات الشيك المصرفي:</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الشيك *</label>
                                        <input
                                            type="text"
                                            value={chequeNumber}
                                            onChange={(e) => setChequeNumber(e.target.value)}
                                            placeholder="رقم ورقة الشيك..."
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white text-xs font-black font-mono outline-none text-purple-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم بنك الشيك</label>
                                        <input
                                            type="text"
                                            value={chequeBank}
                                            onChange={(e) => setChequeBank(e.target.value)}
                                            placeholder="مثال: بنك الخرطوم..."
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white text-xs font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Section 3: Items Table & Pricing */}
                    <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm rounded-3xl bg-white">
                        <div className="p-4 bg-slate-100/80 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <Package size={18} className="text-purple-600" />
                                <span>الأصناف، تسعير الشراء، وتكلفة المخزن وسعر البيع</span>
                            </h2>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-purple-900 bg-white border border-purple-200 px-3 py-1.5 rounded-xl shadow-sm">
                                <input
                                    type="checkbox"
                                    checked={updateSellingPrices}
                                    onChange={(e) => setUpdateSellingPrices(e.target.checked)}
                                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                                />
                                <span>تحديث أسعار البيع في المخزن فوراً</span>
                            </label>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 shadow-sm relative group">
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-bold text-slate-600 mb-1">الصنف</label>
                                        <select
                                            value={item.productId}
                                            onChange={e => updateItem(index, 'productId', e.target.value)}
                                            required
                                            className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-black text-slate-800 bg-white text-xs"
                                        >
                                            <option value="">-- اختر الصنف --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.type ? `- ${p.type}` : ''} {p.thickness ? `(${p.thickness}mm)` : ''} (المخزن الحالي: {p.quantity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1">الكمية المستلمة</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            required
                                            className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-black font-mono text-slate-800 bg-white text-xs text-center"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1">
                                            سعر الشراء ({currency === 'USD' ? '$' : currency === 'AED' ? 'د.إ' : 'ج.س'})
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={currency === 'SDG' ? item.price : item.purchasePriceCurrency}
                                            onChange={e => updateItem(index, currency === 'SDG' ? 'price' : 'purchasePriceCurrency', parseFloat(e.target.value) || 0)}
                                            required
                                            className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-black font-mono text-purple-700 bg-white text-xs text-left"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                                            سعر البيع بالمخزن (ج.س)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.sellingPrice}
                                            onChange={e => updateItem(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                            className="w-full border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-black font-mono text-emerald-700 bg-emerald-50/50 text-xs text-left"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="md:col-span-1 pb-2">
                                        <span className="text-[10px] text-slate-400 font-bold block">إجمالي الصنف:</span>
                                        <span className="font-black text-xs font-mono text-slate-800">
                                            {((currency === 'SDG' ? item.price : item.purchasePriceCurrency) * item.quantity).toLocaleString()} {currency === 'USD' ? '$' : currency === 'AED' ? 'د.إ' : 'ج'}
                                        </span>
                                    </div>

                                    <div className="md:col-span-1 flex justify-end pb-1">
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                title="حذف الصنف"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItem}
                                className="w-full py-3.5 border-dashed border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-2xl flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                <span>إضافة صنف آخر للشحنة</span>
                            </Button>
                        </div>
                    </Card>

                    {/* Section 4: Totals & Submit */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 sticky bottom-4 z-20">
                        <div className="flex flex-wrap items-center gap-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 mb-0.5">إجمالي الشحنة بالعملة:</p>
                                <p className="text-2xl font-black text-purple-700 font-mono">
                                    {totalInCurrency.toLocaleString()} <span className="text-sm font-sans font-bold">{currency === 'USD' ? '$ دولار' : currency === 'AED' ? 'د.إ درهم' : 'ج.س'}</span>
                                </p>
                            </div>

                            {currency !== 'SDG' && (
                                <div className="border-r pr-6 border-slate-200">
                                    <p className="text-xs font-bold text-slate-400 mb-0.5">القيمة المقابلة وتكلفة المخزن بالجنيه:</p>
                                    <p className="text-2xl font-black text-slate-800 font-mono">
                                        {totalInSDG.toLocaleString()} <span className="text-sm font-sans font-bold text-slate-500">ج.س</span>
                                    </p>
                                </div>
                            )}

                            {paymentMethod === 'DEPOSIT_DEDUCTION' && selectedSupplierObj && (
                                <div className="border-r pr-6 border-slate-200">
                                    <p className="text-xs font-bold text-slate-400 mb-0.5">الرصيد المودع بعد الخصم:</p>
                                    <p className={`text-xl font-black font-mono ${(availableAdvance - totalInCurrency) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                        {(availableAdvance - totalInCurrency).toLocaleString()} {currency === 'USD' ? '$' : currency === 'AED' ? 'د.إ' : 'ج.س'}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <Button
                            type="submit"
                            disabled={submitting || items.length === 0}
                            className="w-full md:w-auto px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-base rounded-2xl shadow-xl shadow-purple-500/20 flex justify-center items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            <span>اعتماد الشحنة وتحديث المخزن</span>
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    )
}
