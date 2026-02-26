'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Trash2, Plus, Wallet, Receipt, Calendar, Filter, Tag, Package } from 'lucide-react'
import { useState, useEffect } from 'react'

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
    { id: 'عام', label: 'إيجار وكهرباء (عام)', color: 'bg-amber-100 text-amber-700' },
    { id: 'الفطور', label: 'الفطور', color: 'bg-rose-100 text-rose-700' },
    { id: 'صدقة', label: 'صدقة', color: 'bg-purple-100 text-purple-700' },
]

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'توريدات'
    })
    const [submitting, setSubmitting] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    useEffect(() => {
        fetchExpenses()
    }, [])

    const fetchExpenses = () => {
        fetch('/api/expenses')
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
                    date: new Date().toISOString().split('T')[0],
                    category: 'توريدات'
                })
                fetchExpenses()
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
        ? expenses
        : expenses.filter(e => e.category === selectedCategory)

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
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                            <Wallet className="text-red-500" />
                            إدارة المصروفات
                        </h1>
                        <p className="text-gray-500 mt-1">تتبع النفقات حسب التصنيف لمراقبة الميزانية</p>
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
                                    {CATEGORIES.slice(0, 3).map(cat => (
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
                                                <Calendar size={12} />
                                                {new Date(expense.date).toLocaleDateString('ar-SD')}
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
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
                                <div className="text-center py-12 text-gray-400">
                                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>لا توجد مصروفات في هذا التصنيف</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
