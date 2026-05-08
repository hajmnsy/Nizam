'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Trash2, Package, Save, ArrowRight, Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Product {
    id: number
    name: string
    quantity: number
    type?: string
    thickness?: number
    purchasePriceUSD: number
    price: number
}

interface PurchaseItem {
    productId: string
    quantity: number
    price: number
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
    const [date, setDate] = useState(getTodayLocal())
    
    const [items, setItems] = useState<PurchaseItem[]>([
        { productId: '', quantity: 1, price: 0 }
    ])

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data)
                setLoading(false)
            })
    }, [])

    const addItem = () => {
        setItems([...items, { productId: '', quantity: 1, price: 0 }])
    }

    const removeItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        
        // Auto-fill price if product is selected
        if (field === 'productId' && value) {
            const product = products.find(p => p.id.toString() === value)
            if (product) {
                // If purchasePriceUSD exists and there's an exchange rate, could calculate, but default to current selling price or 0
                newItems[index].price = product.price || 0
            }
        }
        
        setItems(newItems)
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (items.some(item => !item.productId || item.quantity <= 0)) {
            alert('يرجى التحقق من جميع الأصناف والكميات')
            return
        }

        setSubmitting(true)

        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceNumber,
                    supplier: supplier || 'مورد عام',
                    createdAt: date,
                    items
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

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-5xl animate-fade-in-up">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/purchases">
                        <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <ArrowRight className="text-slate-600" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="text-purple-500" />
                            فاتورة مشتريات جديدة
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            إدخال المشتريات وإضافتها تلقائياً إلى رصيد المخزن
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-6 border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المورد</label>
                                <input
                                    type="text"
                                    value={supplier}
                                    onChange={e => setSupplier(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 transition-all font-bold text-slate-800"
                                    placeholder="مورد عام"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">رقم الفاتورة (اختياري)</label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 transition-all font-bold text-slate-800"
                                    placeholder="INV-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    تاريخ الفاتورة
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 transition-all font-bold text-slate-800"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm">
                        <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700">الأصناف المشتراة</h2>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">الصنف</label>
                                        <select
                                            value={item.productId}
                                            onChange={e => updateItem(index, 'productId', e.target.value)}
                                            required
                                            className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-bold text-slate-800"
                                        >
                                            <option value="">-- اختر الصنف --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.type ? `- ${p.type}` : ''} {p.thickness ? `(${p.thickness}mm)` : ''} (المخزن: {p.quantity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-32">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">الكمية</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            required
                                            className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="w-full md:w-48">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">سعر الشراء (للوحدة)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.price}
                                            onChange={e => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                            required
                                            className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="w-full md:w-32 pb-2">
                                        <div className="text-sm font-bold text-slate-500">الإجمالي:</div>
                                        <div className="font-black text-purple-700">{(item.price * item.quantity).toLocaleString()} ج</div>
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="حذف الصنف"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItem}
                                className="w-full py-4 border-dashed border-2 text-slate-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 font-bold"
                            >
                                <Plus size={20} className="mr-2" />
                                إضافة صنف آخر
                            </Button>
                        </div>
                    </Card>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 sticky bottom-4 z-10">
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">إجمالي الفاتورة</p>
                            <p className="text-3xl font-black text-slate-800">{total.toLocaleString()} <span className="text-lg text-slate-500 font-bold">ج.س</span></p>
                        </div>
                        
                        <Button
                            type="submit"
                            disabled={submitting || items.length === 0}
                            className="w-full md:w-auto px-12 py-4 bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-200 text-lg flex justify-center items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <Save />}
                            حفظ وتحديث المخزن
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    )
}
