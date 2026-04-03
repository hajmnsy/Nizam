'use client'

import Navbar from '@/components/Navbar'
import Input from '@/components/ui/Input'
import { ArrowLeft, Plus, Trash2, Search, Minus, FileText, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
    id: number
    name: string
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

    useEffect(() => {
        Promise.all([
            fetch('/api/products', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/categories', { cache: 'no-store' }).then(res => res.json()),
            fetch('/api/exchange-rate', { cache: 'no-store' }).then(res => res.json())
        ]).then(([productsData, categoriesData, exchangeRateData]) => {
            setProducts(Array.isArray(productsData) ? productsData : [])
            setExchangeRate(exchangeRateData.rate || 0)

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

    const [discount, setDiscount] = useState<string>('')
    const [paidAmountInput, setPaidAmountInput] = useState<string>('')

    const totalWeight = cart.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
    // Round subtotal explicitly at the item level summation to prevent carrying floating points
    const subtotal = cart.reduce((sum, item) => sum + Math.round(item.price * item.quantity), 0)
    const finalTotal = Math.max(0, Math.round(subtotal - (parseFloat(discount) || 0)))

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
        }

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: customer || (status === 'QUOTATION' ? 'عرض سعر' : 'عميل نقدي'),
                    items: cart,
                    status: finalStatus,
                    discount: parseFloat(discount) || 0,
                    paidAmount: finalPaid,
                    createdAt: createdAt
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
            <main className="min-h-screen bg-slate-50 flex flex-col print:hidden">
                <Navbar />
                <div className="flex-1 container mx-auto p-4 max-w-[1400px]">
                    <div className="mb-4 flex justify-between items-center bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <ShoppingCart size={24} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-xl font-bold text-slate-800">نقطة البيع (POS)</h1>
                        </div>
                        <Link href="/sales" className="text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center gap-1.5 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-300">
                            <ArrowLeft size={16} />
                            المبيعات
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-170px)]">
                        
                        {/* LEFT SIDE: Product Selection */}
                        <div className="lg:col-span-8 flex flex-col gap-4 h-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                            
                            <div className="flex gap-4">
                                {/* Search */}
                                <div className="relative w-1/3 min-w-[200px]">
                                    <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
                                    <input
                                        placeholder="بحث عن منتج..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-3 pr-10 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                
                                {/* Categories Tabs */}
                                <div className="flex-1 flex gap-2 p-1 bg-slate-50 rounded-xl overflow-x-auto scrollbar-hide border border-slate-200/60">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.name)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                                activeCategory === cat.name
                                                    ? 'bg-white text-indigo-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/50'
                                                    : 'text-slate-500 hover:text-slate-900 border border-transparent'
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Products Grid */}
                            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl">
                                {filteredProducts.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-80">
                                        <Search size={40} strokeWidth={1.5} className="mb-3 text-slate-300" />
                                        <p className="font-semibold text-sm">لا توجد منتجات مطابقة للبحث</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3">المنتج</th>
                                                <th className="px-4 py-3">النوع</th>
                                                <th className="px-4 py-3">السماكة</th>
                                                <th className="px-4 py-3 text-center">المخزون المتوفر</th>
                                                <th className="px-4 py-3">السعر (ج.س)</th>
                                                <th className="px-4 py-3 w-20">إضافة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredProducts.map(product => (
                                                <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-4 py-3 font-bold text-slate-800">{product.name}</td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs font-semibold">{product.type || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        {product.thickness ? (
                                                            <span className="text-slate-700 font-semibold">
                                                                {product.thickness} مم
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                                            product.quantity > 10 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' 
                                                            : product.quantity > 0 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50' 
                                                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/50'
                                                        }`}>
                                                            {product.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{product.price.toLocaleString()}</span>
                                                            {exchangeRate > 0 && product.price > 0 && (
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    ${(product.price / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => addToCart(product)}
                                                            className="flex items-center justify-center p-2 rounded-lg transition-all text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 border border-transparent hover:border-indigo-200 w-full"
                                                            title="إضافة للسلة"
                                                        >
                                                            <Plus size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* RIGHT SIDE: Cart */}
                        <div className="lg:col-span-4 flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                                    سلة المشتريات
                                    <span className="bg-slate-800 text-white px-2 py-0.5 rounded-full text-xs font-bold">{cart.length}</span>
                                </h2>
                            </div>

                            <div className="p-4 space-y-3 bg-white">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="اسم العميل (اختياري)"
                                            value={customer}
                                            onChange={(e) => setCustomer(e.target.value)}
                                            className="w-full text-sm font-semibold border-2 border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50 focus:bg-white"
                                        />
                                    </div>
                                    <div className="w-1/3 min-w-[130px]">
                                        <input
                                            type="date"
                                            value={createdAt}
                                            onChange={(e) => setCreatedAt(e.target.value)}
                                            className="w-full text-sm font-semibold border-2 border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto px-4 py-1 space-y-3 bg-slate-50/50 custom-scrollbar border-t border-b border-slate-100">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm font-semibold opacity-60">
                                        <ShoppingCart size={40} className="mb-2 text-slate-300" strokeWidth={1.5} />
                                        السلة فارغة
                                    </div>
                                ) : (
                                    cart.map(item => {
                                        const discountVal = parseFloat(discount) || 0;
                                        const safeSubtotal = subtotal > 0 ? subtotal : 1;
                                        const discountRatio = subtotal > 0 && discountVal > 0 ? discountVal / safeSubtotal : 0;
                                        const itemQty = item.quantity || 1;
                                        const itemOriginalTotal = Math.round((item.price || 0) * (item.quantity === 0 ? 0 : item.quantity));
                                        const itemDiscount = Math.round(itemOriginalTotal * discountRatio);
                                        const itemDiscountedTotal = itemOriginalTotal - itemDiscount;

                                        return (
                                            <div key={item.productId} className="bg-white p-3 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-3 group">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-sm leading-tight">{item.name}</span>
                                                        {item.thickness && <span className="text-[11px] font-semibold text-slate-500 mt-0.5">سمك {item.thickness}مم</span>}
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-rose-600 transition-colors bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-2 py-1.5 hover:bg-slate-200 text-slate-600 transition-colors">
                                                            <Minus size={14} strokeWidth={2.5} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity === 0 ? '' : item.quantity}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                updateQuantity(item.productId, val === '' ? 0 : parseInt(val) || 1);
                                                            }}
                                                            onBlur={(e) => {
                                                                if (!e.target.value || parseInt(e.target.value) < 1) updateQuantity(item.productId, 1);
                                                            }}
                                                            className="w-10 text-center text-sm font-black bg-white border-x border-slate-200 py-1.5 outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900"
                                                        />
                                                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-2 py-1.5 hover:bg-slate-200 text-slate-600 transition-colors">
                                                            <Plus size={14} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-1 bg-slate-50 rounded px-2 border border-slate-100">
                                                            <input
                                                                type="number"
                                                                value={item.price}
                                                                onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                                                                className="w-16 text-left text-sm font-bold bg-transparent outline-none text-slate-800 py-0.5"
                                                            />
                                                        </div>
                                                        <span className="font-black text-indigo-600 text-sm">
                                                            {itemDiscountedTotal.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-4 bg-white flex flex-col gap-4">
                                {/* Discount Input */}
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden px-3">
                                    <span className="font-bold text-sm text-slate-500 whitespace-nowrap">الخصم الإضافي:</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                        className="w-full text-left font-black text-slate-800 bg-transparent py-2.5 px-2 outline-none"
                                    />
                                    <span className="text-slate-400 font-bold text-sm">ج.س</span>
                                </div>

                                {/* Total Display */}
                                <div className="flex justify-between items-center bg-slate-800 text-white p-5 rounded-xl shadow-[0_4px_15px_rgba(30,41,59,0.15)] relative overflow-hidden">
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                    <div className="flex flex-col z-10 w-full pl-2">
                                        <div className="flex justify-between items-start w-full">
                                            <span className="font-bold text-sm text-slate-300">الإجمالي النهائي</span>
                                            {(parseFloat(discount) > 0) && (
                                                <div className="text-left flex flex-col">
                                                    <span className="text-xs text-rose-300 line-through">{subtotal.toLocaleString()}</span>
                                                    <span className="text-xs font-bold text-emerald-300">وفر للعميل {parseFloat(discount).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="font-black text-3xl tracking-tight">{finalTotal.toLocaleString()}</span>
                                            <span className="text-sm font-bold text-slate-400">ج.س</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Inputs */}
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <span className="font-bold text-xs text-slate-500 block mb-1.5">المدفوع (للفواتير الآجلة)</span>
                                        <input
                                            type="number"
                                            placeholder={finalTotal.toString()}
                                            value={paidAmountInput}
                                            onChange={e => setPaidAmountInput(e.target.value)}
                                            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg font-black text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-bold text-xs text-slate-500 block mb-1.5">المبلغ المتبقي</span>
                                        <div className="w-full h-11 flex items-center px-3 border border-rose-200 bg-rose-50/50 rounded-lg font-black text-rose-600 text-sm">
                                            {paidAmountInput === '' ? 0 : Math.max(0, finalTotal - parseFloat(paidAmountInput || '0')).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <button
                                        onClick={() => handleSubmit('PAID')}
                                        disabled={loading}
                                        className="py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-70 flex justify-center items-center"
                                    >
                                        {loading ? '...' : 'دفع كاش'}
                                    </button>

                                    <button
                                        onClick={() => handleSubmit('CREDIT')}
                                        disabled={loading}
                                        className="py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-70 flex justify-center items-center"
                                    >
                                        {loading ? '...' : 'دفع آجل'}
                                    </button>
                                </div>
                                
                                <button
                                    onClick={() => handleSubmit('QUOTATION')}
                                    disabled={loading}
                                    className="w-full py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    <FileText size={16} />
                                    حفظ كمسودة / عرض سعر
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
