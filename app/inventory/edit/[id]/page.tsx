'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Category {
    id: number
    name: string
}

export default function EditProduct() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        price: '',
        length: '',
        thickness: '',
        width: '',
        weightPerUnit: '',
        quantity: '',
        categoryId: ''
    })

    useEffect(() => {
        // Fetch categories and product data
        Promise.all([
            fetch('/api/categories').then(res => res.json()),
            fetch(`/api/products/${params.id}`).then(res => res.json())
        ])
            .then(([cats, product]) => {
                const hiddenCategories = ['قطاعات', 'مسطحات', 'مواسير', 'سيخ']
                const visibleCategories = cats.filter((cat: Category) => !hiddenCategories.includes(cat.name))

                setCategories(visibleCategories)
                setFormData({
                    name: product.name,
                    type: product.type || '',
                    price: product.price.toString(),
                    length: product.length?.toString() || '',
                    thickness: product.thickness?.toString() || '',
                    width: product.width?.toString() || '',
                    weightPerUnit: product.weightPerUnit.toString(),
                    quantity: product.quantity.toString(),
                    categoryId: product.categoryId?.toString() || (visibleCategories.length > 0 ? visibleCategories[0].id.toString() : '')
                })
            })
            .catch(err => alert('خطأ في تحميل البيانات'))
            .finally(() => setLoading(false))
    }, [params.id])

    // Auto-calculate weight when dimensions change (same logic as Add)
    useEffect(() => {
        if (!loading) {
            const l = parseFloat(formData.length) || 0
            const w = parseFloat(formData.width) || 0
            const t = parseFloat(formData.thickness) || 0

            if (l > 0 && w > 0 && t > 0) {
                const volume = l * (w / 1000) * (t / 1000)
                const weight = volume * 7850
                // setFormData(prev => ({ ...prev, weightPerUnit: weight.toFixed(2) }))
            }
        }
    }, [formData.length, formData.width, formData.thickness, loading])


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const res = await fetch(`/api/products/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    categoryId: parseInt(formData.categoryId)
                })
            })

            if (res.ok) {
                router.push('/inventory')
                router.refresh()
            } else {
                alert('حدث خطأ أثناء تحديث المنتج')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ غير متوقع')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return

        setSaving(true)
        try {
            const res = await fetch(`/api/products/${params.id}`, { method: 'DELETE' })
            if (res.ok) {
                router.push('/inventory')
                router.refresh()
            } else {
                alert('حدث خطأ أثناء الحذف')
            }
        } catch (e) {
            alert('حدث خطأ')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-2xl">
                <div className="mb-6 flex justify-between items-center">
                    <Link href="/inventory" className="text-blue-600 hover:underline flex items-center gap-1">
                        <ArrowLeft size={16} />
                        رجوع للمخزون
                    </Link>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete} disabled={saving}>
                        <Trash2 size={16} className="ml-2" /> حذف المنتج
                    </Button>
                </div>

                <Card>
                    <h2 className="text-xl font-bold mb-4">تعديل منتج</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            name="name"
                            label="اسم المنتج"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                name="type"
                                label="النوع"
                                value={formData.type}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                name="price"
                                label="السعر (ج.س)"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                name="quantity"
                                label="الكمية المتاحة"
                                type="number"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                name="length"
                                label="الطول (متر)"
                                type="number"
                                step="0.01"
                                value={formData.length}
                                onChange={handleChange}
                            />
                            <Input
                                name="thickness"
                                label="السمك (مم)"
                                type="number"
                                step="0.01"
                                value={formData.thickness}
                                onChange={handleChange}
                            />
                            <Input
                                name="width"
                                label="العرض (مم)"
                                type="number"
                                step="0.01"
                                value={formData.width}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Input
                                name="weightPerUnit"
                                label="الوزن للقطعة (كجم)"
                                type="number"
                                step="0.01"
                                value={formData.weightPerUnit}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={saving}>
                                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </main>
    )
}
