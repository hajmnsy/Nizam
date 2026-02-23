'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft, Check, Package as PackageIcon } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface SaleItem {
    id: number
    productName: string // Note: API needs to return this, or include product relation
    // Actually standard API returns product relation usually if asked.
    // Let's assume standard structure from our API
    product: {
        name: string
    }
    quantity: number
}

interface Sale {
    id: number
    customer: string
    createdAt: string
    status: string
    items: SaleItem[]
}

export default function WarehouseOrderDetails() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<Sale | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetch(`/api/sales/${params.id}`)
            .then(res => res.json())
            .then(data => setOrder(data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [params.id])

    const handleDeliver = async () => {
        if (!confirm('هل تم تسليم جميع الأصناف للعميل؟')) return

        setProcessing(true)
        try {
            const res = await fetch(`/api/sales/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DELIVERED' })
            })

            if (res.ok) {
                router.push('/warehouse')
                router.refresh()
            } else {
                alert('حدث خطأ أثناء تحديث الحالة')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال')
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>
    if (!order) return <div className="p-8 text-center text-red-500">الطلب غير موجود</div>

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-4xl">
                <div className="mb-6">
                    <Link href="/warehouse" className="text-blue-600 hover:underline flex items-center gap-1">
                        <ArrowLeft size={16} />
                        رجوع للمخزن
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <Card>
                            <div className="border-b pb-4 mb-4 flex justify-between items-center">
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    <PackageIcon className="text-blue-600" />
                                    تجهيز طلب #{order.id}
                                </h1>
                                <span className={`px-3 py-1 rounded text-sm font-bold ${order.status === 'PAID' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {order.status === 'PAID' ? 'بانتظار التسليم' : 'تم التسليم'}
                                </span>
                            </div>

                            <div className="mb-6 bg-gray-50 p-4 rounded">
                                <p className="text-gray-500 text-sm">العميل</p>
                                <p className="font-bold text-lg">{order.customer || 'عميل نقدي'}</p>
                                <p className="text-gray-400 text-xs mt-1">{new Date(order.createdAt).toLocaleString('ar-SD')}</p>
                            </div>

                            <div>
                                <h3 className="font-bold mb-3">قائمة الأصناف للتجهيز:</h3>
                                <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 bg-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-medium">
                                                    {/* Accessing product name safely, assuming included relation or flattened structure from API override */}
                                                    {/* Based on previous API GET, it returns items with nested product: { product: { ... } } */}
                                                    {/* Or standard include: items: { include: { product: true } } in GET /api/sales/[id] */}
                                                    {/* Let's verify API response structure in next step if needed, but assuming standard Include */}
                                                    {(item as any).product?.name || (item as any).productName || 'منتج غير معروف'}
                                                </span>
                                            </div>
                                            <div className="font-bold text-lg bg-gray-100 px-3 py-1 rounded">
                                                {item.quantity} <span className="text-xs font-normal text-gray-500">قطعة</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div>
                        <Card className="sticky top-4">
                            <h2 className="font-bold mb-4">إجراءات</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                بعد التأكد من تجهيز كافة الأصناف وتسليمها للعميل، اضغط على الزر أدناه لإكمال الطلب.
                            </p>
                            <Button
                                onClick={handleDeliver}
                                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg shadow-lg shadow-green-200"
                                disabled={processing || order.status === 'DELIVERED'}
                            >
                                {processing ? 'جاري التحديث...' : (
                                    <span className="flex items-center gap-2 justify-center">
                                        <Check size={24} />
                                        تأكيد التسليم
                                    </span>
                                )}
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    )
}
