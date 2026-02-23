import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Package, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function WarehouseDashboard() {
    const paidOrders = await prisma.sale.findMany({
        where: { status: 'PAID' },
        orderBy: { createdAt: 'asc' }, // Oldest first for FIFO
        include: { items: true }
    })

    const deliveredToday = await prisma.sale.count({
        where: {
            status: 'DELIVERED',
            createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        }
    })

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-7xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">إدارة المخزن (التسليمات)</h1>
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                        <CheckCircle size={20} />
                        تم تسليم اليوم: {deliveredToday}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paidOrders.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <Clock size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-xl">لا توجد طلبات معلقة حالياً</p>
                        </div>
                    ) : (
                        paidOrders.map(order => (
                            <Card key={order.id} className="border-t-4 border-yellow-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">طلب #{order.id}</h3>
                                        <p className="text-sm text-gray-500">{order.customer || 'عميل نقدي'}</p>
                                    </div>
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                        قيد الانتظار
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">عدد الأصناف:</span>
                                        <span className="font-bold">{order.items.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">التوقيت:</span>
                                        <span>{new Date(order.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <Link href={`/warehouse/${order.id}`}>
                                    <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
                                        <Package size={18} />
                                        عرض وتجهيز
                                    </Button>
                                </Link>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </main>
    )
}
