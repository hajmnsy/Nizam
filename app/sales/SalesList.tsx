'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Search, Eye } from 'lucide-react'
import Link from 'next/link'

interface Sale {
    id: number
    customer: string | null
    total: number
    createdAt: Date
    items: any[]
}

interface SalesListProps {
    initialSales: Sale[]
}

export default function SalesList({ initialSales }: SalesListProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredSales = initialSales.filter(sale => {
        const term = searchTerm.toLowerCase()
        const customer = (sale.customer || 'نقدي').toLowerCase()
        const id = sale.id.toString()
        return customer.includes(term) || id.includes(term)
    })

    return (
        <Card noPadding>
            <div className="p-5">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-lg text-gray-800">آخر الفواتير</h3>
                    <div className="relative w-72">
                        <input
                            placeholder="بحث باسم العميل أو رقم الفاتورة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 hover:border-slate-300 transition-all duration-200 placeholder:text-gray-400 text-sm"
                        />
                        <Search className="absolute right-3 top-3 text-gray-400" size={18} />
                    </div>
                </div>

                {filteredSales.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        <ShoppingCartEmpty />
                        <p className="mt-3 font-medium">لا توجد فواتير مطابقة للبحث</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-5">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>رقم الفاتورة</th>
                                    <th>العميل</th>
                                    <th>التاريخ</th>
                                    <th>عدد الأصناف</th>
                                    <th>الإجمالي</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td className="font-bold text-sky-600">#{sale.id}</td>
                                        <td className="font-medium">{sale.customer || 'نقدي'}</td>
                                        <td className="text-gray-500">{new Date(sale.createdAt).toLocaleDateString('ar-SD')}</td>
                                        <td>
                                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold">{sale.items.length}</span>
                                        </td>
                                        <td className="font-extrabold text-emerald-600">
                                            {sale.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.س
                                        </td>
                                        <td>
                                            <Link href={`/sales/${sale.id}`} className="inline-flex items-center gap-1.5 text-sky-500 hover:text-sky-700 font-medium text-sm transition-colors">
                                                <Eye size={16} />
                                                عرض
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Card>
    )
}

function ShoppingCartEmpty() {
    return (
        <svg className="mx-auto w-16 h-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
    )
}
