'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Users, Search, ShoppingBag, TrendingUp, Crown, Star } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Customer {
    name: string
    totalSpent: number
    saleCount: number
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetch('/api/customers')
            .then(res => res.json())
            .then(data => {
                setCustomers(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(console.error)
    }, [])

    const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <main className="min-h-screen page-bg">
            <Navbar />
            <div className="container mx-auto p-4 max-w-7xl animate-fade-in-up">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div className="bg-white/80 p-4 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm">
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2 gradient-text">
                            <Users size={32} className="text-indigo-600" />
                            سجل العملاء
                        </h1>
                        <p className="text-slate-600 font-medium mt-1">قائمة كبار العملاء وسجل المشتريات</p>
                    </div>
                    <div className="relative w-full md:w-96 shadow-sm">
                        <Search className="absolute right-3 top-3 text-indigo-400" size={20} />
                        <Input
                            placeholder="ابحث عن اسم العميل..."
                            className="pr-10 py-3 border-indigo-100 focus:border-indigo-400 focus:ring-indigo-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-indigo-800 font-bold animate-pulse">جاري تحميل بيانات العملاء...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((customer, index) => (
                            <div key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 relative overflow-hidden group bg-white">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                                    {index < 3 && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-orange-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-black shadow-sm flex items-center gap-1 z-10">
                                            <Crown size={12} fill="white" />
                                            VIP
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mb-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner
                                            ${index === 0 ? 'bg-amber-100 text-amber-600' :
                                                index === 1 ? 'bg-slate-200 text-slate-600' :
                                                    index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-lg text-slate-800 leading-tight mb-1">{customer.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                                                <ShoppingBag size={12} />
                                                {customer.saleCount} فاتورة
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/80 -mx-6 -mb-6 p-4 border-t border-slate-100 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">إجمالي المشتريات</p>
                                            <p className="text-xl font-black text-slate-800 tracking-tight">
                                                {customer.totalSpent.toLocaleString()}
                                                <span className="text-xs font-bold text-slate-400 mr-1">ج.س</span>
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:text-indigo-600 transition-all">
                                            <TrendingUp size={16} className="text-slate-400" />
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}

                {filtered.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد عملاء</h3>
                        <p className="text-slate-400">لم يتم العثور على عملاء بهذا الاسم</p>
                    </div>
                )}

            </div>
        </main>
    )
}
