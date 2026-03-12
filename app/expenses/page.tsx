'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Trash2, Plus, Wallet, Receipt, Calendar as CalendarIcon, Filter, Tag, Package, ChevronRight, ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Expense {
    id: number
    description: string
    amount: number
    date: string
    category: string
}

const CATEGORIES = [
    { id: 'توريدات', label: 'توريدات', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'عتالة وترحيل', label: 'عتالة وترحيل', color: 'bg-blue-100 text-blue-700' },
    { id: 'عام', label: 'عام', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'الفطور', label: 'الفطور', color: 'bg-rose-100 text-rose-700' },
    { id: 'صدقة', label: 'صدقة', color: 'bg-purple-100 text-purple-700' },
    { id: 'الرواتب', label: 'الرواتب', color: 'bg-indigo-100 text-indigo-700' },
]

export default function ExpensesPage() {
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [date, setDate] = useState(getTodayLocal())
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)

    const changeDateByDays = (days: number) => {
        if (!date) {
            setDate(getTodayLocal());
            return;
        }
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + days);
        const newDateStr = currentDate.toISOString().split('T')[0];
        setDate(newDateStr);
    }
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        date: getTodayLocal(),
        category: 'توريدات'
    })
    const [submitting, setSubmitting] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    useEffect(() => {
        fetchExpenses(date)
    }, [date])

    const fetchExpenses = (selectedDate: string) => {
        setLoading(true)
        fetch(`/api/expenses?date=${selectedDate}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setExpenses(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newExpense.description || !newExpense.amount) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            })

            if (res.ok) {
                setNewExpense({
                    description: '',
                    amount: '',
                    date: date,
                    category: 'توريدات'
                })
                fetchExpenses(date)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return
        try {
            await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
            setExpenses(prev => prev.filter(e => e.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    const filteredExpenses = selectedCategory === 'all'
        ? expenses.filter(e => e.category !== 'سعر الصرف')
        : expenses.filter(e => e.category === selectedCategory && e.category !== 'سعر الصرف')

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

    const getCategoryColor = (cat: string) => {
        return CATEGORIES.find(c => c.id === cat)?.color || 'bg-gray-100 text-gray-600'
    }

    if (loading) return <div className="p-8 text-center text-gray-500">جاري التحميل...</div>

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-6xl animate-fade-in-up">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                            <Wallet className="text-red-500" />
                            إدارة المصروفات
                        </h1>
                        <p className="text-gray-500 mt-1">تتبع النفقات حسب التاريخ والتصنيف لمراقبة الميزانية</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                        <div className="flex items-center bg-white rounded-lg border shadow-sm overflow-hidden">
                            <button
                                onClick={() => changeDateByDays(1)}
                                className="p-2 text-gray-500 hover:bg-gray-100 transition-colors border-l"
                                title="اليوم التالى"
                            >
                                <ChevronRight size={18} />
                            </button>
                            
                            <div className="flex items-center gap-2 px-3 py-2">
                                <CalendarIcon size={18} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-transparent border-none outline-none font-bold text-slate-700 w-32"
                                />
                            </div>

                            <button
                                onClick={() => changeDateByDays(-1)}
                                className="p-2 text-gray-500 hover:bg-gray-100 transition-colors border-r"
                                title="اليوم السابق"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                        <Link href="/expenses/report">
                            <Button className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2 h-full py-2">
                                <Receipt size={18} />
                                استخراج تقرير مفصل
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Form */}
                    <Card className="lg:col-span-1 h-fit sticky top-4">
                        <h2 className="font-bold mb-4 flex items-center gap-2">
                            <Plus className="text-blue-500" size={20} />
                            تسجيل مصروف جديد
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">الوصف</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded-lg"
                                    placeholder="مثال: فاتورة كهرباء"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">المبلغ</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded-lg"
                                    placeholder="0.00"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">التصنيف</label>
                                <select
                                    className="w-full border p-2 rounded-lg bg-white"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">التاريخ</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded-lg"
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting}>
                                {submitting ? 'جاري الحفظ...' : 'حفظ المصروف'}
                            </Button>
                        </form>
                    </Card>

                    {/* List & Filters */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary & Filter */}
                        <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="bg-red-50 p-2 rounded-lg text-red-600">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold">إجمالي المصروفات</p>
                                    <p className="text-xl font-black text-slate-800">{totalExpenses.toLocaleString()} ج.س</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-gray-400" />
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${selectedCategory === 'all' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        الكل
                                    </button>
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${selectedCategory === cat.id ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="p-12 text-center text-gray-500 font-bold">جاري تحميل مصروفات اليوم...</div>
                        ) : (
                            <div className="space-y-3">
                                {filteredExpenses.map(expense => (
                                    <div key={expense.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${getCategoryColor(expense.category)}`}>
                                                <Tag size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{expense.description}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <span>{CATEGORIES.find(c => c.id === expense.category)?.label || expense.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-lg text-slate-800">
                                                {expense.amount.toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredExpenses.length === 0 && (
                                    <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                        <Package size={48} className="mx-auto mb-2 opacity-50" />
                                        <p className="font-bold">لا توجد مصروفات مسجلة في هذا اليوم</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
