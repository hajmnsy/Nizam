'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
    id: number
    name: string
}

export default function AddProduct() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
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
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                const hiddenCategories = ['قطاعات', 'مسطحات', 'مواسير', 'سيخ']
                const visibleCategories = data.filter((cat: Category) => !hiddenCategories.includes(cat.name))

                setCategories(visibleCategories)
                if (visibleCategories.length > 0) {
                    setFormData(prev => ({ ...prev, categoryId: visibleCategories[0].id.toString() }))
                }
            })
            .catch(console.error)
    }, [])

    // Auto-calculate weight when dimensions change
    useEffect(() => {
        const l = parseFloat(formData.length) || 0
        const w = parseFloat(formData.width) || 0
        const t = parseFloat(formData.thickness) || 0

        if (l > 0 && w > 0 && t > 0) {
            // Density of steel approx 7850 kg/m3
            // Length in meters, Width/Thickness in mm -> convert to m
            const volume = l * (w / 1000) * (t / 1000)
            const weight = volume * 7850
            setFormData(prev => ({ ...prev, weightPerUnit: weight.toFixed(2) }))
        }
    }, [formData.length, formData.width, formData.thickness])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                router.push('/inventory')
                router.refresh()
            } else {
                alert('حدث خطأ أثناء حفظ المنتج')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ غير متوقع')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-2xl">
                <div className="mb-6">
                    <Link href="/inventory" className="text-blue-600 hover:underline flex items-center gap-1">
                        <ArrowLeft size={16} />
                        رجوع للمخزون
                    </Link>
                </div>

                <Card>
                    <h2 className="text-xl font-bold mb-4">إضافة منتج جديد</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            name="name"
                            label="اسم المنتج"
                            placeholder="مثال: حديد تسليح 12 مم"
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
                                label="النوع (اختياري)"
                                placeholder="مثال: مشرشر / أملس"
                                value={formData.type}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                name="price"
                                label="السعر"
                                type="number"
                                placeholder="0.00"
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
                                step="any"
                                value={formData.length}
                                onChange={handleChange}
                            />
                            <Input
                                name="thickness"
                                label="السمك (مم)"
                                type="number"
                                step="any"
                                value={formData.thickness}
                                onChange={handleChange}
                            />
                            <Input
                                name="width"
                                label="العرض (مم)"
                                type="number"
                                step="any"
                                value={formData.width}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Input
                                name="weightPerUnit"
                                label="الوزن للقطعة (كجم) - يحسب تلقائياً من الأبعاد"
                                type="number"
                                step="any"
                                value={formData.weightPerUnit}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </main>
    )
}
