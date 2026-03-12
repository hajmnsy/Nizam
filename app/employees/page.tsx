'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Users, Plus, Pencil, Trash2, Banknote, HelpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Employee {
    id: number
    name: string
    monthlySalary: number
    isActive: boolean
    withdrawnAmount: number
    remainingBalance: number
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [monthName, setMonthName] = useState('')

    // Form
    const [newEmployee, setNewEmployee] = useState({ name: '', monthlySalary: '' })
    const [submitting, setSubmitting] = useState(false)

    // Edit Add Advance
    const [advanceModal, setAdvanceModal] = useState<{ isOpen: boolean; employeeId: number | null; employeeName: string; amount: string; description: string }>({
        isOpen: false,
        employeeId: null,
        employeeName: '',
        amount: '',
        description: 'سلفة'
    })

    useEffect(() => {
        fetchEmployees()
        const d = new Date()
        setMonthName(d.toLocaleString('ar-EG', { month: 'long', year: 'numeric' }))
    }, [])

    const fetchEmployees = () => {
        setLoading(true)
        fetch('/api/employees', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setEmployees(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmployee.name || !newEmployee.monthlySalary) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployee)
            })

            if (res.ok) {
                setNewEmployee({ name: '', monthlySalary: '' })
                fetchEmployees()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الموظف؟ إذا كان له سجلات سابقة سيتم إيقافه فقط ولن يحذف نهائياً.')) return
        try {
            const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchEmployees()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleAdvanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!advanceModal.amount || !advanceModal.employeeId) return

        try {
            // Register an expense under "الرواتب"
            const payload = {
                description: advanceModal.description,
                amount: advanceModal.amount,
                date: new Date().toISOString(),
                category: 'الرواتب',
                employeeId: advanceModal.employeeId
            }

            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setAdvanceModal({ isOpen: false, employeeId: null, employeeName: '', amount: '', description: 'سلفة' })
                fetchEmployees() // Refresh the balances
            }
        } catch (error) {
            console.error(error)
        }
    }

    const totalSalaries = employees.reduce((sum, emp) => sum + emp.monthlySalary, 0)
    const totalWithdrawn = employees.reduce((sum, emp) => sum + emp.withdrawnAmount, 0)
    const totalRemaining = employees.reduce((sum, emp) => sum + emp.remainingBalance, 0)

    return (
        <main className="min-h-screen bg-slate-50 pb-12">
            <Navbar />
            <div className="container mx-auto p-4 max-w-6xl animate-fade-in-up">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                            <Users className="text-indigo-600" />
                            إدارة الموظفين والرواتب
                        </h1>
                        <p className="text-gray-500 mt-1">تتبع رواتب الموظفين والسلفيات في شهر {monthName}</p>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
                            <Banknote size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-bold mb-1">إجمالي الرواتب الأساسية</p>
                            <p className="text-2xl font-black text-slate-800">{totalSalaries.toLocaleString()} ج.س</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-rose-50 rounded-xl text-rose-600">
                            <Banknote size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-bold mb-1">المسحوب هذا الشهر</p>
                            <p className="text-2xl font-black text-rose-600">{totalWithdrawn.toLocaleString()} ج.س</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
                            <Banknote size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-bold mb-1">المتبقي (الالتزامات)</p>
                            <p className="text-2xl font-black text-emerald-600">{totalRemaining.toLocaleString()} ج.س</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Employee Form */}
                    <Card className="lg:col-span-1 h-fit sticky top-4">
                        <h2 className="font-bold mb-4 flex items-center gap-2">
                            <Plus className="text-indigo-500" size={20} />
                            تسجيل موظف جديد
                        </h2>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">اسم الموظف</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded-lg bg-slate-50"
                                    placeholder="مثال: أحمد الدسوقي"
                                    value={newEmployee.name}
                                    onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">الراتب الشهري (بالجنيه)</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded-lg bg-slate-50 font-mono"
                                    placeholder="0"
                                    value={newEmployee.monthlySalary}
                                    onChange={e => setNewEmployee({ ...newEmployee, monthlySalary: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                                {submitting ? 'جاري الإضافة...' : 'إضافة الموظف'}
                            </Button>
                        </form>
                    </Card>

                    {/* Employees List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-right p-4 font-bold text-slate-600">الموظف</th>
                                            <th className="text-center p-4 font-bold text-slate-600">الراتب الإجمالي</th>
                                            <th className="text-center p-4 font-bold text-rose-600">المسحوب</th>
                                            <th className="text-center p-4 font-bold text-emerald-600">المتبقي</th>
                                            <th className="text-left p-4 font-bold text-slate-600">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">جاري تحميل بيانات الموظفين...</td>
                                            </tr>
                                        ) : employees.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لا يوجد موظفين مسجلين في النظام.</td>
                                            </tr>
                                        ) : (
                                            employees.map(emp => (
                                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-800">{emp.name}</div>
                                                        {!emp.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1 inline-block">موقوف</span>}
                                                    </td>
                                                    <td className="p-4 text-center font-mono font-bold text-slate-700">{emp.monthlySalary.toLocaleString()}</td>
                                                    <td className="p-4 text-center font-mono font-bold text-rose-600">{emp.withdrawnAmount.toLocaleString()}</td>
                                                    <td className="p-4 text-center font-mono font-black text-emerald-600">{emp.remainingBalance.toLocaleString()}</td>
                                                    <td className="p-4 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                                onClick={() => setAdvanceModal({
                                                                    isOpen: true,
                                                                    employeeId: emp.id,
                                                                    employeeName: emp.name,
                                                                    amount: '',
                                                                    description: 'سلفة'
                                                                })}
                                                                disabled={!emp.isActive}
                                                            >
                                                                صرف سلفة
                                                            </Button>
                                                            <button 
                                                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                                onClick={() => handleDelete(emp.id)}
                                                                title="حذف الموظف"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advance/Salary Modal */}
                {advanceModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                            <div className="p-6 border-b border-slate-100 bg-indigo-50 flex justify-between items-center">
                                <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                                    <Banknote size={24} className="text-indigo-600" />
                                    تسجيل سلفة / راتب
                                </h2>
                                <button
                                    onClick={() => setAdvanceModal({ ...advanceModal, isOpen: false })}
                                    className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleAdvanceSubmit} className="p-6 space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-2">تسجيل مبلغ مسحوب للموظف:</p>
                                    <p className="text-lg font-bold text-slate-800 bg-slate-100 p-3 rounded-xl border border-slate-200">
                                        {advanceModal.employeeName}
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1">المبلغ (ج.س)</label>
                                    <input
                                        type="number"
                                        className="w-full border-2 border-indigo-100 focus:border-indigo-500 outline-none p-3 rounded-xl font-mono text-lg font-bold text-indigo-900"
                                        placeholder="0"
                                        value={advanceModal.amount}
                                        onChange={e => setAdvanceModal({ ...advanceModal, amount: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1">البيان / الوصف</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-200 p-3 rounded-xl"
                                        value={advanceModal.description}
                                        onChange={e => setAdvanceModal({ ...advanceModal, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="bg-amber-50 p-3 rounded-lg flex gap-2 border border-amber-100 text-amber-800 text-sm">
                                    <HelpCircle size={18} className="shrink-0 mt-0.5" />
                                    <p>سيتم تسجيل هذا المبلغ تلقائياً في شاشة المنصرفات العامة تحت بند "الرواتب".</p>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-md">
                                        حفظ السلفة
                                    </Button>
                                    <Button type="button" variant="outline" className="flex-1 h-12 text-md" onClick={() => setAdvanceModal({ ...advanceModal, isOpen: false })}>
                                        إلغاء
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </main>
    )
}
