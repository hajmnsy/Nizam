'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Activity, Package, ArrowDown, ArrowUp, Loader2, Printer } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Product {
    id: number
    name: string
    quantity: number
    type?: string
    thickness?: number
}

interface HistoryItem {
    type: 'SALE' | 'PURCHASE'
    date: string
    invoiceNumber: string
    customerOrSupplier: string
    quantity: number
    price: number
}

export default function ItemsReport() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string>('')
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(false)
    const [initialLoad, setInitialLoad] = useState(true)

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data)
                setInitialLoad(false)
            })
    }, [])

    useEffect(() => {
        if (!selectedProduct) {
            setHistory([])
            return
        }

        setLoading(true)
        fetch(`/api/reports/items?productId=${selectedProduct}`)
            .then(res => res.json())
            .then(data => {
                setHistory(data.history || [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [selectedProduct])

    const getProductStock = () => {
        if (!selectedProduct) return null
        const product = products.find(p => p.id.toString() === selectedProduct)
        return product ? product.quantity : null
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-7xl animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="text-blue-500" />
                            تقرير حركة الأصناف
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            تتبع حركات البيع والشراء للصنف مع أرقام الفواتير
                        </p>
                    </div>
                    {selectedProduct && history.length > 0 && (
                        <Button
                            onClick={handlePrint}
                            className="flex items-center gap-2 py-2 px-4 shadow-sm bg-slate-800 hover:bg-slate-900"
                        >
                            <Printer size={18} />
                            طباعة التقرير
                        </Button>
                    )}
                </div>

                <div className="hidden print:block text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">تقرير حركة الصنف</h1>
                    <p className="text-lg font-bold text-slate-600">
                        {products.find(p => p.id.toString() === selectedProduct)?.name} 
                        {products.find(p => p.id.toString() === selectedProduct)?.type && ` | النوع: ${products.find(p => p.id.toString() === selectedProduct)?.type}`}
                        {products.find(p => p.id.toString() === selectedProduct)?.thickness && ` | السماكة: ${products.find(p => p.id.toString() === selectedProduct)?.thickness}مم`}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SD')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:hidden">
                    <Card className="col-span-1 md:col-span-2 p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
                        <label className="block text-sm font-bold text-slate-700 mb-2">اختر الصنف لعرض حركته:</label>
                        {initialLoad ? (
                            <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={16}/> جاري تحميل الأصناف...</div>
                        ) : (
                            <select
                                value={selectedProduct}
                                onChange={e => setSelectedProduct(e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-slate-800 transition-all bg-white"
                            >
                                <option value="">-- اختر الصنف --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.type ? `| النوع: ${p.type}` : ''} {p.thickness ? `| السماكة: ${p.thickness}مم` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </Card>

                    <Card className="col-span-1 p-6 border border-slate-200 shadow-sm bg-blue-50 flex flex-col items-center justify-center text-center">
                        <Package size={32} className="text-blue-400 mb-2" />
                        <h3 className="text-sm font-bold text-slate-600 mb-1">الرصيد الحالي بالمخزن</h3>
                        {selectedProduct ? (
                            <p className="text-3xl font-black text-blue-700">{getProductStock()}</p>
                        ) : (
                            <p className="text-slate-400 text-sm">-</p>
                        )}
                    </Card>
                </div>

                {selectedProduct && (
                    <Card className="overflow-hidden border border-slate-200 shadow-sm print:shadow-none print:border-none">
                        <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:bg-transparent print:p-0 print:mb-4">
                            <h2 className="font-bold text-slate-700 print:hidden">سجل الحركات</h2>
                        </div>
                        <div className="overflow-x-auto print:overflow-visible">
                            <table className="w-full text-right">
                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-black">
                                    <tr>
                                        <th className="p-4 print:p-2">نوع الحركة</th>
                                        <th className="p-4 print:p-2">التاريخ</th>
                                        <th className="p-4 print:p-2">رقم الفاتورة</th>
                                        <th className="p-4 print:p-2">الجهة (عميل / مورد)</th>
                                        <th className="p-4 print:p-2">الكمية</th>
                                        <th className="p-4 print:p-2">السعر</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500">
                                                <Loader2 className="animate-spin mx-auto mb-2 text-blue-500" size={24} />
                                                جاري التحميل...
                                            </td>
                                        </tr>
                                    ) : history.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400">
                                                لا توجد حركات بيع أو شراء مسجلة لهذا الصنف
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((h, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors print:border-b print:border-slate-200">
                                                <td className="p-4 print:p-2">
                                                    {h.type === 'SALE' ? (
                                                        <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit print:bg-transparent print:text-black">
                                                            <ArrowDown size={14} className="print:hidden" /> بيع (صادر)
                                                        </span>
                                                    ) : (
                                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit print:bg-transparent print:text-black">
                                                            <ArrowUp size={14} className="print:hidden" /> شراء (وارد)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 print:p-2 text-slate-600 print:text-black text-sm font-bold">
                                                    {new Date(h.date).toLocaleDateString('ar-SD')}
                                                    <br/>
                                                    <span className="text-xs text-slate-400 font-normal">
                                                        {new Date(h.date).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="p-4 print:p-2 font-mono font-bold text-slate-700 print:text-black">#{h.invoiceNumber}</td>
                                                <td className="p-4 print:p-2 font-bold text-slate-800 print:text-black">{h.customerOrSupplier}</td>
                                                <td className="p-4 print:p-2">
                                                    <span className={`font-black print:text-black ${h.type === 'SALE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {h.type === 'SALE' ? '-' : '+'}{h.quantity}
                                                    </span>
                                                </td>
                                                <td className="p-4 print:p-2 font-bold text-slate-700 print:text-black">{h.price.toLocaleString()} ج</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </main>
    )
}
