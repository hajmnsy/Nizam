'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
    Users,
    Plus,
    Search,
    Phone,
    Building2,
    MapPin,
    FileText,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Loader2,
    X,
    Eye,
    Edit2,
    Trash2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    CheckCircle2,
    Wallet,
    ArrowRightLeft,
    Receipt
} from 'lucide-react'

interface Customer {
    id: number
    name: string
    phone?: string | null
    company?: string | null
    address?: string | null
    notes?: string | null
    createdAt: string
    totalSales: number
    totalDeposits: number
    remainingBalance: number
    salesCount: number
    depositsCount: number
    sales?: any[]
    deposits?: any[]
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Add Customer Modal
    const [showAddModal, setShowAddModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        company: '',
        address: '',
        notes: '',
        initialDeposit: '',
        depositPaymentMethod: 'CASH'
    })

    // Edit Customer Modal
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

    // Deposit Modal
    const [depositModalCustomer, setDepositModalCustomer] = useState<Customer | null>(null)
    const [depositData, setDepositData] = useState({
        amount: '',
        paymentMethod: 'CASH',
        description: 'إيداع نقدي بالحساب',
        date: new Date().toISOString().split('T')[0]
    })
    const [savingDeposit, setSavingDeposit] = useState(false)

    // Statement Modal
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [customerDetails, setCustomerDetails] = useState<any>(null)

    const fetchCustomers = () => {
        setLoading(true)
        fetch('/api/customers', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCustomers(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return alert('الرجاء إدخال اسم العميل')
        setSaving(true)

        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowAddModal(false)
                setFormData({
                    name: '',
                    phone: '',
                    company: '',
                    address: '',
                    notes: '',
                    initialDeposit: '',
                    depositPaymentMethod: 'CASH'
                })
                fetchCustomers()
            } else {
                const err = await res.json()
                alert(err.error || 'فشل إضافة العميل')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال')
        } finally {
            setSaving(false)
        }
    }

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer)
        setFormData({
            name: customer.name,
            phone: customer.phone || '',
            company: customer.company || '',
            address: customer.address || '',
            notes: customer.notes || '',
            initialDeposit: '',
            depositPaymentMethod: 'CASH'
        })
    }

    const handleUpdateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCustomer || !formData.name.trim()) return
        setSaving(true)

        try {
            const res = await fetch(`/api/customers/${editingCustomer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setEditingCustomer(null)
                setFormData({
                    name: '',
                    phone: '',
                    company: '',
                    address: '',
                    notes: '',
                    initialDeposit: '',
                    depositPaymentMethod: 'CASH'
                })
                fetchCustomers()
            } else {
                const err = await res.json()
                alert(err.error || 'فشل تعديل بيانات العميل')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteCustomer = async (customer: Customer) => {
        if (!confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) return

        try {
            const res = await fetch(`/api/customers/${customer.id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchCustomers()
            } else {
                const err = await res.json()
                alert(err.error || 'تعذر حذف العميل (قد يكون مرتبطاً بمبيعات أو إيداعات)')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال')
        }
    }

    const handleAddDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!depositModalCustomer || !depositData.amount) return
        setSavingDeposit(true)

        try {
            const res = await fetch(`/api/customers/${depositModalCustomer.id}/deposits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(depositData)
            })

            if (res.ok) {
                setDepositModalCustomer(null)
                setDepositData({
                    amount: '',
                    paymentMethod: 'CASH',
                    description: 'إيداع نقدي بالحساب',
                    date: new Date().toISOString().split('T')[0]
                })
                fetchCustomers()
                if (selectedCustomer && selectedCustomer.id === depositModalCustomer.id) {
                    openStatementModal(depositModalCustomer)
                }
            } else {
                const err = await res.json()
                alert(err.error || 'فشل تسجيل الإيداع')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال')
        } finally {
            setSavingDeposit(false)
        }
    }

    const openStatementModal = (customer: Customer) => {
        setSelectedCustomer(customer)
        setLoadingDetails(true)
        fetch(`/api/customers/${customer.id}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setCustomerDetails(data)
                setLoadingDetails(false)
            })
            .catch(err => {
                console.error(err)
                setLoadingDetails(false)
            })
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    )

    // Overall KPI Summaries
    const grandTotalDeposits = customers.reduce((sum, c) => sum + c.totalDeposits, 0)
    const grandTotalSales = customers.reduce((sum, c) => sum + c.totalSales, 0)
    const grandRemainingBalance = grandTotalDeposits - grandTotalSales

    return (
        <main className="min-h-screen bg-slate-50 font-sans pb-16">
            <Navbar />

            <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6 animate-fade-in">
                {/* Page Title & Action */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Users className="text-emerald-600" size={32} />
                            إدارة حسابات العملاء والإيداعات
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            متابعة إيداعات العملاء المسبقة، سحب البضائع، وتتبع كشف الحساب والرصيد المتبقي بدقة.
                        </p>
                    </div>

                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={20} />
                        <span>إضافة عميل جديد</span>
                    </Button>
                </div>

                {/* Overall KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">عدد العملاء</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-800 font-mono">
                            {customers.length} <span className="text-xs text-slate-400 font-sans font-bold">عميل</span>
                        </div>
                    </Card>

                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">إجمالي الإيداعات النقدية والمصرفية</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Wallet size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-blue-700 font-mono">
                            {grandTotalDeposits.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">ج.س</span>
                        </div>
                    </Card>

                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">إجمالي البضاعة المسحوبة (المبيعات)</span>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <Receipt size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-purple-700 font-mono">
                            {grandTotalSales.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">ج.س</span>
                        </div>
                    </Card>

                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl border-r-4 border-r-emerald-500">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">صافي أرصدة العملاء المودعة (أمانات)</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                        <div className={`text-2xl font-black font-mono ${grandRemainingBalance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {grandRemainingBalance.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">ج.س</span>
                        </div>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="ابحث عن عميل بالاسم، اسم المحل/الشركة، أو رقم الهاتف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-sm font-bold bg-transparent outline-none text-slate-800 placeholder-slate-400"
                    />
                </div>

                {/* Customers Table */}
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-0">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-emerald-600" size={40} />
                            <span>جاري تحميل قائمة العملاء...</span>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
                            <Users size={48} className="text-slate-300" />
                            <span>لا يوجد عملاء مسجلين حالياً. اضغط زر "إضافة عميل جديد" بالأعلى.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-black">
                                        <th className="p-4">اسم العميل</th>
                                        <th className="p-4">الشركة / المحل</th>
                                        <th className="p-4">الهاتف</th>
                                        <th className="p-4 text-center">إجمالي الإيداعات (له +)</th>
                                        <th className="p-4 text-center">إجمالي المسحوبات (عليه -)</th>
                                        <th className="p-4 text-center">الرصيد الحالي المتبقي</th>
                                        <th className="p-4 text-center">إجراءات الحساب</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-800">
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <div className="font-black text-slate-900">{customer.name}</div>
                                                {customer.address && (
                                                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} />
                                                        <span>{customer.address}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-600 font-bold">
                                                {customer.company || '-'}
                                            </td>
                                            <td className="p-4 text-slate-600 font-mono font-bold" dir="ltr">
                                                {customer.phone || '-'}
                                            </td>
                                            <td className="p-4 text-center font-mono font-black text-blue-700">
                                                {customer.totalDeposits.toLocaleString()} ج.س
                                            </td>
                                            <td className="p-4 text-center font-mono font-black text-purple-700">
                                                {customer.totalSales.toLocaleString()} ج.س
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono ${
                                                    customer.remainingBalance > 0
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : customer.remainingBalance < 0
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {customer.remainingBalance > 0 ? `له: ${customer.remainingBalance.toLocaleString()}` : customer.remainingBalance < 0 ? `عليه: ${Math.abs(customer.remainingBalance).toLocaleString()}` : '0'} ج.س
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        onClick={() => {
                                                            setDepositModalCustomer(customer)
                                                            setDepositData({
                                                                amount: '',
                                                                paymentMethod: 'CASH',
                                                                description: 'إيداع نقدي بالحساب',
                                                                date: new Date().toISOString().split('T')[0]
                                                            })
                                                        }}
                                                        size="sm"
                                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-emerald-200/60 shadow-sm flex items-center gap-1"
                                                        title="تسجيل إيداع مالي جديد للعميل"
                                                    >
                                                        <Wallet size={14} />
                                                        <span>+ إيداع</span>
                                                    </Button>
                                                    <Button
                                                        onClick={() => openStatementModal(customer)}
                                                        size="sm"
                                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-indigo-200/60 shadow-sm flex items-center gap-1"
                                                    >
                                                        <FileText size={14} />
                                                        <span>كشف الحساب</span>
                                                    </Button>
                                                    <button
                                                        onClick={() => openEditModal(customer)}
                                                        title="تعديل بيانات العميل"
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCustomer(customer)}
                                                        title="حذف العميل"
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Add Customer Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <Card className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 relative">
                            <div className="flex justify-between items-center border-b pb-3">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Users className="text-emerald-600" size={24} />
                                    إضافة عميل جديد
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCustomer} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل (مطلوب)</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        placeholder="مثال: أحمد عبد الله"
                                        className="h-11 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة / المحل</label>
                                        <Input
                                            value={formData.company}
                                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                            placeholder="مثال: مؤسسة النيل للتجارة"
                                            className="h-11 font-bold text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="0123456789"
                                            className="h-11 font-bold text-xs text-left" dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">العنوان / الموقع</label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="مثال: السوق الشعبي - أم درمان"
                                        className="h-11 font-bold text-xs"
                                    />
                                </div>

                                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl space-y-3">
                                    <span className="text-xs font-black text-emerald-900 block flex items-center gap-1.5">
                                        <Wallet size={16} />
                                        إيداع رصيد افتتاحي (اختياري)
                                    </span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">المبلغ المودع</label>
                                            <Input
                                                type="number"
                                                value={formData.initialDeposit}
                                                onChange={(e) => setFormData(prev => ({ ...prev, initialDeposit: e.target.value }))}
                                                placeholder="0.00"
                                                className="h-10 font-bold text-xs font-mono bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">طريقة الإيداع</label>
                                            <select
                                                value={formData.depositPaymentMethod}
                                                onChange={(e) => setFormData(prev => ({ ...prev, depositPaymentMethod: e.target.value }))}
                                                className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white text-xs font-bold outline-none"
                                            >
                                                <option value="CASH">كاش</option>
                                                <option value="BANK">تحويل بنكي</option>
                                                <option value="CHEQUE">شيك</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
                                    <Input
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="ملاحظات اختيارية..."
                                        className="h-11 font-bold text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <Button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl"
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md"
                                    >
                                        {saving ? 'جاري الحفظ...' : 'حفظ العميل'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Edit Customer Modal */}
                {editingCustomer && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <Card className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 relative">
                            <div className="flex justify-between items-center border-b pb-3">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Edit2 className="text-blue-600" size={24} />
                                    تعديل بيانات العميل: {editingCustomer.name}
                                </h3>
                                <button onClick={() => setEditingCustomer(null)} className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateCustomer} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل (مطلوب)</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        placeholder="اسم العميل"
                                        className="h-11 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة / المحل</label>
                                        <Input
                                            value={formData.company}
                                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                            placeholder="اسم الشركة"
                                            className="h-11 font-bold text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="0123456789"
                                            className="h-11 font-bold text-xs text-left" dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">العنوان / الموقع</label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="العنوان"
                                        className="h-11 font-bold text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
                                    <Input
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="ملاحظات..."
                                        className="h-11 font-bold text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <Button
                                        type="button"
                                        onClick={() => setEditingCustomer(null)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl"
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md"
                                    >
                                        {saving ? 'جاري التعديل...' : 'تحديث البيانات'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Add Deposit Modal (تسجيل إيداع نقدي لعميل) */}
                {depositModalCustomer && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <Card className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 relative">
                            <div className="flex justify-between items-center border-b pb-3">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Wallet className="text-emerald-600" size={24} />
                                    تسجيل إيداع لـ: {depositModalCustomer.name}
                                </h3>
                                <button onClick={() => setDepositModalCustomer(null)} className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddDeposit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المودع (ج.س) *</label>
                                    <Input
                                        type="number"
                                        value={depositData.amount}
                                        onChange={(e) => setDepositData(prev => ({ ...prev, amount: e.target.value }))}
                                        required
                                        placeholder="0.00"
                                        className="h-12 font-black text-lg font-mono text-emerald-700"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">وسيلة الدفع والإيداع</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'CASH', label: 'كاش' },
                                            { id: 'BANK', label: 'تحويل بنكي' },
                                            { id: 'CHEQUE', label: 'شيك' }
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setDepositData(prev => ({ ...prev, paymentMethod: m.id }))}
                                                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                                    depositData.paymentMethod === m.id
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">البيان / الوصف</label>
                                    <Input
                                        value={depositData.description}
                                        onChange={(e) => setDepositData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="مثال: إيداع نقدي مقدماً / تحويل بنكي..."
                                        className="h-11 font-bold text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
                                    <Input
                                        type="date"
                                        value={depositData.date}
                                        onChange={(e) => setDepositData(prev => ({ ...prev, date: e.target.value }))}
                                        className="h-11 font-bold text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <Button
                                        type="button"
                                        onClick={() => setDepositModalCustomer(null)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl"
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={savingDeposit}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md"
                                    >
                                        {savingDeposit ? 'جاري التسجيل...' : 'تأكيد الإيداع'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Statement of Account Modal (كشف حساب العميل التفصيلي) */}
                {selectedCustomer && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <Card className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-start border-b pb-4 shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                        <FileText className="text-emerald-600" size={28} />
                                        <span>كشف حساب العميل: {selectedCustomer.name}</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold mt-1">
                                        سجل الإيداعات النقدية والبنكية وفواتير البضاعة المسحوبة
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => {
                                            setDepositModalCustomer(selectedCustomer)
                                            setDepositData({
                                                amount: '',
                                                paymentMethod: 'CASH',
                                                description: 'إيداع نقدي بالحساب',
                                                date: new Date().toISOString().split('T')[0]
                                            })
                                        }}
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm"
                                    >
                                        <Plus size={14} />
                                        <span>إيداع جديد</span>
                                    </Button>
                                    <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {loadingDetails || !customerDetails ? (
                                <div className="py-16 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
                                    <Loader2 className="animate-spin text-emerald-600" size={40} />
                                    <span>جاري استخراج كشف الحساب التفصيلي...</span>
                                </div>
                            ) : (
                                <div className="space-y-6 overflow-y-auto flex-1 pr-1">
                                    {/* Mini KPI Header in Modal */}
                                    <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الإيداعات (دائن +)</span>
                                            <span className="text-lg font-black text-blue-700 font-mono">{customerDetails.totalDeposits.toLocaleString()} ج.س</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المسحوبات (مدين -)</span>
                                            <span className="text-lg font-black text-purple-700 font-mono">{customerDetails.totalSales.toLocaleString()} ج.س</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 block mb-1">الرصيد الحالي</span>
                                            <span className={`text-lg font-black font-mono ${customerDetails.remainingBalance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {customerDetails.remainingBalance > 0 ? `له: ${customerDetails.remainingBalance.toLocaleString()}` : customerDetails.remainingBalance < 0 ? `عليه: ${Math.abs(customerDetails.remainingBalance).toLocaleString()}` : '0'} ج.س
                                            </span>
                                        </div>
                                    </div>

                                    {/* Chronological Statement Table */}
                                    <div>
                                        <h4 className="font-black text-slate-800 text-sm mb-3">سجل الحركة المالية والمسحوبات:</h4>
                                        <table className="w-full text-right border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-100 border-b text-slate-700 font-black">
                                                    <th className="p-3">التاريخ</th>
                                                    <th className="p-3">نوع العملية / البيان</th>
                                                    <th className="p-3 text-center">طريقة الدفع</th>
                                                    <th className="p-3 text-center">إيداع (له +)</th>
                                                    <th className="p-3 text-center">سحب بضاعة (عليه -)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                                                {/* Combine Deposits & Sales chronologically */}
                                                {[
                                                    ...customerDetails.deposits.map((d: any) => ({
                                                        type: 'DEPOSIT',
                                                        date: d.date || d.createdAt,
                                                        title: `إيداع: ${d.description || 'إيداع نقدي'}`,
                                                        paymentMethod: d.paymentMethod === 'BANK' ? 'تحويل بنكي' : d.paymentMethod === 'CHEQUE' ? 'شيك' : 'كاش',
                                                        depositVal: d.amount,
                                                        saleVal: 0
                                                    })),
                                                    ...customerDetails.sales.map((s: any) => ({
                                                        type: 'SALE',
                                                        date: s.createdAt,
                                                        title: `فاتورة بيع #${s.invoiceNumber || s.id} (${s.items?.length || 0} صنف)`,
                                                        paymentMethod: s.paymentMethod === 'BANK' ? 'تحويل بنكي' : s.paymentMethod === 'CHEQUE' ? 'شيك' : s.paymentMethod === 'MULTIPLE' ? 'مجزأ' : 'كاش',
                                                        depositVal: 0,
                                                        saleVal: s.total
                                                    }))
                                                ]
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="p-3 font-mono text-slate-500">
                                                            {new Date(item.date).toLocaleDateString('ar-EG')}
                                                        </td>
                                                        <td className="p-3 font-black text-slate-900">
                                                            {item.type === 'DEPOSIT' ? (
                                                                <span className="text-emerald-700 flex items-center gap-1">
                                                                    <ArrowDownRight size={14} /> {item.title}
                                                                </span>
                                                            ) : (
                                                                <span className="text-purple-700 flex items-center gap-1">
                                                                    <ArrowUpRight size={14} /> {item.title}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center text-slate-600 font-bold">
                                                            {item.paymentMethod}
                                                        </td>
                                                        <td className="p-3 text-center font-mono font-black text-emerald-700">
                                                            {item.depositVal > 0 ? `${item.depositVal.toLocaleString()} ج.س` : '-'}
                                                        </td>
                                                        <td className="p-3 text-center font-mono font-black text-purple-700">
                                                            {item.saleVal > 0 ? `${item.saleVal.toLocaleString()} ج.س` : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </main>
    )
}
