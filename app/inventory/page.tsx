'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, Edit, Plus, Trash2, Search, Save, X, Loader2, Settings, DollarSign, Package } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'

interface Product {
    id: number
    name: string
    type: string | null
    quantity: number
    price: number
    categoryId: number
    category: { name: string }
}

export default function Inventory() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState({ quantity: 0, price: 0 })
    const [saving, setSaving] = useState(false)
    const [exchangeRate, setExchangeRate] = useState<number>(0)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = () => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data)
                setLoading(false)
            })
    }

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
        await fetch(`/api/products/${id}`, { method: 'DELETE' })
        fetchProducts()
    }

    const startEdit = (product: Product) => {
        setEditingId(product.id)
        setEditForm({ quantity: product.quantity, price: product.price })
    }

    const cancelEdit = () => {
        setEditingId(null)
    }

    const saveEdit = async (id: number) => {
        setSaving(true)
        try {
            const res = await fetch('/api/products/quick-edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    quantity: editForm.quantity,
                    price: editForm.price
                })
            })

            if (res.ok) {
                setProducts(prev => prev.map(p =>
                    p.id === id ? { ...p, quantity: editForm.quantity, price: editForm.price } : p
                ))
                setEditingId(null)
            }
        } catch (error) {
            console.error('Failed to save', error)
        } finally {
            setSaving(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-gray-500 hover:text-blue-600">
                            <ArrowLeft />
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-800">إدارة المخزون</h1>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                            {products.length} منتج
                        </span>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                            <Input
                                placeholder="بحث..."
                                className="pr-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Link href="/inventory/add">
                            <Button className="flex items-center gap-2">
                                <Plus size={20} />
                                منتج جديد
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Total Value Summary Card */}
                {!loading && products.length > 0 && (
                    <Card className="mb-6 bg-white border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                        {/* Decorative Background Icon */}
                        <div className="absolute left-0 top-0 opacity-5 pointer-events-none -translate-x-1/4 -translate-y-1/4">
                            <Package size={200} />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            {/* Value in SDG */}
                            <div className="flex flex-col items-center md:items-start text-center md:text-right w-full md:w-auto">
                                <span className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-2">
                                    إجمالي قيمة المخزون الحالية
                                </span>
                                <div className="text-3xl font-black text-slate-800">
                                    {(products.reduce((sum, p) => sum + (p.quantity * p.price), 0)).toLocaleString()} <span className="text-lg text-slate-500 font-bold">ج.س</span>
                                </div>
                            </div>

                            {/* Divider on desktop */}
                            <div className="hidden md:block w-px h-16 bg-slate-200"></div>

                            {/* Exchange Rate Input */}
                            <div className="flex flex-col items-center flex-1 max-w-sm w-full">
                                <label className="text-xs font-bold text-slate-500 mb-2">سعر صرف الدولار اليوم</label>
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 w-full focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                    <DollarSign size={20} className="text-emerald-500" />
                                    <input
                                        type="number"
                                        placeholder="أدخل سعر الصرف هنا..."
                                        value={exchangeRate || ''}
                                        onChange={(e) => setExchangeRate(Number(e.target.value))}
                                        className="bg-transparent border-none outline-none font-bold text-emerald-700 w-full text-center"
                                    />
                                </div>
                            </div>

                            {/* Value in USD */}
                            {exchangeRate > 0 && (
                                <>
                                    {/* Divider on desktop */}
                                    <div className="hidden md:block w-px h-16 bg-slate-200"></div>

                                    <div className="flex flex-col items-center md:items-end text-center md:text-left w-full md:w-auto bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 md:border-none md:bg-transparent md:p-0">
                                        <span className="text-sm font-bold text-emerald-600 mb-1 flex items-center gap-1">
                                            القيمة التقريبية بالدولار
                                        </span>
                                        <div className="text-3xl font-black text-emerald-700 font-mono">
                                            ${(products.reduce((sum, p) => sum + (p.quantity * p.price), 0) / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                )}

                <Card className="overflow-hidden border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-4">اسم المنتج</th>
                                    <th className="p-4">الكمية</th>
                                    <th className="p-4">السعر</th>
                                    <th className="p-4">الحالة</th>
                                    <th className="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">لا توجد منتجات</td>
                                    </tr>
                                ) : (
                                    filteredProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4 font-medium text-slate-800">{product.name}</td>

                                            {/* Editable Quantity */}
                                            <td className="p-4">
                                                {editingId === product.id ? (
                                                    <input
                                                        type="number"
                                                        className="w-20 p-1 border rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={editForm.quantity}
                                                        onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                                                    />
                                                ) : (
                                                    <span className={`font-bold ${product.quantity < 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                                                        {product.quantity}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Editable Price */}
                                            <td className="p-4">
                                                {editingId === product.id ? (
                                                    <input
                                                        type="number"
                                                        className="w-24 p-1 border rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={editForm.price}
                                                        onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                    />
                                                ) : (
                                                    <span className="text-slate-700">{product.price.toLocaleString()}</span>
                                                )}
                                            </td>

                                            <td className="p-4">
                                                {product.quantity === 0 ? (
                                                    <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">نفد المخزون</span>
                                                ) : product.quantity < 10 ? (
                                                    <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full">منخفض</span>
                                                ) : (
                                                    <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">متوفر</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4">
                                                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    {editingId === product.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => saveEdit(product.id)}
                                                                disabled={saving}
                                                                className="p-1 px-2 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                                                            >
                                                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                <span className="text-xs">حفظ</span>
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="p-1 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link
                                                                href={`/inventory/edit/${product.id}`}
                                                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                                                                title="تعديل شامل (الاسم وتفاصيل أخرى)"
                                                            >
                                                                <Settings size={16} />
                                                            </Link>
                                                            <button
                                                                onClick={() => startEdit(product)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                                title="تعديل سريع (الكمية والسعر)"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(product.id)}
                                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                                title="حذف"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </main>
    )
}
