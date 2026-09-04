'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, Plus, Trash2, Search, Minus, Save } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Category {
    id: number
    name: string
    sellingPricePerTonUSD?: number
}

interface Product {
    id: number
    name: string
    price: number
    purchasePriceUSD?: number
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
    quantity: number
    weight: number
    thickness?: number | null
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

interface BankTransferRow {
    id: number
    bankName: string
    customBankName: string
    bankRef: string
    amount: string
}

export default function EditSale() {
    const router = useRouter()
    const params = useParams()
    const saleId = params.id as string

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [customer, setCustomer] = useState('')
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')
    const [discount, setDiscount] = useState<string>('')
    const [paidAmountInput, setPaidAmountInput] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'CHEQUE' | 'MULTIPLE'>('CASH')
    const [splitCash, setSplitCash] = useState<string>('')
    const [splitBank, setSplitBank] = useState<string>('')
    const [splitCheque, setSplitCheque] = useState<string>('')
    const [chequeNumber, setChequeNumber] = useState<string>('')
    const [chequeBank, setChequeBank] = useState<string>('')

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
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [createdAt, setCreatedAt] = useState(getTodayLocal())
    const [originalStatus, setOriginalStatus] = useState<string>('PAID')
    const [exchangeRate, setExchangeRate] = useState<number>(0)
    const [isEditableSameDay, setIsEditableSameDay] = useState(true)

    useEffect(() => {
        // Fetch products, categories, sale, AND exchange rate
        Promise.all([
            fetch('/api/products', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/categories', { cache: 'no-store' }).then(res => res.json()),
            fetch(`/api/sales/${saleId}`, { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/exchange-rate', { cache: 'no-store' }).then(res => res.json())
        ]).then(([productsData, categoriesData, saleData, exchangeRateData]) => {
            setProducts(productsData)

            if (exchangeRateData && exchangeRateData.rate > 0) {
                setExchangeRate(exchangeRateData.rate)
            }

            // Setup Categories
            const hiddenCategories = ['قطاعات', 'مسطحات', 'مواسير', 'سيخ']
            const visibleCategories = categoriesData.filter((cat: Category) => !hiddenCategories.includes(cat.name))
            setCategories(visibleCategories)
            if (visibleCategories.length > 0) {
                setActiveCategory(visibleCategories[0].name)
            }

            // Populate Sale Data
            if (saleData && !saleData.error) {
                setCustomer(saleData.customer || '')
                setDiscount(saleData.discount?.toString() || '0')
                setOriginalStatus(saleData.status)
                if (saleData.createdAt) {
                    const saleDate = new Date(saleData.createdAt)
                    const today = new Date()
                    const sameDay = saleDate.getFullYear() === today.getFullYear() &&
                                    saleDate.getMonth() === today.getMonth() &&
                                    saleDate.getDate() === today.getDate()
                    setIsEditableSameDay(sameDay)
                    setCreatedAt(saleDate.toISOString().split('T')[0])
                }

                // If the sale is CREDIT, populate the paidAmount; if PAID, we don't necessarily need to pre-fill it but it's safe to use the DB value.
                if (saleData.status === 'CREDIT' || saleData.paidAmount !== undefined) {
                    setPaidAmountInput(saleData.paidAmount?.toString() || '0')
                } else {
                    setPaidAmountInput((saleData.total - (saleData.discount || 0)).toString())
                }

                if (saleData.paymentMethod) {
                    setPaymentMethod(saleData.paymentMethod)
                }
                if (saleData.cashAmount !== undefined && saleData.cashAmount !== null) setSplitCash(saleData.cashAmount.toString())
                if (saleData.bankAmount !== undefined && saleData.bankAmount !== null) setSplitBank(saleData.bankAmount.toString())
                if (saleData.chequeAmount !== undefined && saleData.chequeAmount !== null) setSplitCheque(saleData.chequeAmount.toString())
                if (saleData.chequeNumber) setChequeNumber(saleData.chequeNumber)
                if (saleData.chequeBank) setChequeBank(saleData.chequeBank)

                if (saleData.bankTransfers) {
                    try {
                        const parsed = JSON.parse(saleData.bankTransfers)
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setBankTransfers(parsed.map((t: any, idx: number) => ({
                                id: idx + 1,
                                bankName: POPULAR_BANKS.includes(t.bank) ? t.bank : 'أخرى (تحديد يدوي)',
                                customBankName: POPULAR_BANKS.includes(t.bank) ? '' : t.bank,
                                bankRef: t.ref || '',
                                amount: t.amount ? t.amount.toString() : ''
                            })))
                        }
                    } catch (e) {
                        console.error('Error parsing bankTransfers in edit', e)
                    }
                } else if (saleData.bankRef || saleData.bankName) {
                    setBankTransfers([{
                        id: 1,
                        bankName: POPULAR_BANKS.includes(saleData.bankName) ? saleData.bankName : (saleData.bankName ? 'أخرى (تحديد يدوي)' : 'بنك الخرطوم (بنكك)'),
                        customBankName: POPULAR_BANKS.includes(saleData.bankName) ? '' : (saleData.bankName || ''),
                        bankRef: saleData.bankRef || '',
                        amount: saleData.bankAmount ? saleData.bankAmount.toString() : ''
                    }])
                }

                const populatedCart = saleData.items.map((item: any) => ({
                    productId: item.productId,
                    name: item.product.name,
                    price: item.price, // Use exactly what was saved to the invoice item
                    quantity: item.quantity,
                    weight: item.product.weightPerUnit,
                    thickness: item.product.thickness
                }))
                setCart(populatedCart)
            }

        }).catch(err => {
            console.error(err)
            alert('خطأ في تحميل بيانات الفاتورة')
        }).finally(() => {
            setInitialLoading(false)
        })
    }, [saleId])

    const filteredProducts = useMemo(() => {
        let filtered = products

        if (activeCategory) {
            filtered = filtered.filter(p => p.category?.name === activeCategory)
        }

        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        }

        return filtered.sort((a, b) => {
            // Function to extract and multiply dimensions from name
            const getDimensionsMultiplier = (name: string) => {
                const numbers = name.match(/\d+(\.\d+)?/g);
                if (!numbers || numbers.length === 0) return 0;
                return numbers.reduce((acc, val) => acc * parseFloat(val), 1);
            };

            const dimA = getDimensionsMultiplier(a.name);
            const dimB = getDimensionsMultiplier(b.name);

            // 1. Sort by Dimensions Descending
            if (dimA !== dimB) {
                return dimB - dimA;
            }

            // 2. Sort by Thickness Descending
            const thickA = a.thickness || 0;
            const thickB = b.thickness || 0;
            if (thickA !== thickB) {
                return thickB - thickA;
            }

            // 3. Fallback to Natural Name Sort
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
                quantity: 1,
                weight: product.weightPerUnit,
                thickness: product.thickness
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

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const finalTotal = subtotal - (parseFloat(discount) || 0)

    const handleUpdate = async (status: 'PAID' | 'CREDIT' = 'PAID') => {
        if (!isEditableSameDay) {
            return alert('عذراً، تم إغلاق يومية هذه الفاتورة في تاريخ سابق ولا يمكن تعديلها مباشرة. لإرجاع البضاعة استخدم صفحة راجع البضاعة.')
        }
        if (cart.length === 0) return alert('الرجاء إضافة منتجات للفاتورة')
        setLoading(true)

        let finalStatus = status;
        let finalPaid = finalTotal;

        if (status === 'CREDIT') {
            finalPaid = parseFloat(paidAmountInput) || 0;
            if (finalPaid >= finalTotal) {
                finalStatus = 'PAID';
            }
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
                if (calcBank < finalTotal) {
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
            const res = await fetch(`/api/sales/${saleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: customer || 'عميل نقدي',
                    items: cart,
                    status: finalStatus,
                    total: finalTotal,
                    discount: parseFloat(discount) || 0,
                    paidAmount: finalPaid,
                    createdAt: createdAt,
                    paymentMethod: paymentMethod,
                    cashAmount: calcCash,
                    bankAmount: calcBank,
                    chequeAmount: calcCheque,
                    bankName: finalBankName,
                    bankRef: finalBankRef,
                    bankTransfers: JSON.stringify(activeTransfers),
                    chequeNumber: chequeNumber?.trim() || null,
                    chequeBank: chequeBank?.trim() || null,
                })
            })

            if (res.ok) {
                alert('تم تحديث الفاتورة وبيانات السداد بنجاح')
                router.push(`/sales/${saleId}`)
                router.refresh()
            } else {
                const errorData = await res.json()
                alert(`حدث خطأ أثناء التحديث: ${errorData.details || errorData.error || 'خطأ غير معروف'}`)
                console.error('Update error details:', errorData)
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ أثناء التحديث: خطأ في الاتصال')
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex justify-center items-center text-gray-500">جاري تحميل الفاتورة...</div>
        </div>
    )

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col print:hidden">
            <Navbar />
            <div className="flex-1 container mx-auto p-4 max-w-7xl">
                <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <Link href={`/sales/${saleId}`} className="text-gray-500 hover:text-blue-600 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded text-sm font-bold">
                            <ArrowLeft size={16} />
                            إلغاء
                        </Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span>تعديل فاتورة رقم</span>
                            <span className="text-blue-600 font-mono">#{saleId}</span>
                        </h1>
                    </div>
                </div>

                {!isEditableSameDay && (
                    <div className="mb-4 bg-amber-50 border-2 border-amber-300 text-amber-950 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">⛔</span>
                            <div>
                                <p className="font-black text-base text-amber-900">انقضت فترة التعديل المباشر (تم تقفيل اليومية)</p>
                                <p className="text-xs text-amber-800 font-medium mt-0.5">
                                    الفواتير الصادرة في أيام سابقة غير قابلة للتعديل المباشر لمنع الاختلال في الحسابات المالية السابقة. إذا رغب الزبون في إرجاع بضاعة هذه الفاتورة، يرجى استخدام صفحة <strong>راجــع البـضـاعـة</strong>.
                                </p>
                            </div>
                        </div>
                        <Link href={`/sales/returns/new?saleId=${saleId}`}>
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap px-4 py-2.5 rounded-xl shadow-md">
                                الانتقال لصفحة راجع البضاعة 🔄
                            </Button>
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-170px)]">
                    {/* LEFT SIDE: Product Selection */}
                    <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                        {/* Categories */}
                        <Card className="p-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                            <div className="flex gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.name)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeCategory === cat.name
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                            <Input
                                placeholder="بحث سريع عن منتج..."
                                className="pr-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Products Grid / Table */}
                        <div className="flex-1 overflow-y-auto pr-2 pb-2">
                            {filteredProducts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <Search size={48} className="mb-2" />
                                    <p>لا توجد منتجات في هذا القسم</p>
                                </div>
                            ) : (
                                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-slate-50 border-b text-slate-500 font-bold sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3">المنتج</th>
                                                <th className="p-3">النوع</th>
                                                <th className="p-3">السماكة</th>
                                                <th className="p-3 text-center">المتوفر</th>
                                                <th className="p-3">السعر</th>
                                                <th className="p-3 w-16">إضافة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
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
                                                    <tr key={product.id} className="hover:bg-blue-50/50 transition-colors group">
                                                        <td className="p-3">
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
                                                        <td className="p-3 text-gray-500 text-xs font-medium max-w-[80px] break-words">{product.type || '-'}</td>
                                                        <td className="p-3">
                                                            {product.thickness ? (
                                                                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">
                                                                    {product.thickness} مم
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${product.quantity > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                                {product.quantity}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-bold text-slate-800">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 leading-tight">{product.price.toLocaleString()}</span>
                                                                {exchangeRate > 0 && product.price > 0 && (
                                                                    <span className="text-[10px] font-black text-emerald-600 tracking-wider">
                                                                        ${(product.price / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <button
                                                                onClick={() => addToCart(product)}
                                                                className="bg-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-colors w-full flex justify-center items-center"
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
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Cart */}
                    <div className="lg:col-span-4 flex flex-col h-full">
                        <Card className="flex flex-col h-full border-2 border-amber-100 shadow-xl overflow-hidden ring-4 ring-amber-50">
                            <div className="bg-amber-50 -m-6 mb-4 p-4 border-b border-amber-200">
                                <h2 className="font-bold text-amber-900 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{cart.length}</span>
                                        سلة التعديل
                                    </div>
                                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">وضع التعديل</span>
                                </h2>
                            </div>

                            <div className="mb-4 space-y-2 mt-2 px-1">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            label="اسم العميل"
                                            placeholder="اسم العميل (اختياري)"
                                            value={customer}
                                            onChange={(e) => setCustomer(e.target.value)}
                                            className="bg-gray-50 bg-white"
                                        />
                                    </div>
                                    <div className="w-1/3 min-w-[120px]">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">التاريخ</label>
                                        <input
                                            type="date"
                                            value={createdAt}
                                            onChange={(e) => setCreatedAt(e.target.value)}
                                            className="w-full h-10 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto mb-4 border-t border-b bg-gray-50/50 -mx-6 px-6 py-2 space-y-2">
                                {cart.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                        السلة فارغة
                                    </div>
                                ) : (
                                    cart.map(item => {
                                        const discountVal = parseFloat(discount) || 0;
                                        const discountRatio = subtotal > 0 && discountVal > 0 ? discountVal / subtotal : 0;
                                        const itemOriginalTotal = item.price * item.quantity;
                                        const itemDiscount = itemOriginalTotal * discountRatio;
                                        const itemDiscountedTotal = itemOriginalTotal - itemDiscount;

                                        return (
                                            <div key={item.productId} className="bg-white p-3 rounded-lg border shadow-sm flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm line-clamp-1">{item.name}</span>
                                                        {item.thickness && <span className="text-xs text-gray-500">سمك: {item.thickness}مم</span>}
                                                        {discountRatio > 0 && (
                                                            <span className="text-xs text-green-600 font-bold">السعر بعد الخصم: {(itemDiscountedTotal / item.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                        )}
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center border rounded">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                            className="px-2 py-1 hover:bg-gray-100"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold border-x py-1">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                            className="px-2 py-1 hover:bg-gray-100 text-blue-600"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-1 border border-slate-200 rounded px-2 py-0.5 bg-gray-50/80">
                                                            <span className="text-xs text-gray-500 font-bold">السعر:</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.price}
                                                                onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                                                                className="w-20 text-left text-sm font-bold bg-transparent outline-none text-blue-700 font-mono"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-end mt-1">
                                                            {discountRatio > 0 && (
                                                                <span className="text-xs text-gray-400 line-through">{itemOriginalTotal.toLocaleString()}</span>
                                                            )}
                                                            <span className="font-bold text-blue-600">
                                                                {itemDiscountedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="space-y-3 bg-white pt-2 overflow-y-auto max-h-[58vh] pr-1">
                                {/* Discount & Paid Amount Inputs */}
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">خصم إضافي:</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={discount}
                                            onChange={e => setDiscount(e.target.value)}
                                            className="h-9 w-full text-xs font-bold"
                                        />
                                    </div>
                                    {paymentMethod !== 'MULTIPLE' && (
                                        <div className="flex-1">
                                            <label className="text-[11px] font-bold text-slate-600 block mb-1">المدفوع (للآجل):</label>
                                            <Input
                                                type="number"
                                                placeholder={finalTotal.toString()}
                                                value={paidAmountInput}
                                                onChange={e => setPaidAmountInput(e.target.value)}
                                                className="h-9 w-full bg-amber-50 text-xs font-bold text-blue-900 border-amber-200 font-mono"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">المتبقي:</label>
                                        <div className="h-9 flex items-center px-2 border border-red-200 rounded-lg bg-red-50 text-red-600 font-bold text-xs font-mono overflow-hidden">
                                            {paymentMethod === 'MULTIPLE'
                                                ? Math.max(0, finalTotal - ((parseFloat(splitCash) || 0) + (parseFloat(splitBank) || 0) + (parseFloat(splitCheque) || 0))).toLocaleString()
                                                : (paidAmountInput === '' ? 0 : Math.max(0, finalTotal - parseFloat(paidAmountInput || '0')).toLocaleString())
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method Selector */}
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-slate-800">طريقة السداد المعتمدة:</label>
                                        <span className="text-[10px] text-blue-600 font-bold">يمكنك تغيير طريقة الدفع</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-lg border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('CASH')}
                                            className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                                paymentMethod === 'CASH'
                                                    ? 'bg-emerald-600 text-white shadow-md'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            كاش
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('BANK')}
                                            className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                                paymentMethod === 'BANK'
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            تحويل بنكي
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('CHEQUE')}
                                            className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                                paymentMethod === 'CHEQUE'
                                                    ? 'bg-purple-600 text-white shadow-md'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            شيك
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('MULTIPLE')}
                                            className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all ${
                                                paymentMethod === 'MULTIPLE'
                                                    ? 'bg-amber-600 text-white shadow-md'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            مجزأ
                                        </button>
                                    </div>
                                </div>

                                {/* Bank Transfer Details (BANK or MULTIPLE) */}
                                {(paymentMethod === 'BANK' || (paymentMethod === 'MULTIPLE' && (parseFloat(splitBank) || 0) > 0)) && (
                                    <div className="bg-blue-50/80 border-2 border-blue-200 p-3 rounded-xl space-y-2.5 animate-fade-in">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-black text-blue-950 flex items-center gap-1">
                                                💳 إشعارات التحويل (بنكك، فوري، إلخ):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={addBankTransfer}
                                                className="text-[10px] font-black text-blue-700 hover:text-blue-900 bg-white border border-blue-300 hover:bg-blue-100/50 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs transition-all"
                                            >
                                                <Plus size={12} />
                                                + إضافة إشعار آخر
                                            </button>
                                        </div>

                                        {bankTransfers.length > 1 && (
                                            <div className="text-[10px] font-bold text-blue-900 bg-blue-100/80 p-1.5 rounded-lg flex justify-between items-center border border-blue-200">
                                                <span>عدد الإشعارات: {bankTransfers.length}</span>
                                                <span>المجموع: <strong className="font-mono text-blue-950">{totalBankTransfers.toLocaleString()} ج.س</strong></span>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {bankTransfers.map((transfer, index) => (
                                                <div key={transfer.id} className="bg-white border border-blue-200 p-2 rounded-lg space-y-1.5 relative shadow-xs text-xs">
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 border-b border-slate-100 pb-0.5">
                                                        <span className="text-blue-900 font-black">إشعار #{index + 1}</span>
                                                        {bankTransfers.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBankTransfer(transfer.id)}
                                                                className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50"
                                                                title="حذف هذا الإشعار"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-600 block mb-0.5">البنك / التطبيق</label>
                                                            <select
                                                                value={transfer.bankName}
                                                                onChange={(e) => updateBankTransfer(transfer.id, 'bankName', e.target.value)}
                                                                className="w-full text-xs font-bold p-1 bg-slate-50 border border-slate-300 rounded outline-none"
                                                            >
                                                                {POPULAR_BANKS.map(b => (
                                                                    <option key={b} value={b}>{b}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-600 block mb-0.5">رقم الإشعار</label>
                                                            <input
                                                                type="text"
                                                                value={transfer.bankRef}
                                                                onChange={(e) => updateBankTransfer(transfer.id, 'bankRef', e.target.value)}
                                                                placeholder="رقم الإشعار..."
                                                                className="w-full text-xs font-bold p-1 bg-slate-50 border border-slate-300 rounded outline-none font-mono"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-600 block mb-0.5">المبلغ (ج.س)</label>
                                                            <input
                                                                type="number"
                                                                value={transfer.amount}
                                                                onChange={(e) => updateBankTransfer(transfer.id, 'amount', e.target.value)}
                                                                placeholder={bankTransfers.length === 1 ? `${finalTotal}` : "المبلغ..."}
                                                                className="w-full text-xs font-bold p-1 bg-slate-50 border border-slate-300 rounded outline-none font-mono"
                                                            />
                                                        </div>
                                                    </div>

                                                    {transfer.bankName === 'أخرى (تحديد يدوي)' && (
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-600 block mb-0.5">اكتب اسم البنك</label>
                                                            <input
                                                                type="text"
                                                                value={transfer.customBankName}
                                                                onChange={(e) => updateBankTransfer(transfer.id, 'customBankName', e.target.value)}
                                                                placeholder="اسم البنك..."
                                                                className="w-full text-xs font-bold p-1 bg-white border border-slate-300 rounded outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cheque Details (CHEQUE or MULTIPLE) */}
                                {(paymentMethod === 'CHEQUE' || (paymentMethod === 'MULTIPLE' && (parseFloat(splitCheque) || 0) > 0)) && (
                                    <div className="bg-purple-50/80 border border-purple-200 p-2.5 rounded-xl space-y-2 animate-fade-in text-xs">
                                        <span className="text-[11px] font-black text-purple-950 block">تفاصيل الشيك:</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">رقم الشيك</label>
                                                <input
                                                    type="text"
                                                    value={chequeNumber}
                                                    onChange={(e) => setChequeNumber(e.target.value)}
                                                    placeholder="رقم الشيك..."
                                                    className="w-full text-xs font-bold p-1.5 bg-white border border-purple-300 rounded-lg outline-none font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">البنك المسحوب عليه</label>
                                                <input
                                                    type="text"
                                                    value={chequeBank}
                                                    onChange={(e) => setChequeBank(e.target.value)}
                                                    placeholder="اسم البنك..."
                                                    className="w-full text-xs font-bold p-1.5 bg-white border border-purple-300 rounded-lg outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Split Payment Inputs (MULTIPLE) */}
                                {paymentMethod === 'MULTIPLE' && (
                                    <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl space-y-2 animate-fade-in text-xs">
                                        <span className="text-[11px] font-black text-amber-950 block">توزيع مبالغ السداد المجزأ:</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">نقد (كاش)</label>
                                                <input
                                                    type="number"
                                                    value={splitCash}
                                                    onChange={(e) => setSplitCash(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-xs font-bold p-1.5 bg-white border border-slate-300 rounded-lg outline-none font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">تحويل بنكي</label>
                                                <input
                                                    type="number"
                                                    value={splitBank}
                                                    onChange={(e) => setSplitBank(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-xs font-bold p-1.5 bg-white border border-slate-300 rounded-lg outline-none font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">شيك مصرفي</label>
                                                <input
                                                    type="number"
                                                    value={splitCheque}
                                                    onChange={(e) => setSplitCheque(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-xs font-bold p-1.5 bg-white border border-slate-300 rounded-lg outline-none font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Big Total */}
                                <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl shadow-md">
                                    <div>
                                        <span className="font-bold block text-[11px] opacity-70">الإجمالي بعد التعديل</span>
                                        <span className="font-black text-xl">{finalTotal.toLocaleString()} <span className="text-xs font-normal text-gray-400">ج.س</span></span>
                                    </div>
                                    {(parseFloat(discount) > 0) && (
                                        <div className="text-right">
                                            <span className="block text-[10px] text-red-300 line-through">{subtotal.toLocaleString()}</span>
                                            <span className="text-xs text-green-400 font-bold">خصم {parseFloat(discount).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Save Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pb-1">
                                    <Button
                                        onClick={() => handleUpdate('PAID')}
                                        className="py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold text-white"
                                        disabled={loading}
                                    >
                                        {loading ? '...' : 'حفظ التعديلات (سداد كامل)'}
                                    </Button>

                                    <Button
                                        onClick={() => handleUpdate('CREDIT')}
                                        className="py-2.5 text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md font-bold"
                                        disabled={loading}
                                    >
                                        {loading ? '...' : 'حفظ التعديلات (آجل)'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    )
}
