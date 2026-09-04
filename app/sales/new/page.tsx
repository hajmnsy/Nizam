'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ProformaInvoice } from '@/components/ProformaInvoice'
import { ArrowLeft, Plus, Trash2, Search, Minus, FileText, Printer, Save, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
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

export default function NewSale() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [customer, setCustomer] = useState('')
    const [loading, setLoading] = useState(false)
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
            if (exchangeRateData) {
                if (exchangeRateData.rate > 0) setExchangeRate(exchangeRateData.rate)
            }

            // Filter out specific categories and remove duplicates by name
            if (Array.isArray(categoriesData)) {
                const hiddenCategories = ['قطاعات', 'مسطحات', 'مواسير', 'سيخ']
                let visibleCategories = categoriesData.filter((cat: Category) => !hiddenCategories.includes(cat.name))

                const uniqueMap = new Map();
                visibleCategories.forEach(cat => {
                    if (!uniqueMap.has(cat.name)) {
                        uniqueMap.set(cat.name, cat);
                    }
                });
                visibleCategories = Array.from(uniqueMap.values());

                setCategories(visibleCategories)
                if (visibleCategories.length > 0) {
                    setActiveCategory(visibleCategories[0].name)
                }
            } else {
                setCategories([])
            }
        }).catch(console.error)
    }, [])

    const filteredProducts = useMemo(() => {
        let filtered = products

        if (activeCategory) {
            filtered = filtered.filter(p => p.category?.name === activeCategory)
        }

        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        }

        return filtered.sort((a, b) => {
            const getDimensionsMultiplier = (name: string) => {
                const numbers = name.match(/\d+(\.\d+)?/g);
                if (!numbers || numbers.length === 0) return 0;
                return numbers.reduce((acc, val) => acc * parseFloat(val), 1);
            };

            const dimA = getDimensionsMultiplier(a.name);
            const dimB = getDimensionsMultiplier(b.name);

            if (dimA !== dimB) {
                return dimB - dimA;
            }

            const thickA = a.thickness || 0;
            const thickB = b.thickness || 0;
            if (thickA !== thickB) {
                return thickB - thickA;
            }

            return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
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
        if (qty < 1) return
        setCart(prev => prev.map(item => item.productId === id ? { ...item, quantity: qty } : item))
    }

    const updatePrice = (id: number, price: number) => {
        if (price < 0) return
        setCart(prev => prev.map(item => item.productId === id ? { ...item, price: price } : item))
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
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'CHEQUE' | 'MULTIPLE'>('CASH')
    const [splitCash, setSplitCash] = useState<string>('')
    const [splitBank, setSplitBank] = useState<string>('')
    const [splitCheque, setSplitCheque] = useState<string>('')

    const [currency, setCurrency] = useState<'SDG' | 'USD' | 'AED'>('SDG')
    const [currencyRate, setCurrencyRate] = useState<string>('1')
    interface BankTransferRow {
        id: number
        bankName: string
        customBankName: string
        bankRef: string
        amount: string
    }

    const [bankTransfers, setBankTransfers] = useState<BankTransferRow[]>([
        { id: 1, bankName: 'بنك الخرطوم (بنكك)', customBankName: '', bankRef: '', amount: '' }
    ])

    const addBankTransfer = () => {
        setBankTransfers(prev => [
            ...prev,
            { id: Date.now(), bankName: 'بنك الخرطوم (بنكك)', customBankName: '', bankRef: '', amount: '' }
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
    const [bankName, setBankName] = useState<string>('بنك الخرطوم (بنكك)')
    const [customBankName, setCustomBankName] = useState<string>('')
    const [bankRef, setBankRef] = useState<string>('')
    const [chequeNumber, setChequeNumber] = useState<string>('')
    const [chequeBank, setChequeBank] = useState<string>('')

    const totalWeight = cart.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
    // Round subtotal explicitly at the item level summation to prevent carrying floating points
    const subtotal = cart.reduce((sum, item) => sum + Math.round(item.price * item.quantity), 0)
    const finalTotal = Math.round(subtotal - (parseFloat(discount) || 0))

    const handleSubmit = async (status: 'PAID' | 'QUOTATION' | 'CREDIT' = 'PAID') => {
        if (cart.length === 0) return alert('الرجاء إضافة منتجات للفاتورة')
        setLoading(true)

        let finalStatus = status;
        let finalPaid = finalTotal;

        if (status === 'CREDIT') {
            finalPaid = parseFloat(paidAmountInput) || 0;
            if (finalPaid >= finalTotal) {
                finalStatus = 'PAID';
            }
        } else if (status === 'QUOTATION') {
            finalPaid = 0;
        } else if (paymentMethod === 'MULTIPLE') {
            const sumSplit = (parseFloat(splitCash) || 0) + (parseFloat(splitBank) || 0) + (parseFloat(splitCheque) || 0);
            finalPaid = sumSplit;
            if (finalPaid < finalTotal) {
                finalStatus = 'CREDIT';
            }
        }

        let calcCash = 0;
        let calcBank = 0;
        let calcCheque = 0;

        if (paymentMethod === 'CASH') calcCash = finalPaid;
        else if (paymentMethod === 'BANK') {
            const sumTransfers = bankTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            if (sumTransfers > 0) {
                calcBank = sumTransfers;
                if (calcBank < finalTotal && status !== 'QUOTATION') {
                    finalPaid = calcBank;
                    finalStatus = 'CREDIT';
                }
            } else {
                calcBank = finalPaid;
            }
        }
        else if (paymentMethod === 'CHEQUE') calcCheque = finalPaid;
        else if (paymentMethod === 'MULTIPLE') {
            calcCash = parseFloat(splitCash) || 0;
            const sumTransfers = bankTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            calcBank = (parseFloat(splitBank) || 0) > 0 ? (parseFloat(splitBank) || 0) : sumTransfers;
            calcCheque = parseFloat(splitCheque) || 0;
        }

        const activeTransfers = bankTransfers.map(t => ({
            bank: t.bankName === 'أخرى (تحديد يدوي)' ? (t.customBankName || 'أخرى') : t.bankName,
            ref: t.bankRef?.trim() || '',
            amount: (parseFloat(t.amount) || 0) > 0 ? parseFloat(t.amount) : (bankTransfers.length === 1 ? calcBank : 0)
        })).filter(t => t.ref || t.amount > 0 || bankTransfers.length === 1);

        let finalBankName = null;
        let finalBankRef = null;
        if (paymentMethod === 'BANK' || (paymentMethod === 'MULTIPLE' && calcBank > 0)) {
            if (activeTransfers.length === 1) {
                finalBankName = activeTransfers[0].bank;
                finalBankRef = activeTransfers[0].ref || null;
            } else if (activeTransfers.length > 1) {
                const names = Array.from(new Set(activeTransfers.map(t => t.bank.replace(/\s*\(.*?\)/g, ''))));
                finalBankName = names.join(' + ') + ` (${activeTransfers.length} إشعارات)`;
                finalBankRef = activeTransfers.map(t => `${t.bank}: ${t.ref || 'بدون إشعار'} [${t.amount.toLocaleString()} ج.س]`).join(' | ');
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
                    chequeNumber: chequeNumber?.trim() || null,
                    chequeBank: chequeBank?.trim() || null,
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
            <main className="h-screen bg-slate-50 flex flex-col print:hidden overflow-hidden">
                <Navbar />
                
                <div className="flex-1 flex flex-col p-3 overflow-hidden max-w-7xl mx-auto w-full">
                    {/* Top Control Bar */}
                    <div className="bg-white rounded-xl border shadow-sm p-3 mb-3 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <Link href="/sales" className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="رجوع">
                                <ArrowLeft size={20} />
                            </Link>
                            <h1 className="text-xl font-bold text-slate-800">نقطة البيع (POS)</h1>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {registeredCustomers.length > 0 && (
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => {
                                        const custId = e.target.value;
                                        setSelectedCustomerId(custId);
                                        if (custId) {
                                            const found = registeredCustomers.find(c => c.id === parseInt(custId));
                                            if (found) setCustomer(found.name);
                                        }
                                    }}
                                    className="h-10 bg-emerald-50 border border-emerald-300 rounded-lg px-2 text-xs font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500 max-w-[220px]"
                                >
                                    <option value="">👤 اختيار عميل مسجل...</option>
                                    {registeredCustomers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.company ? `(${c.company})` : ''} {c.remainingBalance > 0 ? `[له مودع: ${c.remainingBalance.toLocaleString()}]` : c.remainingBalance < 0 ? `[عليه: ${Math.abs(c.remainingBalance).toLocaleString()}]` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <Input
                                placeholder="اسم العميل (اختياري)"
                                value={customer}
                                onChange={(e) => {
                                    setCustomer(e.target.value);
                                    if (selectedCustomerId) {
                                        const found = registeredCustomers.find(c => c.id === parseInt(selectedCustomerId));
                                        if (found && found.name !== e.target.value) {
                                            setSelectedCustomerId('');
                                        }
                                    }
                                }}
                                className="h-10 bg-gray-50 min-w-[170px]"
                            />
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 h-10 min-w-[170px]">
                                <Calendar size={16} className="text-gray-500" />
                                <span className="text-sm font-bold text-gray-500">التاريخ:</span>
                                <input
                                    type="date"
                                    value={createdAt}
                                    onChange={(e) => setCreatedAt(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
                        {/* LEFT SIDE: Product Selection */}
                        <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 h-full">
                            
                            {/* Categories Grid (Wraps inside to prevent horizontal scrolling) */}
                            <Card className="p-2 shrink-0 border-blue-100">
                                <div className="flex flex-wrap gap-1.5">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.name)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all border ${activeCategory === cat.name
                                                ? 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-[1.02]'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </Card>

                            {/* Search Box Removed per User Request */}

                            {/* Products Grid */}
                            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
                                <div className="flex-1 overflow-y-auto w-full">
                                    {filteredProducts.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                            <Search size={48} className="mb-2" />
                                            <p>لا توجد منتجات في هذا القسم</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-right text-sm">
                                            <thead className="bg-slate-100 border-b text-slate-600 font-bold sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="p-2">المنتج</th>
                                                    <th className="p-2">النوع</th>
                                                    <th className="p-2">السماكة</th>
                                                    <th className="p-2 text-center w-16">المتوفر</th>
                                                    <th className="p-2">السعر</th>
                                                    <th className="p-2 w-14"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredProducts.map(product => {
                                                    const itemWeight = product.weightPerUnit || 0;
                                                    const itemPPU = product.purchasePriceUSD || 0;
                                                    const itemTransport = product.transportCostUSD || 15;
                                                    const sellingPricePerTonUSD = product.category?.sellingPricePerTonUSD || 0;

                                                    const unitCostSDG = (itemPPU + ((itemWeight / 1000) * itemTransport)) * exchangeRate;
                                                    const netProfit = product.price - unitCostSDG;
                                                    const finalProfit = product.price - (unitCostSDG * 1.15);
                                                    const priceByWeight = (itemWeight / 1000) * sellingPricePerTonUSD * exchangeRate;

                                                    return (
                                                        <tr key={product.id} className="hover:bg-blue-50 transition-colors">
                                                            <td className="p-2">
                                                                <div className="font-bold text-slate-800">{product.name}</div>
                                                                {exchangeRate > 0 && (itemPPU > 0 || (sellingPricePerTonUSD > 0 && itemWeight > 0)) && (
                                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                                                                        {itemPPU > 0 && (
                                                                            <>
                                                                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200 whitespace-nowrap" title="صافي الربح للقطعة الحالية">
                                                                                    صافي الربح: {Math.round(netProfit).toLocaleString()} ج.س
                                                                                </span>
                                                                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold border border-blue-200 whitespace-nowrap" title="الربح بعد خصم 15% مصاريف وهامش مستهدف">
                                                                                    الربح النهائي: {Math.round(finalProfit).toLocaleString()} ج.س
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                        {sellingPricePerTonUSD > 0 && itemWeight > 0 && (
                                                                            <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold border border-purple-200 whitespace-nowrap" title="السعر المقترح بناءً على وزن القطعة وسعر الطن بالدولار لهذا التصنيف">
                                                                                السعر بالوزن: {Math.round(priceByWeight).toLocaleString()} ج.س
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-2 text-gray-500 text-xs font-medium max-w-[80px] break-words">{product.type || '-'}</td>
                                                            <td className="p-2">
                                                                {product.thickness ? (
                                                                    <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-bold whitespace-nowrap text-xs">
                                                                        {product.thickness} مم
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold inline-block w-full ${product.quantity > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                                    {product.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="p-2">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-800 leading-tight">{product.price.toLocaleString()}</span>
                                                                    {exchangeRate > 0 && product.price > 0 && (
                                                                        <span className="text-[10px] font-black text-emerald-600 tracking-wider">
                                                                            ${(product.price / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-1 px-2 text-center">
                                                                <button
                                                                    onClick={() => addToCart(product)}
                                                                    className="bg-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition-colors w-full flex justify-center items-center shadow-sm border border-gray-200"
                                                                    title="إضافة للسلة"
                                                                >
                                                                    <Plus size={18} />
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

                        {/* RIGHT SIDE: Cart */}
                        <div className="lg:col-span-5 flex flex-col h-full bg-white border-2 border-blue-200 rounded-xl shadow-lg overflow-hidden min-h-0">
                            
                            {/* Cart Header */}
                            <div className="bg-blue-50 p-3 border-b border-blue-100 shrink-0 space-y-2">
                                <h2 className="font-bold text-blue-900 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        سلة المشتريات
                                    </div>
                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-mono">{cart.length} أصناف</span>
                                </h2>

                                {/* Dispatch / Delivery Branch Selector */}
                                {branches.length > 0 && (
                                    <div className="bg-white p-2 rounded-xl border border-blue-200/80 shadow-sm flex flex-col gap-1">
                                        <label className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                                            <span>📍 فرع وموقع تسليم/صرف البضاعة للزبون:</span>
                                        </label>
                                        <select
                                            value={dispatchBranchId}
                                            onChange={(e) => setDispatchBranchId(e.target.value)}
                                            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                                        >
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.id === activeBranchId ? `📍 ${b.name} (الفرع الحالي)` : `🏢 تسليم من مخازن ${b.name}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Cart Items & Checkout Container (Fully Scrollable) */}
                            <div className="flex-1 overflow-y-auto bg-gray-50/50 flex flex-col">
                                
                                {/* Items List */}
                                <div className="p-2 flex-1">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm min-h-[150px]">
                                            قم بإضافة منتجات للسلة
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {cart.map(item => {
                                                const discountVal = parseFloat(discount) || 0;
                                                const safeSubtotal = subtotal > 0 ? subtotal : 1;
                                                const discountRatio = subtotal > 0 && discountVal > 0 ? discountVal / safeSubtotal : 0;
                                                const itemQty = item.quantity || 1; 
                                                const itemOriginalTotal = Math.round((item.price || 0) * (item.quantity === 0 ? 0 : item.quantity));
                                                const itemDiscount = Math.round(itemOriginalTotal * discountRatio);
                                                const itemDiscountedTotal = itemOriginalTotal - itemDiscount;
                                                const itemWeight = item.weight || 0;
                                                const itemPPU = item.purchasePriceUSD || 0;
                                                const itemTransport = item.transportCostUSD || 15;

                                                return (
                                                    <div key={item.productId} className="bg-white p-3 rounded-lg border shadow-sm flex flex-col gap-2">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">{item.name}</span>
                                                                {item.thickness && <span className="text-xs text-gray-500 mb-1">سمك: {item.thickness}مم</span>}
                                                                {discountRatio > 0 && (
                                                                    <span className="text-xs text-green-600 font-bold mb-1">السعر بعد الخصم: {(itemDiscountedTotal / itemQty).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                                )}
                                                                {exchangeRate > 0 && itemPPU > 0 && (
                                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200 whitespace-nowrap">
                                                                            صافي الربح: {(((itemDiscountedTotal / itemQty) - ((itemPPU + ((itemWeight / 1000) * itemTransport)) * exchangeRate)) * (item.quantity === 0 ? 0 : item.quantity)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.س
                                                                        </span>
                                                                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold border border-blue-200 whitespace-nowrap" title="الربح بعد خصم 15% مصاريف وهامش مستهدف">
                                                                            الربح النهائي: {(((itemDiscountedTotal / itemQty) - ((itemPPU + ((itemWeight / 1000) * itemTransport)) * 1.15 * exchangeRate)) * (item.quantity === 0 ? 0 : item.quantity)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.س
                                                                        </span>
                                                                        {(item.sellingPricePerTonUSD || 0) > 0 && (
                                                                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold border border-purple-200 whitespace-nowrap" title="السعر المقترح بناءً على وزن القطعة وسعر الطن بالدولار لهذا التصنيف">
                                                                                السعر بالوزن: {(((itemWeight / 1000) * (item.sellingPricePerTonUSD || 0) * exchangeRate) * (item.quantity === 0 ? 0 : item.quantity)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.س
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[10px] text-emerald-600 font-bold whitespace-nowrap">
                                                                            (${((((itemDiscountedTotal / itemQty) / exchangeRate) - (itemPPU + ((itemWeight / 1000) * itemTransport))) * (item.quantity === 0 ? 0 : item.quantity)).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })})
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 p-1">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mt-1 border-t pt-2 border-gray-100">
                                                            <div className="flex items-center border rounded shrink-0">
                                                                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-3 py-1.5 hover:bg-gray-100">
                                                                    <Minus size={14} />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (val === '') updateQuantity(item.productId, 0);
                                                                        else updateQuantity(item.productId, parseInt(val) || 1);
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        if (!e.target.value || parseInt(e.target.value) < 1) updateQuantity(item.productId, 1);
                                                                    }}
                                                                    className="w-14 text-center text-sm font-bold border-x py-1.5 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-3 py-1.5 hover:bg-gray-100 text-blue-600">
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                                <div className="flex items-center gap-1 border border-slate-200 rounded px-2 py-1 bg-gray-50/80">
                                                                    <span className="text-xs text-gray-500 font-bold">السعر:</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={item.price}
                                                                        onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                                                                        className="w-20 text-left text-sm font-bold bg-transparent outline-none text-blue-700 font-mono"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    {discountRatio > 0 && (
                                                                        <span className="text-[10px] text-gray-400 line-through">{itemOriginalTotal.toLocaleString()}</span>
                                                                    )}
                                                                    <span className="font-bold text-blue-600 text-sm">
                                                                        {itemDiscountedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Dynamic Checkout Section (Pinned at end of scrollable content) */}
                                <div className="mt-auto shrink-0 bg-white border-t border-gray-200 p-4 flex flex-col gap-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                                    
                                    {/* Comfortable Inputs Row */}
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-gray-500 mb-1">خصم إضافي:</div>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={discount}
                                                onChange={e => setDiscount(e.target.value)}
                                                className="h-10 w-full text-base font-bold bg-white"
                                            />
                                        </div>
                                        {paymentMethod !== 'MULTIPLE' && (
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-gray-500 mb-1">المدفوع (للقسط):</div>
                                                <Input
                                                    type="number"
                                                    placeholder={finalTotal.toString()}
                                                    value={paidAmountInput}
                                                    onChange={(e) => setPaidAmountInput(e.target.value)}
                                                    className="h-10 w-full bg-amber-50 text-base font-bold text-blue-900 border-amber-200"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-gray-500 mb-1">المتبقي:</div>
                                            <div className="h-10 flex items-center px-3 border border-red-200 rounded-lg bg-red-50 text-red-600 font-bold text-base overflow-hidden whitespace-nowrap">
                                                {paymentMethod === 'MULTIPLE' 
                                                    ? Math.max(0, finalTotal - ((parseFloat(splitCash) || 0) + (parseFloat(splitBank) || 0) + (parseFloat(splitCheque) || 0))).toLocaleString()
                                                    : (paidAmountInput === '' ? 0 : Math.max(0, finalTotal - parseFloat(paidAmountInput || '0')).toLocaleString())
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Currency Selector */}
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex flex-wrap justify-between items-center gap-2">
                                            <label className="text-xs font-black text-slate-700">عملة الفاتورة والتحصيل:</label>
                                            <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
                                                {(['SDG', 'USD', 'AED'] as const).map(curr => (
                                                    <button
                                                        key={curr}
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrency(curr)
                                                            if (curr === 'USD' && exchangeRate > 0) {
                                                                setCurrencyRate(exchangeRate.toString())
                                                            } else if (curr === 'SDG') {
                                                                setCurrencyRate('1')
                                                            }
                                                        }}
                                                        className={`px-3 py-1 rounded text-xs font-black transition-all ${
                                                            currency === curr
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {curr === 'SDG' ? 'جنيه (SDG)' : curr === 'USD' ? 'دولار ($ USD)' : 'درهم (AED)'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {currency !== 'SDG' && (
                                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                                                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">سعر الصرف مقابل الجنيه:</span>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={currencyRate}
                                                    onChange={(e) => setCurrencyRate(e.target.value)}
                                                    className="w-24 text-xs font-bold p-1 bg-white border border-slate-300 rounded-lg outline-none font-mono text-center"
                                                />
                                                <span className="text-xs font-mono font-black text-indigo-700">
                                                    القيمة بالعملة: {((finalTotal / (parseFloat(currencyRate) || 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency === 'USD' ? '$' : 'د.إ'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Methods Selector Pills */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-700 block">وسيلة وطريقة الدفع:</label>
                                        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('CASH')}
                                                className={`py-2 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                                                    paymentMethod === 'CASH'
                                                        ? 'bg-emerald-600 text-white shadow-md'
                                                        : 'text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                <span>كاش</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('BANK')}
                                                className={`py-2 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                                                    paymentMethod === 'BANK'
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                <span>تحويل بنكي</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('CHEQUE')}
                                                className={`py-2 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                                                    paymentMethod === 'CHEQUE'
                                                        ? 'bg-purple-600 text-white shadow-md'
                                                        : 'text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                <span>شيك</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('MULTIPLE')}
                                                className={`py-2 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                                                    paymentMethod === 'MULTIPLE'
                                                        ? 'bg-amber-600 text-white shadow-md'
                                                        : 'text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                <span>مجزأ</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bank Transfer Details */}
                                    {(paymentMethod === 'BANK' || (paymentMethod === 'MULTIPLE' && (parseFloat(splitBank) || 0) > 0)) && (
                                        <div className="bg-blue-50/80 border-2 border-blue-200 p-3.5 rounded-xl space-y-3 animate-fade-in">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                                                    💳 تفاصيل التحويلات البنكية (بنكك، فوري، أوكاش، إلخ):
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={addBankTransfer}
                                                    className="text-[11px] font-black text-blue-700 hover:text-blue-900 bg-white border border-blue-300 hover:bg-blue-100/50 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                                                >
                                                    <Plus size={13} />
                                                    + إضافة إشعار آخر
                                                </button>
                                            </div>

                                            {bankTransfers.length > 1 && (
                                                <div className="text-[11px] font-bold text-blue-900 bg-blue-100/80 p-2 rounded-lg flex justify-between items-center border border-blue-200">
                                                    <span>عدد الإشعارات: {bankTransfers.length}</span>
                                                    <span>مجموع مبالغ الإشعارات: <strong className="font-mono text-xs text-blue-950">{totalBankTransfers.toLocaleString()} ج.س</strong></span>
                                                </div>
                                            )}

                                            <div className="space-y-2.5">
                                                {bankTransfers.map((transfer, index) => (
                                                    <div key={transfer.id} className="bg-white border border-blue-200 p-2.5 rounded-lg space-y-2 relative shadow-xs">
                                                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1">
                                                            <span className="text-blue-900 font-black">إشعار تحويل #{index + 1}</span>
                                                            {bankTransfers.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeBankTransfer(transfer.id)}
                                                                    className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50"
                                                                    title="حذف هذا الإشعار"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">البنك / التطبيق</label>
                                                                <select
                                                                    value={transfer.bankName}
                                                                    onChange={(e) => updateBankTransfer(transfer.id, 'bankName', e.target.value)}
                                                                    className="w-full text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-md outline-none focus:border-blue-500"
                                                                >
                                                                    {POPULAR_BANKS.map(b => (
                                                                        <option key={b} value={b}>{b}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">رقم الإشعار / المرجع</label>
                                                                <input
                                                                    type="text"
                                                                    value={transfer.bankRef}
                                                                    onChange={(e) => updateBankTransfer(transfer.id, 'bankRef', e.target.value)}
                                                                    placeholder="رقم الإشعار..."
                                                                    className="w-full text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-md outline-none focus:border-blue-500 font-mono"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">مبلغ الإشعار (ج.س)</label>
                                                                <input
                                                                    type="number"
                                                                    value={transfer.amount}
                                                                    onChange={(e) => updateBankTransfer(transfer.id, 'amount', e.target.value)}
                                                                    placeholder={bankTransfers.length === 1 ? `${finalTotal}` : "المبلغ..."}
                                                                    className="w-full text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-md outline-none focus:border-blue-500 font-mono"
                                                                />
                                                            </div>
                                                        </div>

                                                        {transfer.bankName === 'أخرى (تحديد يدوي)' && (
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">اكتب اسم البنك</label>
                                                                <input
                                                                    type="text"
                                                                    value={transfer.customBankName}
                                                                    onChange={(e) => updateBankTransfer(transfer.id, 'customBankName', e.target.value)}
                                                                    placeholder="اسم البنك..."
                                                                    className="w-full text-xs font-bold p-1.5 bg-white border border-slate-300 rounded-md outline-none"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cheque Details */}
                                    {(paymentMethod === 'CHEQUE' || (paymentMethod === 'MULTIPLE' && (parseFloat(splitCheque) || 0) > 0)) && (
                                        <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl space-y-2.5 animate-fade-in">
                                            <span className="text-xs font-black text-purple-900 block">تفاصيل الشيك المصرفي:</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">رقم الشيك</label>
                                                    <input
                                                        type="text"
                                                        value={chequeNumber}
                                                        onChange={(e) => setChequeNumber(e.target.value)}
                                                        placeholder="رقم الشيك..."
                                                        className="w-full text-xs font-bold p-2 bg-white border border-purple-300 rounded-lg outline-none font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">اسم بنك الشيك</label>
                                                    <input
                                                        type="text"
                                                        value={chequeBank}
                                                        onChange={(e) => setChequeBank(e.target.value)}
                                                        placeholder="اسم البنك المصدر للشيك..."
                                                        className="w-full text-xs font-bold p-2 bg-white border border-purple-300 rounded-lg outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Split Payment Controls */}
                                    {paymentMethod === 'MULTIPLE' && (
                                        <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl space-y-2.5 animate-fade-in">
                                            <span className="text-xs font-black text-amber-900 block">توزيع مبالغ الدفع المجزأ:</span>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">مبلغ الكاش</label>
                                                    <input
                                                        type="number"
                                                        value={splitCash}
                                                        onChange={(e) => setSplitCash(e.target.value)}
                                                        placeholder="0"
                                                        className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">تحويل بنكي</label>
                                                    <input
                                                        type="number"
                                                        value={splitBank}
                                                        onChange={(e) => setSplitBank(e.target.value)}
                                                        placeholder="0"
                                                        className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">مبلغ الشيك</label>
                                                    <input
                                                        type="number"
                                                        value={splitCheque}
                                                        onChange={(e) => setSplitCheque(e.target.value)}
                                                        placeholder="0"
                                                        className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-amber-200">
                                                <span>مجموع المدفوع:</span>
                                                <span className="font-mono text-indigo-700 font-black">
                                                    {((parseFloat(splitCash) || 0) + (parseFloat(splitBank) || 0) + (parseFloat(splitCheque) || 0)).toLocaleString()} / {finalTotal.toLocaleString()} ج.س
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Big Total Box */}
                                    <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-lg border-b-4 border-blue-500">
                                        <div>
                                            <span className="font-bold block text-sm opacity-80 mb-1">
                                                الإجمالي النهائي {currency !== 'SDG' ? `(${currency})` : ''}
                                            </span>
                                            <div className="flex items-end gap-2">
                                                {currency === 'SDG' ? (
                                                    <>
                                                        <span className="font-black text-3xl leading-none">{finalTotal.toLocaleString()}</span>
                                                        <span className="font-medium text-gray-400 mb-1 text-sm">ج.س</span>
                                                        {exchangeRate > 0 && finalTotal > 0 && (
                                                            <span className="text-sm text-emerald-400 font-bold ml-2 mb-0.5">
                                                                (${((finalTotal / exchangeRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-black text-3xl leading-none">
                                                            {((finalTotal / (parseFloat(currencyRate) || 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="font-medium text-emerald-400 mb-1 text-sm">
                                                            {currency === 'USD' ? '$ USD' : 'AED د.إ'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-bold ml-2 mb-0.5">
                                                            (يعادل: {finalTotal.toLocaleString()} ج.س)
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {(parseFloat(discount) > 0) && (
                                            <div className="text-right">
                                                <span className="block text-xs text-red-300 line-through mb-1">{subtotal.toLocaleString()}</span>
                                                <span className="text-sm text-green-400 font-bold bg-green-400/20 px-2 py-1 rounded-md">توفير: {parseFloat(discount).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Big Buttons Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            onClick={() => handleSubmit('PAID')}
                                            className="h-12 text-base bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                                            disabled={loading}
                                        >
                                            <span className="font-bold text-white">{loading ? '...' : 'دفع كاش (خالص)'}</span>
                                        </Button>

                                        <Button
                                            onClick={() => handleSubmit('CREDIT')}
                                            className="h-12 text-base bg-amber-500 hover:bg-amber-600 shadow-sm"
                                            disabled={loading}
                                        >
                                            <span className="font-bold text-white">{loading ? '...' : 'دفع آجل (متبقي)'}</span>
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={() => handleSubmit('QUOTATION')}
                                        variant="outline"
                                        className="w-full h-10 text-sm font-bold bg-gray-50 text-blue-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-colors"
                                        disabled={loading}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText size={16} />
                                            <span>حفظ عرض سعر / مسودة</span>
                                        </div>
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
