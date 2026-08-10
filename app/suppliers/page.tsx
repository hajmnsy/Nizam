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
    CheckCircle2
} from 'lucide-react'

interface Supplier {
    id: number
    name: string
    phone?: string | null
    company?: string | null
    address?: string | null
    notes?: string | null
    createdAt: string
    totalPurchases: number
    totalPayments: number
    remainingBalance: number
    purchases?: any[]
    expenses?: any[]
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        company: '',
        address: '',
        notes: ''
    })

    // Selected supplier for detail / statement modal
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [supplierDetails, setSupplierDetails] = useState<any>(null)

    const fetchSuppliers = () => {
        setLoading(true)
        fetch('/api/suppliers', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSuppliers(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const handleCreateSupplier = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return alert('الرجاء إدخال اسم المورد')
        setSaving(true)

        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowAddModal(false)
                setFormData({ name: '', phone: '', company: '', address: '', notes: '' })
                fetchSuppliers()
            } else {
                const err = await res.json()
                alert(err.error || 'فشل إضافة المورد')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال')
        } finally {
            setSaving(false)
        }
    }

    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

    const openEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setFormData({
            name: supplier.name,
            phone: supplier.phone || '',
            company: supplier.company || '',
            address: supplier.address || '',
            notes: supplier.notes || ''
        })
    }

    const handleUpdateSupplier = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingSupplier || !formData.name.trim()) return
        setSaving(true)

        try {
            const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setEditingSupplier(null)
                setFormData({ name: '', phone: '', company: '', address: '', notes: '' })
                fetchSuppliers()
            } else {
                const err = await res.json()
                alert(err.error || 'فشل تعديل بيانات المورد')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteSupplier = async (supplier: Supplier) => {
        if (!confirm(`هل أنت متأكد من حذف المورد "${supplier.name}"؟`)) return

        try {
            const res = await fetch(`/api/suppliers/${supplier.id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchSuppliers()
            } else {
                const err = await res.json()
                alert(err.error || 'تعذر حذف المورد (قد يكون مرتبكاً بفواتير مشتريات أو منصرفات)')
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ في الاتصال')
        }
    }

    const openStatementModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier)
        setLoadingDetails(true)
        fetch(`/api/suppliers/${supplier.id}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setSupplierDetails(data)
                setLoadingDetails(false)
            })
            .catch(err => {
                console.error(err)
                setLoadingDetails(false)
            })
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.company && s.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.includes(searchTerm))
    )

    // Overall Summary Metrics
    const grandTotalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0)
    const grandTotalPayments = suppliers.reduce((sum, s) => sum + s.totalPayments, 0)
    const grandRemainingBalance = grandTotalPurchases - grandTotalPayments

    return (
        <main className="min-h-screen bg-slate-50 font-sans pb-16">
            <Navbar />

            <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6 animate-fade-in">
                {/* Page Title & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Users className="text-indigo-600" size={32} />
                            إدارة حسابات الموردين
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            متابعة الموردين، سجل المشتريات، سداد الدفعات، وكشف حساب الرصيد المتبقي لكل مورد.
                        </p>
                    </div>

                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={20} />
                        <span>إضافة مورد جديد</span>
                    </Button>
                </div>

                {/* Overall KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">عدد الموردين</span>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-800 font-mono">
                            {suppliers.length} <span className="text-xs text-slate-400 font-sans font-bold">مورد</span>
                        </div>
                    </Card>

                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">إجمالي المشتريات</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-blue-700 font-mono">
                            {grandTotalPurchases.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">ج.س</span>
                        </div>
                    </Card>

                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">إجمالي الدفعات المسددة</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <TrendingDown size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-700 font-mono">
                            {grandTotalPayments.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">ج.س</span>
                        </div>
                    </Card>

                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl border-r-4 border-r-amber-500">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">إجمالي المستحق للموردين</span>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <AlertCircle size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-amber-700 font-mono">
                            {grandRemainingBalance.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">ج.س</span>
                        </div>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="ابحث عن مورد بالاسم، اسم الشركة، أو رقم الهاتف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-sm font-bold bg-transparent outline-none text-slate-800 placeholder-slate-400"
                    />
                </div>

                {/* Suppliers List Table */}
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-0">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-indigo-600" size={40} />
                            <span>جاري تحميل قائمة الموردين...</span>
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
                            <Users size={48} className="text-slate-300" />
                            <span>لا يوجد موردين مسجلين حالياً. اضغط زر "إضافة مورد جديد" بالأعلى.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-black">
                                        <th className="p-4">اسم المورد</th>
                                        <th className="p-4">الشركة</th>
                                        <th className="p-4">الهاتف</th>
                                        <th className="p-4 text-center">إجمالي المشتريات</th>
                                        <th className="p-4 text-center">إجمالي المسدد</th>
                                        <th className="p-4 text-center">الرصيد المتبقي (له)</th>
                                        <th className="p-4 text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-800">
                                    {filteredSuppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <div className="font-black text-slate-900">{supplier.name}</div>
                                                {supplier.address && (
                                                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} />
                                                        <span>{supplier.address}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-600 font-bold">
                                                {supplier.company || '-'}
                                            </td>
                                            <td className="p-4 text-slate-600 font-mono font-bold" dir="ltr">
                                                {supplier.phone || '-'}
                                            </td>
                                            <td className="p-4 text-center font-mono font-black text-blue-700">
                                                {supplier.totalPurchases.toLocaleString()} ج.س
                                            </td>
                                            <td className="p-4 text-center font-mono font-black text-emerald-700">
                                                {supplier.totalPayments.toLocaleString()} ج.س
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono ${
                                                    supplier.remainingBalance > 0 
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                                        : supplier.remainingBalance < 0
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {supplier.remainingBalance.toLocaleString()} ج.س
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        onClick={() => openStatementModal(supplier)}
                                                        size="sm"
                                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-indigo-200/60 shadow-sm flex items-center gap-1"
                                                    >
                                                        <FileText size={14} />
                                                        <span>كشف الحساب</span>
                                                    </Button>
                                                    <button
                                                        onClick={() => openEditModal(supplier)}
                                                        title="تعديل المورد"
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSupplier(supplier)}
                                                        title="حذف المورد"
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

                {/* Add Supplier Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <Card className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 relative">
                            <div className="flex justify-between items-center border-b pb-3">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Users className="text-indigo-600" size={24} />
                                    إضافة مورد جديد
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSupplier} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد (مطلوب)</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        placeholder="مثال: شركة النيل للحديد"
                                        className="h-11 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة / المصنع</label>
                                        <Input
                                            value={formData.company}
                                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                            placeholder="مثال: مصنع جياد"
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
                                        placeholder="مثال: بحري - المنطقة الصناعية"
                                        className="h-11 font-bold text-xs"
                                    />
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
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md"
                                    >
                                        {saving ? 'جاري الحفظ...' : 'حفظ المورد'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Edit Supplier Modal */}
                {editingSupplier && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <Card className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 relative">
                            <div className="flex justify-between items-center border-b pb-3">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Edit2 className="text-blue-600" size={24} />
                                    تعديل بيانات المورد: {editingSupplier.name}
                                </h3>
                                <button onClick={() => setEditingSupplier(null)} className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateSupplier} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد (مطلوب)</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        placeholder="اسم المورد"
                                        className="h-11 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة / المصنع</label>
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
                                        onClick={() => setEditingSupplier(null)}
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

                {/* Statement of Account Modal (كشف حساب المورد التفصيلي) */}
                {selectedSupplier && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <Card className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-start border-b pb-4 shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                        <FileText className="text-indigo-600" size={28} />
                                        <span>كشف حساب المورد: {selectedSupplier.name}</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold mt-1">
                                        سجل المشتريات المسجلة والسدادات المالية المسددة
                                    </p>
                                </div>
                                <button onClick={() => setSelectedSupplier(null)} className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100">
                                    <X size={24} />
                                </button>
                            </div>

                            {loadingDetails || !supplierDetails ? (
                                <div className="py-16 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
                                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                                    <span>جاري استخراج كشف الحساب التفصيلي...</span>
                                </div>
                            ) : (
                                <div className="space-y-6 overflow-y-auto flex-1 pr-1">
                                    {/* Mini KPI Header in Modal */}
                                    <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المشتريات (مدين)</span>
                                            <span className="text-lg font-black text-blue-700 font-mono">{supplierDetails.totalPurchases.toLocaleString()} ج.س</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المسدد (دائن)</span>
                                            <span className="text-lg font-black text-emerald-700 font-mono">{supplierDetails.totalPayments.toLocaleString()} ج.س</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 block mb-1">الرصيد المستحق الحالي</span>
                                            <span className="text-lg font-black text-amber-700 font-mono">{supplierDetails.remainingBalance.toLocaleString()} ج.س</span>
                                        </div>
                                    </div>

                                    {/* Chronological Statement Table */}
                                    <div>
                                        <h4 className="font-black text-slate-800 text-sm mb-3">سجل الحركة المالية الحسابية:</h4>
                                        <table className="w-full text-right border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-100 border-b text-slate-700 font-black">
                                                    <th className="p-3">التاريخ</th>
                                                    <th className="p-3">نوع العملية / البيان</th>
                                                    <th className="p-3 text-center">مشتريات (له +)</th>
                                                    <th className="p-3 text-center">دفعة مسددة (عليه -)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                                                {/* Combine Purchases & Expenses chronologically */}
                                                {[
                                                    ...supplierDetails.purchases.map((p: any) => ({
                                                        type: 'PURCHASE',
                                                        date: p.createdAt,
                                                        title: `فاتورة مشتريات #${p.invoiceNumber || p.id}`,
                                                        purchaseVal: p.total,
                                                        paymentVal: 0
                                                    })),
                                                    ...supplierDetails.expenses.map((e: any) => ({
                                                        type: 'PAYMENT',
                                                        date: e.date,
                                                        title: `سند دفع: ${e.description}`,
                                                        purchaseVal: 0,
                                                        paymentVal: e.amount
                                                    }))
                                                ]
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="p-3 font-mono text-slate-500">
                                                            {new Date(item.date).toLocaleDateString('ar-EG')}
                                                        </td>
                                                        <td className="p-3 font-black text-slate-900">
                                                            {item.type === 'PURCHASE' ? (
                                                                <span className="text-blue-700 flex items-center gap-1">
                                                                    <ArrowUpRight size={14} /> {item.title}
                                                                </span>
                                                            ) : (
                                                                <span className="text-emerald-700 flex items-center gap-1">
                                                                    <ArrowDownRight size={14} /> {item.title}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center font-mono font-black text-blue-700">
                                                            {item.purchaseVal > 0 ? `${item.purchaseVal.toLocaleString()} ج.س` : '-'}
                                                        </td>
                                                        <td className="p-3 text-center font-mono font-black text-emerald-700">
                                                            {item.paymentVal > 0 ? `${item.paymentVal.toLocaleString()} ج.س` : '-'}
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
