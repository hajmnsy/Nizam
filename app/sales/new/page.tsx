'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
    ArrowLeft, Plus, Trash2, Search, Minus, FileText,
    Calendar, User, Eye, EyeOff, X, Check, CreditCard,
    Building2, RefreshCw, ShoppingCart, UserCheck, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
    id: number
    name: string
    sellingPricePerTonUSD?: number
}

interface Product {
    id: number
    name: string
    price: number
    purchasePriceUSD: number
    quantity: number
    weightPerUnit: number
    type?: string | null
    thickness?: number | null
    transportCostUSD?: number | null
    categoryId: number
    category?: Category
}

interface CartItem {
    productId: number
    name: string
    price: number
    purchasePriceUSD: number
    quantity: number
    weight: number
    thickness?: number | null
    transportCostUSD?: number | null
    sellingPricePerTonUSD?: number
}

interface BankTransferRow {
    id: number
    bankName: string
    customBankName: string
    bankRef: string
    amount: string
    sender?: string
    recipient?: string
}

export default function NewSale() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [customer, setCustomer] = useState('')
    const [loading, setLoading] = useState(false)
    const [showMargins, setShowMargins] = useState(false)
    const [customerMenuOpen, setCustomerMenuOpen] = useState(false)
    const customerDropdownRef = useRef<HTMLDivElement>(null)

    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [createdAt, setCreatedAt] = useState(getTodayLocal())
    const [activeCategory, setActiveCategory] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')
    const [exchangeRate, setExchangeRate] = useState<number>(0)
    const [branches, setBranches] = useState<any[]>([])
    const [dispatchBranchId, setDispatchBranchId] = useState<string>('')
    const [activeBranchId, setActiveBranchId] = useState<number>(1)
    const [registeredCustomers, setRegisteredCustomers] = useState<any[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')

    useEffect(() => {
        Promise.all([
            fetch('/api/products', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/categories', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/exchange-rate', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/branches', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/customers', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/auth/me', { cache: 'no-store' }).then(res => res.json())
        ]).then(([productsData, categoriesData, exchangeRateData, branchesData, customersData, userData]) => {
            setProducts(Array.isArray(productsData) ? productsData : [])
            if (Array.isArray(branchesData)) setBranches(branchesData)
            if (Array.isArray(customersData)) setRegisteredCustomers(customersData)
            if (userData && userData.branchId) {
                setActiveBranchId(userData.branchId)
                setDispatchBranchId(userData.branchId.toString())
            }
            if (exchangeRateData && exchangeRateData.rate > 0) {
                setExchangeRate(exchangeRateData.rate)
            }

            if (Array.isArray(categoriesData)) {
                const hiddenCategories = ['قطاعات', 'مسطحات', 'مواسير', 'سيخ']
                let visibleCategories = categoriesData.filter((cat: Category) => !hiddenCategories.includes(cat.name))

                const uniqueMap = new Map()
                visibleCategories.forEach(cat => {
                    if (!uniqueMap.has(cat.name)) {
                        uniqueMap.set(cat.name, cat)
                    }
                })
                visibleCategories = Array.from(uniqueMap.values())
                setCategories(visibleCategories)
            } else {
                setCategories([])
            }
        }).catch(console.error)
    }, [])

    // Click outside to close customer dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setCustomerMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Multi-term fast search & intelligent sorting
    const filteredProducts = useMemo(() => {
        let filtered = products

        if (activeCategory) {
            filtered = filtered.filter(p => p.category?.name === activeCategory)
        }

        if (searchTerm.trim()) {
            const terms = searchTerm.toLowerCase().trim().split(/\s+/)
            filtered = filtered.filter(p => {
                const nameLower = p.name.toLowerCase()
                const typeLower = (p.type || '').toLowerCase()
                const catLower = (p.category?.name || '').toLowerCase()
                const thicknessStr = p.thickness ? `${p.thickness}` : ''
                return terms.every(term =>
                    nameLower.includes(term) ||
                    typeLower.includes(term) ||
                    catLower.includes(term) ||
                    thicknessStr.includes(term)
                )
            })
        }

        return filtered.sort((a, b) => {
            const getDimensionsMultiplier = (name: string) => {
                const numbers = name.match(/\d+(\.\d+)?/g)
                if (!numbers || numbers.length === 0) return 0
                return numbers.reduce((acc, val) => acc * parseFloat(val), 1)
            }

            const dimA = getDimensionsMultiplier(a.name)
            const dimB = getDimensionsMultiplier(b.name)

            if (dimA !== dimB) return dimB - dimA

            const thickA = a.thickness || 0
            const thickB = b.thickness || 0
            if (thickA !== thickB) return thickB - thickA

            return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' })
        })
    }, [products, activeCategory, searchTerm])

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id)
            if (existing) {
                return prev.map(item => item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                )
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: product.price,
                purchasePriceUSD: product.purchasePriceUSD || 0,
                transportCostUSD: product.transportCostUSD || 15,
                quantity: 1,
                weight: product.weightPerUnit,
                thickness: product.thickness,
                sellingPricePerTonUSD: product.category?.sellingPricePerTonUSD || 0
            }]
        })
    }

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.productId !== id))
    }

    const updateQuantity = (id: number, qty: number) => {
        if (qty < 0) return
        if (qty === 0) {
            setCart(prev => prev.map(item => item.productId === id ? { ...item, quantity: 0 } : item))
            return
        }
        setCart(prev => prev.map(item => item.productId === id ? { ...item, quantity: qty } : item))
    }

    const updatePrice = (id: number, price: number) => {
        if (price < 0) return
        setCart(prev => prev.map(item => item.productId === id ? { ...item, price: price } : item))
    }

    const clearCart = () => {
        if (cart.length === 0) return
        if (confirm('هل أنت متأكد من تفريغ سلة المشتريات بالكامل؟')) {
            setCart([])
        }
    }

    const POPULAR_BANKS = [
        'بنك الخرطوم (بنكك)',
        'بنك فيصل الإسلامي (فوري)',
        'بنك أم درمان الوطني (أوكاش)',
        'بنك النيل',
        'البنك الأهلي السوداني',
        'بنك العمال الوطني',
        'بنك البركة السوداني',
        'بنك دبي الإسلامي (DIB)',
        'مصرف أبوظبي الإسلامي (ADIB)',
        'بنك الإمارات دبي الوطني (ENBD)',
        'مصرف الشارقة الإسلامي',
        'أخرى (تحديد يدوي)'
    ]

    const [discount, setDiscount] = useState<string>('')
    const [paidAmountInput, setPaidAmountInput] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'CREDIT' | 'CHEQUE' | 'MULTIPLE'>('CASH')
    const [splitCash, setSplitCash] = useState<string>('')
    const [splitBank, setSplitBank] = useState<string>('')
    const [splitCheque, setSplitCheque] = useState<string>('')

    const [currency, setCurrency] = useState<'SDG' | 'USD' | 'AED'>('SDG')
    const [currencyRate, setCurrencyRate] = useState<string>('1')

    const [bankTransfers, setBankTransfers] = useState<BankTransferRow[]>([
        { id: 1, bankName: 'بنك الخرطوم (بنكك)', customBankName: '', bankRef: '', amount: '', sender: '', recipient: '' }
    ])

    const addBankTransfer = () => {
        setBankTransfers(prev => [
            ...prev,
            { id: Date.now(), bankName: 'بنك الخرطوم (بنكك)', customBankName: '', bankRef: '', amount: '', sender: '', recipient: '' }
        ])
    }

    const removeBankTransfer = (id: number) => {
        if (bankTransfers.length <= 1) return
        setBankTransfers(prev => prev.filter(t => t.id !== id))
    }

    const updateBankTransfer = (id: number, field: keyof BankTransferRow, value: string) => {
        setBankTransfers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
    }

    const totalBankTransfers = bankTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    const [chequeNumber, setChequeNumber] = useState<string>('')
    const [chequeBank, setChequeBank] = useState<string>('')
    const [chequeSender, setChequeSender] = useState<string>('')
    const [chequeRecipient, setChequeRecipient] = useState<string>('')

    const totalWeight = cart.reduce((sum, item) => sum + (item.weight * (item.quantity || 0)), 0)
    const totalWeightKg = totalWeight
    const totalWeightTons = totalWeightKg > 0 ? (totalWeightKg / 1000) : 0

    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerId) return null
        return registeredCustomers.find(c => c.id === parseInt(selectedCustomerId)) || null
    }, [registeredCustomers, selectedCustomerId])

    // Filtered registered customers for autocomplete combobox
    const filteredCustomers = useMemo(() => {
        if (!customer.trim()) return registeredCustomers.slice(0, 8)
        const q = customer.toLowerCase().trim()
        return registeredCustomers.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q)) ||
            (c.company && c.company.toLowerCase().includes(q))
        ).slice(0, 10)
    }, [registeredCustomers, customer])

    // Round subtotal explicitly
    const subtotal = cart.reduce((sum, item) => sum + Math.round(item.price * (item.quantity || 0)), 0)
    const finalTotal = Math.max(0, Math.round(subtotal - (parseFloat(discount) || 0)))

    // Calculated remaining amount
    const remainingAmount = useMemo(() => {
        if (paymentMethod === 'CASH') return 0
        if (paymentMethod === 'BANK') {
            const sumTransfers = bankTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
            if (sumTransfers > 0) return Math.max(0, finalTotal - sumTransfers)
            return 0
        }
        if (paymentMethod === 'CHEQUE') return 0
        if (paymentMethod === 'CREDIT') {
            const paid = parseFloat(paidAmountInput) || 0
            return Math.max(0, finalTotal - paid)
        }
        if (paymentMethod === 'MULTIPLE') {
            const sum = (parseFloat(splitCash) || 0) + (parseFloat(splitBank) || 0) + (parseFloat(splitCheque) || 0)
            return Math.max(0, finalTotal - sum)
        }
        return 0
    }, [paymentMethod, finalTotal, paidAmountInput, splitCash, splitBank, splitCheque, bankTransfers])

    const handleSubmit = async (status: 'PAID' | 'QUOTATION' | 'CREDIT' = 'PAID') => {
        if (cart.length === 0) return alert('الرجاء إضافة منتجات للسلة أولاً')
        setLoading(true)

        let finalStatus = status
        let finalPaid = finalTotal

        if (status === 'CREDIT' || paymentMethod === 'CREDIT') {
            finalPaid = parseFloat(paidAmountInput) || 0
            if (finalPaid >= finalTotal && finalTotal > 0) {
                finalStatus = 'PAID'
            } else {
                finalStatus = 'CREDIT'
            }
        } else if (status === 'QUOTATION') {
            finalPaid = 0
            finalStatus = 'QUOTATION'
        } else if (paymentMethod === 'MULTIPLE') {
            const sumSplit = (parseFloat(splitCash) || 0) + (parseFloat(splitBank) || 0) + (parseFloat(splitCheque) || 0)
            finalPaid = sumSplit
            if (finalPaid < finalTotal) {
                finalStatus = 'CREDIT'
            }
        }

        let calcCash = 0
        let calcBank = 0
        let calcCheque = 0

        if (paymentMethod === 'CASH') calcCash = finalPaid
        else if (paymentMethod === 'BANK') {
            const sumTransfers = bankTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
            if (sumTransfers > 0) {
                calcBank = sumTransfers
                if (calcBank < finalTotal && status !== 'QUOTATION') {
                    finalPaid = calcBank
                    finalStatus = 'CREDIT'
                }
            } else {
                calcBank = finalPaid
            }
        }
        else if (paymentMethod === 'CHEQUE') calcCheque = finalPaid
        else if (paymentMethod === 'CREDIT') calcCash = finalPaid
        else if (paymentMethod === 'MULTIPLE') {
            calcCash = parseFloat(splitCash) || 0
            const sumTransfers = bankTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
            calcBank = (parseFloat(splitBank) || 0) > 0 ? (parseFloat(splitBank) || 0) : sumTransfers
            calcCheque = parseFloat(splitCheque) || 0
        }

        const activeTransfers = bankTransfers.map(t => ({
            bank: t.bankName === 'أخرى (تحديد يدوي)' ? (t.customBankName || 'أخرى') : t.bankName,
            ref: t.bankRef?.trim() || '',
            amount: (parseFloat(t.amount) || 0) > 0 ? parseFloat(t.amount) : (bankTransfers.length === 1 ? calcBank : 0),
            sender: t.sender?.trim() || '',
            recipient: t.recipient?.trim() || ''
        })).filter(t => t.ref || t.amount > 0 || bankTransfers.length === 1)

        let finalBankName = null
        let finalBankRef = null
        let finalBankSender = activeTransfers.find(t => t.sender)?.sender || null
        let finalBankRecipient = activeTransfers.find(t => t.recipient)?.recipient || null

        if (paymentMethod === 'BANK' || (paymentMethod === 'MULTIPLE' && calcBank > 0)) {
            if (activeTransfers.length === 1) {
                finalBankName = activeTransfers[0].bank
                finalBankRef = activeTransfers[0].ref || null
            } else if (activeTransfers.length > 1) {
                const names = Array.from(new Set(activeTransfers.map(t => t.bank.replace(/\s*\(.*?\)/g, ''))))
                finalBankName = names.join(' + ') + ` (${activeTransfers.length} إشعارات)`
                finalBankRef = activeTransfers.map(t => `${t.bank}: ${t.ref || 'بدون إشعار'} [${t.amount.toLocaleString()} ج.س]`).join(' | ')
            }
        }

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: customer || (status === 'QUOTATION' ? 'عرض سعر' : 'عميل نقدي'),
                    customerId: selectedCustomerId ? parseInt(selectedCustomerId) : null,
                    items: cart,
                    status: finalStatus,
                    discount: parseFloat(discount) || 0,
                    paidAmount: finalPaid,
                    paymentMethod: paymentMethod,
                    cashAmount: calcCash,
                    bankAmount: calcBank,
                    chequeAmount: calcCheque,
                    currency: currency,
                    currencyRate: parseFloat(currencyRate) || 1,
                    bankName: finalBankName,
                    bankRef: finalBankRef,
                    bankTransfers: JSON.stringify(activeTransfers),
                    bankSender: finalBankSender,
                    bankRecipient: finalBankRecipient,
                    chequeNumber: chequeNumber?.trim() || null,
                    chequeBank: chequeBank?.trim() || null,
                    chequeSender: chequeSender?.trim() || null,
                    chequeRecipient: chequeRecipient?.trim() || null,
                    createdAt: createdAt,
                    dispatchBranchId: dispatchBranchId || null
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (status === 'QUOTATION') {
                    alert('تم حفظ عرض السعر بنجاح')
                } else {
                    alert('تم حفظ الفاتورة بنجاح')
                }
                router.push(`/sales/${data.id}`)
                router.refresh()
            } else {
                const errorData = await res.json()
                alert(`حدث خطأ أثناء الحفظ: ${errorData.details || 'خطأ غير معروف'}`)
                console.error('Save error details:', errorData)
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ أثناء الحفظ: خطأ في الاتصال')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <main className="h-screen bg-slate-100 flex flex-col print:hidden overflow-hidden select-none">
                <Navbar />

                <div className="flex-1 flex flex-col p-2 sm:p-3 overflow-hidden max-w-[1720px] mx-auto w-full gap-2 min-h-0">
                    {/* Top Bar: Controls, Customer Selector & Date */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-3 py-2 flex flex-wrap justify-between items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                            <Link href="/sales" className="text-slate-600 hover:text-blue-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="رجوع للمبيعات">
                                <ArrowLeft size={20} />
                            </Link>
                            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                                <span>نقطة البيع السريعة (POS)</span>
                            </h1>
                        </div>

                        {/* Customer Search & Date */}
                        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                            {/* Autocomplete Customer Input */}
                            <div className="relative min-w-[240px] max-w-sm flex-1" ref={customerDropdownRef}>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        placeholder="🔍 اسم العميل أو رقمه أو مسجل..."
                                        value={customer}
                                        onFocus={() => setCustomerMenuOpen(true)}
                                        onChange={(e) => {
                                            setCustomer(e.target.value)
                                            setCustomerMenuOpen(true)
                                            if (selectedCustomerId) {
                                                const found = registeredCustomers.find(c => c.id === parseInt(selectedCustomerId))
                                                if (found && found.name !== e.target.value) {
                                                    setSelectedCustomerId('')
                                                }
                                            }
                                        }}
                                        className={`w-full h-9 text-xs font-bold pl-8 pr-3 rounded-lg border transition-all outline-none ${
                                            selectedCustomerId
                                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black'
                                                : 'bg-slate-50 border-slate-300 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400'
                                        }`}
                                    />
                                    {customer ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCustomer('')
                                                setSelectedCustomerId('')
                                            }}
                                            className="absolute left-2 text-slate-400 hover:text-red-500 p-0.5"
                                            title="مسح"
                                        >
                                            <X size={14} />
                                        </button>
                                    ) : (
                                        <User size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                                    )}
                                </div>

                                {/* Customer Autocomplete Dropdown */}
                                {customerMenuOpen && (
                                    <div className="absolute top-full mt-1 right-0 left-0 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
                                        <div className="p-1.5 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-bold border-b">
                                            <span>العملاء المسجلون ({registeredCustomers.length})</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCustomer('عميل نقدي')
                                                    setSelectedCustomerId('')
                                                    setCustomerMenuOpen(false)
                                                }}
                                                className="text-blue-600 hover:underline text-[10px]"
                                            >
                                                عميل نقدي فوري
                                            </button>
                                        </div>
                                        {filteredCustomers.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-slate-400">
                                                لا يوجد عميل بهذا الاسم — سيتم حفظ الاسم كعميل يدوي
                                            </div>
                                        ) : (
                                            filteredCustomers.map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomer(c.name)
                                                        setSelectedCustomerId(c.id.toString())
                                                        setCustomerMenuOpen(false)
                                                    }}
                                                    className={`w-full text-right p-2 text-xs hover:bg-blue-50 transition-colors flex items-center justify-between ${
                                                        selectedCustomerId === c.id.toString() ? 'bg-emerald-50 font-black text-emerald-900' : 'text-slate-800'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="font-bold flex items-center gap-1.5">
                                                            <span>{c.name}</span>
                                                            {c.company && <span className="text-[10px] text-slate-500">({c.company})</span>}
                                                        </div>
                                                        {c.phone && <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>}
                                                    </div>
                                                    {c.remainingBalance > 0 ? (
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                                            له: {c.remainingBalance.toLocaleString()} ج.س
                                                        </span>
                                                    ) : c.remainingBalance < 0 ? (
                                                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                                            عليه: {Math.abs(c.remainingBalance).toLocaleString()} ج.س
                                                        </span>
                                                    ) : null}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Date Picker */}
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 h-9">
                                <Calendar size={14} className="text-slate-500 shrink-0" />
                                <input
                                    type="date"
                                    value={createdAt}
                                    onChange={(e) => setCreatedAt(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-800 outline-none w-28 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
                        {/* LEFT COLUMN: Products Catalog & Search (lg:col-span-7) */}
                        <div className="lg:col-span-7 flex flex-col gap-2 min-h-0 h-full">
                            {/* Search Bar & Fast Filters */}
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="ابحث بالاسم، المقاس (مثال: 40*40 أو 80*40)، السماكة (1.5)، أو التصنيف..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-9 pr-9 pl-8 text-xs font-bold bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg outline-none transition-all"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Profit Margins Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowMargins(!showMargins)}
                                        className={`h-9 px-2.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all shrink-0 ${
                                            showMargins
                                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                                        }`}
                                        title={showMargins ? 'إخفاء تفاصيل وهوامش الربح لجعل الجدول مضغوطاً' : 'عرض هوامش وأرباح القطع بناءً على التكلفة وسعر الصرف'}
                                    >
                                        {showMargins ? <EyeOff size={14} /> : <Eye size={14} />}
                                        <span className="hidden sm:inline">الهوامش</span>
                                    </button>
                                </div>

                                {/* Categories Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                    <button
                                        type="button"
                                        onClick={() => setActiveCategory('')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 border ${
                                            activeCategory === ''
                                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        الكل ({products.length})
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setActiveCategory(cat.name)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 border ${
                                                activeCategory === cat.name
                                                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Products Table (Scrollable Container) */}
                            <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col min-h-0">
                                <div className="flex-1 overflow-y-auto w-full">
                                    {filteredProducts.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                            <Search size={40} className="mb-2 text-slate-300" />
                                            <p className="text-sm font-bold">لا توجد منتجات مطابقة للبحث</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-right text-xs">
                                            <thead className="bg-slate-100 text-slate-700 font-black sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                                                <tr>
                                                    <th className="p-2">المنتج والمواصفات</th>
                                                    <th className="p-2 w-20 text-center">السماكة</th>
                                                    <th className="p-2 w-16 text-center">المتوفر</th>
                                                    <th className="p-2 w-28 text-left">السعر</th>
                                                    <th className="p-2 w-12 text-center">إضافة</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredProducts.map(product => {
                                                    const itemWeight = product.weightPerUnit || 0
                                                    const itemPPU = product.purchasePriceUSD || 0
                                                    const itemTransport = product.transportCostUSD || 15
                                                    const sellingPricePerTonUSD = product.category?.sellingPricePerTonUSD || 0

                                                    const unitCostSDG = (itemPPU + ((itemWeight / 1000) * itemTransport)) * exchangeRate
                                                    const netProfit = product.price - unitCostSDG
                                                    const finalProfit = product.price - (unitCostSDG * 1.15)
                                                    const priceByWeight = (itemWeight / 1000) * sellingPricePerTonUSD * exchangeRate
                                                    const inCartItem = cart.find(c => c.productId === product.id)

                                                    return (
                                                        <tr
                                                            key={product.id}
                                                            onClick={() => addToCart(product)}
                                                            className={`cursor-pointer transition-colors ${
                                                                inCartItem ? 'bg-blue-50/50 hover:bg-blue-100/60' : 'hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <td className="p-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-black text-slate-900">{product.name}</span>
                                                                    {product.type && (
                                                                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                            {product.type}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Optional Profit Margins & Cost Breakdown */}
                                                                {showMargins && exchangeRate > 0 && (itemPPU > 0 || (sellingPricePerTonUSD > 0 && itemWeight > 0)) && (
                                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]" onClick={e => e.stopPropagation()}>
                                                                        {itemPPU > 0 && (
                                                                            <>
                                                                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200 whitespace-nowrap">
                                                                                    صافي الربح: {Math.round(netProfit).toLocaleString()} ج.س
                                                                                </span>
                                                                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold border border-blue-200 whitespace-nowrap">
                                                                                    النهائي (-15%): {Math.round(finalProfit).toLocaleString()} ج.س
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                        {sellingPricePerTonUSD > 0 && itemWeight > 0 && (
                                                                            <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold border border-purple-200 whitespace-nowrap">
                                                                                بالوزن: {Math.round(priceByWeight).toLocaleString()} ج.س
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td className="p-2 text-center">
                                                                {product.thickness ? (
                                                                    <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-bold font-mono">
                                                                        {product.thickness} مم
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </td>

                                                            <td className="p-2 text-center">
                                                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-black font-mono inline-block ${
                                                                    product.quantity > 0
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        : 'bg-red-50 text-red-600 border border-red-200'
                                                                }`}>
                                                                    {product.quantity}
                                                                </span>
                                                            </td>

                                                            <td className="p-2 text-left">
                                                                <div className="font-black font-mono text-slate-900 leading-tight">
                                                                    {product.price.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">ج.س</span>
                                                                </div>
                                                                {exchangeRate > 0 && product.price > 0 && (
                                                                    <div className="text-[10px] font-bold text-emerald-600 font-mono">
                                                                        ${(product.price / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td className="p-1 text-center" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addToCart(product)}
                                                                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition-all flex items-center justify-center mx-auto shadow-2xs active:scale-95"
                                                                    title="إضافة للسلة"
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Cart & Checkout (lg:col-span-5) */}
                        <div className="lg:col-span-5 flex flex-col h-full bg-white border-2 border-blue-200 rounded-xl shadow-md overflow-hidden min-h-0">
                            {/* 1. Cart Header (Fixed Top) */}
                            <div className="bg-blue-50/90 px-3 py-2 border-b border-blue-100 shrink-0 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <ShoppingCart size={18} className="text-blue-700" />
                                        <h2 className="font-black text-sm text-blue-950">سلة المشتريات</h2>
                                        <span className="bg-blue-600 text-white px-2 py-0.2 rounded-full text-xs font-mono font-bold">
                                            {cart.length}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {totalWeightKg > 0 && (
                                            <span className="bg-slate-800 text-white px-2 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 shadow-2xs">
                                                <span>⚖️ {totalWeightTons >= 1 ? `${totalWeightTons.toFixed(2)} طن` : `${totalWeightKg.toLocaleString()} كجم`}</span>
                                            </span>
                                        )}
                                        {cart.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearCart}
                                                className="text-red-500 hover:text-red-700 text-xs font-bold hover:bg-red-50 p-1 rounded transition-colors"
                                                title="تفريغ السلة"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Delivery Branch Selector */}
                                {branches.length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-blue-200/80 shadow-2xs text-xs">
                                        <span className="text-slate-600 font-bold shrink-0 text-[11px]">📍 موقع التسليم:</span>
                                        <select
                                            value={dispatchBranchId}
                                            onChange={(e) => setDispatchBranchId(e.target.value)}
                                            className="w-full text-xs font-black bg-transparent outline-none text-blue-950 cursor-pointer"
                                        >
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.id === activeBranchId ? `${b.name} (الفرع الحالي)` : `مخازن ${b.name}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Customer Deposit / Debt Alert */}
                                {selectedCustomer && (
                                    <div>
                                        {selectedCustomer.remainingBalance > 0 ? (
                                            <div className="bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-lg flex items-center justify-between text-xs text-emerald-950">
                                                <div className="flex items-center gap-1.5">
                                                    <span>💰</span>
                                                    <span className="font-bold">رصيد مودع: <strong className="font-mono text-emerald-700">{selectedCustomer.remainingBalance.toLocaleString()}</strong> ج.س</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const deduct = Math.min(finalTotal, selectedCustomer.remainingBalance)
                                                        setPaidAmountInput(deduct.toString())
                                                    }}
                                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-2xs"
                                                >
                                                    خصم من الرصيد
                                                </button>
                                            </div>
                                        ) : selectedCustomer.remainingBalance < 0 ? (
                                            <div className="bg-amber-50 border border-amber-300 px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs text-amber-950">
                                                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                                <span className="font-bold">تنبيه مديونية: العميل مدين بمبلغ: <strong className="font-mono text-red-600">{Math.abs(selectedCustomer.remainingBalance).toLocaleString()}</strong> ج.س</span>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            {/* 2. ONLY Cart Items Scroll (flex-1 min-h-0) */}
                            <div className="flex-1 overflow-y-auto min-h-0 p-2 bg-slate-50/60 divide-y divide-slate-100">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                        <ShoppingCart size={36} className="mb-2 text-slate-300" />
                                        <p className="text-xs font-bold">سلة المشتريات فارغة</p>
                                        <p className="text-[11px] text-slate-400 mt-1">اضغط على أي صنف من القائمة لإضافته مباشرة</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cart.map(item => {
                                            const discountVal = parseFloat(discount) || 0
                                            const safeSubtotal = subtotal > 0 ? subtotal : 1
                                            const discountRatio = subtotal > 0 && discountVal > 0 ? discountVal / safeSubtotal : 0
                                            const itemQty = item.quantity || 0
                                            const itemOriginalTotal = Math.round((item.price || 0) * itemQty)
                                            const itemDiscount = Math.round(itemOriginalTotal * discountRatio)
                                            const itemDiscountedTotal = itemOriginalTotal - itemDiscount
                                            const origProd = products.find(p => p.id === item.productId)
                                            const isOverStock = origProd && item.quantity > origProd.quantity

                                            return (
                                                <div key={item.productId} className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs hover:border-blue-300 transition-all">
                                                    <div className="flex justify-between items-start gap-1">
                                                        <div>
                                                            <div className="font-black text-xs text-slate-900 flex items-center gap-1">
                                                                <span>{item.name}</span>
                                                                {item.thickness && (
                                                                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded font-mono">
                                                                        {item.thickness}مم
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isOverStock && (
                                                                <span className="text-[10px] text-red-600 font-bold block">
                                                                    ⚠️ الكمية تتجاوز المتوفر بالمستودع ({origProd?.quantity})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(item.productId)}
                                                            className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                                                            title="حذف من السلة"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>

                                                    {/* Stepper, Quick +5/+10 & Price */}
                                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100">
                                                        <div className="flex items-center gap-1">
                                                            {/* - qty + */}
                                                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                                                    className="px-2.5 py-1 hover:bg-slate-100 text-slate-600 transition-colors"
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value
                                                                        if (val === '') updateQuantity(item.productId, 0)
                                                                        else updateQuantity(item.productId, parseInt(val) || 1)
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        if (!e.target.value || parseInt(e.target.value) < 1) updateQuantity(item.productId, 1)
                                                                    }}
                                                                    className="w-12 text-center text-xs font-black border-x border-slate-200 py-1 outline-none font-mono"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                                    className="px-2.5 py-1 hover:bg-slate-100 text-blue-600 font-bold transition-colors"
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>

                                                            {/* Quick +5 & +10 */}
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(item.productId, item.quantity + 5)}
                                                                className="px-1.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded border border-slate-200 transition-colors"
                                                                title="زيادة 5 قطع"
                                                            >
                                                                +5
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(item.productId, item.quantity + 10)}
                                                                className="px-1.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded border border-slate-200 transition-colors"
                                                                title="زيادة 10 قطع"
                                                            >
                                                                +10
                                                            </button>
                                                        </div>

                                                        {/* Unit price edit & line total */}
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                                                                <span className="text-[10px] text-slate-400 font-bold">السعر:</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={item.price}
                                                                    onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                                                                    className="w-16 text-left text-xs font-black bg-transparent outline-none text-blue-800 font-mono"
                                                                />
                                                            </div>

                                                            <div className="text-right min-w-[70px]">
                                                                {discountRatio > 0 && (
                                                                    <span className="text-[10px] text-slate-400 line-through block leading-none font-mono">
                                                                        {itemOriginalTotal.toLocaleString()}
                                                                    </span>
                                                                )}
                                                                <span className="font-black text-xs text-blue-900 font-mono">
                                                                    {itemDiscountedTotal.toLocaleString()} ج.س
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* 3. Checkout Panel (FIXED AT BOTTOM, NEVER SCROLLS AWAY!) */}
                            <div className="shrink-0 bg-white border-t-2 border-slate-200 p-2.5 sm:p-3 flex flex-col gap-2 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
                                {/* Discount & Partial Paid Row */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 block mb-0.5">خصم إضافي:</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={discount}
                                            onChange={e => setDiscount(e.target.value)}
                                            className="h-8 w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2 outline-none focus:bg-white focus:border-blue-500 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 block mb-0.5">المدفوع الآن:</label>
                                        <input
                                            type="number"
                                            placeholder={paymentMethod === 'CREDIT' ? '0' : finalTotal.toString()}
                                            value={paymentMethod === 'CREDIT' ? paidAmountInput : (paymentMethod === 'CASH' || paymentMethod === 'BANK' || paymentMethod === 'CHEQUE' ? finalTotal.toString() : paidAmountInput)}
                                            disabled={paymentMethod === 'CASH' || paymentMethod === 'CHEQUE'}
                                            onChange={(e) => setPaidAmountInput(e.target.value)}
                                            className="h-8 w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2 outline-none focus:bg-white focus:border-blue-500 font-mono disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 block mb-0.5">المتبقي (آجل):</label>
                                        <div className={`h-8 flex items-center px-2 rounded-lg font-black text-xs font-mono overflow-hidden whitespace-nowrap border ${
                                            remainingAmount > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {remainingAmount.toLocaleString()} ج.س
                                        </div>
                                    </div>
                                </div>

                                {/* Currency & Exchange Rate Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-black text-slate-600">العملة:</span>
                                        {( ['SDG', 'USD', 'AED'] as const).map(curr => (
                                            <button
                                                key={curr}
                                                type="button"
                                                onClick={() => {
                                                    setCurrency(curr)
                                                    if (curr === 'USD' && exchangeRate > 0) setCurrencyRate(exchangeRate.toString())
                                                    else if (curr === 'SDG') setCurrencyRate('1')
                                                }}
                                                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                                                    currency === curr
                                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                                        : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {curr === 'SDG' ? 'جنيه' : curr === 'USD' ? 'دولار $' : 'درهم'}
                                            </button>
                                        ))}
                                    </div>

                                    {currency !== 'SDG' && (
                                        <div className="flex items-center gap-1 font-mono text-[11px]">
                                            <span className="text-slate-500 text-[10px]">سعر الصرف:</span>
                                            <input
                                                type="number"
                                                value={currencyRate}
                                                onChange={(e) => setCurrencyRate(e.target.value)}
                                                className="w-16 text-center text-xs font-bold border border-slate-300 rounded px-1 py-0.5 bg-white"
                                            />
                                            <span className="font-black text-indigo-700">
                                                = {((finalTotal / (parseFloat(currencyRate) || 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency === 'USD' ? '$' : 'د.إ'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method Pills */}
                                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('CASH')}
                                        className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                            paymentMethod === 'CASH'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        كاش
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('BANK')}
                                        className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                            paymentMethod === 'BANK'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        بنكك / تحويل
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('CREDIT')}
                                        className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                            paymentMethod === 'CREDIT'
                                                ? 'bg-amber-500 text-white shadow-xs'
                                                : 'text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        آجل
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('CHEQUE')}
                                        className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                            paymentMethod === 'CHEQUE'
                                                ? 'bg-purple-600 text-white shadow-xs'
                                                : 'text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        شيك
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('MULTIPLE')}
                                        className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                            paymentMethod === 'MULTIPLE'
                                                ? 'bg-slate-800 text-white shadow-xs'
                                                : 'text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        مجزأ
                                    </button>
                                </div>

                                {/* Bank Details Panel (when BANK is selected) */}
                                {(paymentMethod === 'BANK' || (paymentMethod === 'MULTIPLE' && (parseFloat(splitBank) || 0) > 0)) && (
                                    <div className="bg-blue-50/90 border border-blue-200 p-2 rounded-xl space-y-1.5">
                                        <div className="flex justify-between items-center text-xs font-black text-blue-950">
                                            <span>💳 إشعار التحويل البنكي (بنكك):</span>
                                            <button
                                                type="button"
                                                onClick={addBankTransfer}
                                                className="text-[10px] font-bold text-blue-700 bg-white border border-blue-300 px-2 py-0.5 rounded shadow-2xs hover:bg-blue-100"
                                            >
                                                + إشعار إضافي
                                            </button>
                                        </div>

                                        {bankTransfers.map((t, idx) => (
                                            <div key={t.id} className="grid grid-cols-12 gap-1.5 items-center bg-white p-1.5 rounded-lg border border-blue-200 text-xs">
                                                <div className="col-span-5">
                                                    <select
                                                        value={t.bankName}
                                                        onChange={(e) => updateBankTransfer(t.id, 'bankName', e.target.value)}
                                                        className="w-full text-[11px] font-bold p-1 bg-slate-50 border border-slate-200 rounded outline-none"
                                                    >
                                                        {POPULAR_BANKS.map(b => (
                                                            <option key={b} value={b}>{b}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-4">
                                                    <input
                                                        type="text"
                                                        value={t.bankRef}
                                                        onChange={(e) => updateBankTransfer(t.id, 'bankRef', e.target.value)}
                                                        placeholder="رقم الإشعار..."
                                                        className="w-full text-[11px] font-bold p-1 bg-slate-50 border border-slate-200 rounded outline-none font-mono"
                                                    />
                                                </div>
                                                <div className="col-span-3 flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={t.amount}
                                                        onChange={(e) => updateBankTransfer(t.id, 'amount', e.target.value)}
                                                        placeholder={bankTransfers.length === 1 ? `${finalTotal}` : 'مبلغ...'}
                                                        className="w-full text-[11px] font-bold p-1 bg-slate-50 border border-slate-200 rounded outline-none font-mono"
                                                    />
                                                    {bankTransfers.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBankTransfer(t.id)}
                                                            className="text-red-400 hover:text-red-600 p-0.5"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cheque Details Panel */}
                                {(paymentMethod === 'CHEQUE' || (paymentMethod === 'MULTIPLE' && (parseFloat(splitCheque) || 0) > 0)) && (
                                    <div className="bg-purple-50/90 border border-purple-200 p-2 rounded-xl space-y-1.5 text-xs">
                                        <span className="font-black text-purple-900 block text-[11px]">تفاصيل الشيك:</span>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <input
                                                type="text"
                                                value={chequeNumber}
                                                onChange={(e) => setChequeNumber(e.target.value)}
                                                placeholder="رقم الشيك..."
                                                className="p-1 bg-white border border-purple-200 rounded text-xs font-mono outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={chequeBank}
                                                onChange={(e) => setChequeBank(e.target.value)}
                                                placeholder="اسم بنك الشيك..."
                                                className="p-1 bg-white border border-purple-200 rounded text-xs outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Split Payment Controls */}
                                {paymentMethod === 'MULTIPLE' && (
                                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl space-y-1 text-xs">
                                        <span className="font-black text-slate-800 block text-[11px]">توزيع مبالغ الدفع المجزأ:</span>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <div>
                                                <label className="text-[10px] text-slate-500 block">كاش</label>
                                                <input
                                                    type="number"
                                                    value={splitCash}
                                                    onChange={(e) => setSplitCash(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full p-1 bg-white border border-slate-200 rounded text-xs font-mono outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 block">بنكك</label>
                                                <input
                                                    type="number"
                                                    value={splitBank}
                                                    onChange={(e) => setSplitBank(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full p-1 bg-white border border-slate-200 rounded text-xs font-mono outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 block">شيك</label>
                                                <input
                                                    type="number"
                                                    value={splitCheque}
                                                    onChange={(e) => setSplitCheque(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full p-1 bg-white border border-slate-200 rounded text-xs font-mono outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Big Total Strip */}
                                <div className="flex justify-between items-center bg-slate-900 text-white px-3 py-2 rounded-xl shadow-sm border-b-2 border-blue-500">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 block leading-tight">الإجمالي الصافي:</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-black text-2xl font-mono">{finalTotal.toLocaleString()}</span>
                                            <span className="text-xs text-slate-400 font-sans">ج.س</span>
                                            {exchangeRate > 0 && finalTotal > 0 && currency === 'SDG' && (
                                                <span className="text-xs text-emerald-400 font-bold font-mono ml-2">
                                                    (${((finalTotal / exchangeRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {parseFloat(discount) > 0 && (
                                        <div className="text-left text-xs">
                                            <span className="text-slate-400 line-through block font-mono text-[11px]">{subtotal.toLocaleString()}</span>
                                            <span className="text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">
                                                توفير: {parseFloat(discount).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Fast 1-Click Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleSubmit(paymentMethod === 'CREDIT' ? 'CREDIT' : 'PAID')}
                                        disabled={loading || cart.length === 0}
                                        className={`flex-1 h-11 text-sm font-black transition-all shadow-md active:scale-98 ${
                                            paymentMethod === 'CASH'
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                : paymentMethod === 'BANK'
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : paymentMethod === 'CREDIT'
                                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                : paymentMethod === 'CHEQUE'
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                : 'bg-slate-800 hover:bg-slate-900 text-white'
                                        }`}
                                    >
                                        {loading ? 'جاري الحفظ...' : (
                                            paymentMethod === 'CASH'
                                                ? '✓ سداد نقدي كاش (خالص)'
                                                : paymentMethod === 'BANK'
                                                ? '💳 سداد تحويل بنكي (خالص)'
                                                : paymentMethod === 'CREDIT'
                                                ? '⏳ اعتماد بيع آجل (متبقي)'
                                                : paymentMethod === 'CHEQUE'
                                                ? '📝 اعتماد سداد بشيك'
                                                : '✓ اعتماد السداد المجزأ'
                                        )}
                                    </Button>

                                    <Button
                                        onClick={() => handleSubmit('QUOTATION')}
                                        disabled={loading || cart.length === 0}
                                        variant="outline"
                                        className="h-11 px-3 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0 flex items-center gap-1 shadow-2xs"
                                        title="حفظ كعرض سعر مسودة دون خصم من المخزون"
                                    >
                                        <FileText size={15} />
                                        <span className="hidden sm:inline">عرض سعر</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
