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
}

interface Product {
    id: number
    name: string
    price: number
    quantity: number
    weightPerUnit: number
    type?: string | null
    thickness?: number | null
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
    const [originalStatus, setOriginalStatus] = useState<string>('PAID')

    useEffect(() => {
        // Fetch products, categories, AND the specific sale
        Promise.all([
            fetch('/api/products').then(res => res.json()),
            fetch('/api/categories').then(res => res.json()),
            fetch(`/api/sales/${saleId}`).then(res => res.json())
        ]).then(([productsData, categoriesData, saleData]) => {
            setProducts(productsData)

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

                // If the sale is CREDIT, populate the paidAmount; if PAID, we don't necessarily need to pre-fill it but it's safe to use the DB value.
                if (saleData.status === 'CREDIT' || saleData.paidAmount !== undefined) {
                    setPaidAmountInput(saleData.paidAmount?.toString() || '0')
                } else {
                    setPaidAmountInput((saleData.total - (saleData.discount || 0)).toString())
                }

                const populatedCart = saleData.items.map((item: any) => ({
                    productId: item.productId,
                    name: item.product.name,
                    price: item.product.price, // Use original product price, not discounted item price
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
        if (cart.length === 0) return alert('الرجاء إضافة منتجات للفاتورة')
        setLoading(true)

        let finalStatus = status;
        let finalPaid = finalTotal;

        if (status === 'CREDIT') {
            finalPaid = parseFloat(paidAmountInput) || 0;
            if (finalPaid >= finalTotal) {
                finalStatus = 'PAID';
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
                    paidAmount: finalPaid
                })
            })

            if (res.ok) {
                alert('تم تحديث الفاتورة بنجاح')
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
                                            {filteredProducts.map(product => (
                                                <tr key={product.id} className="hover:bg-blue-50/50 transition-colors group">
                                                    <td className="p-3 font-bold text-slate-800">{product.name}</td>
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
                                                    <td className="p-3 font-bold text-slate-800">{product.price.toLocaleString()}</td>
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
                                            ))}
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

                            <div className="mb-4 space-y-2 mt-2">
                                <Input
                                    label="اسم العميل"
                                    placeholder="اسم العميل (اختياري)"
                                    value={customer}
                                    onChange={(e) => setCustomer(e.target.value)}
                                    className="bg-gray-50"
                                />
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

                            <div className="space-y-3 bg-white pt-2">
                                {/* Discount Input */}
                                <div className="flex items-center gap-2 px-1">
                                    <span className="font-bold text-sm text-gray-600">خصم:</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                        className="h-10 w-full"
                                    />
                                </div>

                                <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-lg">
                                    <div>
                                        <span className="font-bold block text-xs opacity-70">الإجمالي النهائي</span>
                                        <span className="font-bold text-2xl">{finalTotal.toLocaleString()} <span className="text-sm font-normal text-gray-400">ج.س</span></span>
                                    </div>
                                    {(parseFloat(discount) > 0) && (
                                        <div className="text-right">
                                            <span className="block text-xs text-red-300 line-through">{subtotal.toLocaleString()}</span>
                                            <span className="text-xs text-green-400 font-bold">خصم {parseFloat(discount).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <span className="font-bold text-sm text-gray-600 block mb-1">المدفوع (للآجل):</span>
                                        <Input
                                            type="number"
                                            placeholder={finalTotal.toString()}
                                            value={paidAmountInput}
                                            onChange={e => setPaidAmountInput(e.target.value)}
                                            className="h-10 w-full bg-amber-50"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-bold text-sm text-gray-600 block mb-1">المتبقي:</span>
                                        <div className="h-10 flex items-center px-3 border border-red-200 rounded-lg bg-red-50 text-red-600 font-bold">
                                            {paidAmountInput === '' ? 0 : Math.max(0, finalTotal - parseFloat(paidAmountInput || '0')).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pb-2">
                                    <Button
                                        onClick={() => handleUpdate('PAID')}
                                        className="py-3 text-sm bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 shadow-lg"
                                        disabled={loading}
                                    >
                                        {loading ? '...' : (
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-bold">حفظ التعديلات (كاش)</span>
                                            </div>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={() => handleUpdate('CREDIT')}
                                        className="py-3 text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 shadow-lg"
                                        disabled={loading}
                                    >
                                        {loading ? '...' : (
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-bold">حفظ التعديلات (آجل)</span>
                                            </div>
                                        )}
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
