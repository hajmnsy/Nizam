'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ProformaInvoice } from '@/components/ProformaInvoice'
import { ArrowLeft, Plus, Trash2, Search, Minus, FileText, Printer, Save } from 'lucide-react'
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

export default function NewSale() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [customer, setCustomer] = useState('')
    const [loading, setLoading] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        Promise.all([
            fetch('/api/products').then(res => res.json()),
            fetch('/api/categories').then(res => res.json())
        ]).then(([productsData, categoriesData]) => {
            setProducts(productsData)

            // Filter out specific categories
            const hiddenCategories = ['قطاعات', 'مسطحات', 'مواسير', 'سيخ']
            const visibleCategories = categoriesData.filter((cat: Category) => !hiddenCategories.includes(cat.name))

            setCategories(visibleCategories)
            if (visibleCategories.length > 0) {
                setActiveCategory(visibleCategories[0].name)
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
            // Function to extract and multiply dimensions from name (e.g. "ماسورة 40*80" -> 40 * 80 = 3200)
            const getDimensionsMultiplier = (name: string) => {
                const numbers = name.match(/\d+(\.\d+)?/g);
                if (!numbers || numbers.length === 0) return 0;
                // If it looks like dimensions "40*80" or just one number "16"
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

    const [discount, setDiscount] = useState<string>('')
    const [paidAmountInput, setPaidAmountInput] = useState<string>('')

    const totalWeight = cart.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const finalTotal = subtotal - (parseFloat(discount) || 0)

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
                    paidAmount: finalPaid
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
            <main className="min-h-screen bg-slate-50 flex flex-col print:hidden">
                <Navbar />
                <div className="flex-1 container mx-auto p-4 max-w-7xl">
                    <div className="mb-4 flex justify-between items-center">
                        <Link href="/sales" className="text-blue-600 hover:underline flex items-center gap-1">
                            <ArrowLeft size={16} />
                            رجوع للمبيعات
                        </Link>
                        <h1 className="text-2xl font-bold">نقطة البيع (POS)</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-150px)]">
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

                            {/* Products Grid */}
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
                            <Card className="flex flex-col h-full border-2 border-blue-100 shadow-xl overflow-hidden">
                                <div className="bg-blue-50 -m-6 mb-4 p-4 border-b border-blue-100">
                                    <h2 className="font-bold text-blue-900 flex items-center gap-2">
                                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{cart.length}</span>
                                        سلة المشتريات
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
                                                        <div className="flex flex-col items-end">
                                                            {discountRatio > 0 && (
                                                                <span className="text-xs text-gray-400 line-through">{itemOriginalTotal.toLocaleString()}</span>
                                                            )}
                                                            <span className="font-bold text-blue-600">
                                                                {itemDiscountedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                            </span>
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
                                            onClick={() => handleSubmit('PAID')}
                                            className="py-3 text-sm bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 shadow-lg"
                                            disabled={loading}
                                        >
                                            {loading ? '...' : (
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="font-bold">كاش (خالص)</span>
                                                </div>
                                            )}
                                        </Button>

                                        <Button
                                            onClick={() => handleSubmit('CREDIT')}
                                            className="py-3 text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 shadow-lg"
                                            disabled={loading}
                                        >
                                            {loading ? '...' : (
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="font-bold">آجل (دفع جزئي)</span>
                                                </div>
                                            )}
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={() => handleSubmit('QUOTATION')}
                                        variant="outline"
                                        className="w-full py-3 text-sm border-blue-200 hover:bg-blue-50 text-blue-700"
                                        disabled={loading}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText size={18} />
                                            <span className="font-bold">حفظ كمسودة / عرض سعر</span>
                                        </div>
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
