'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import { Users, UserPlus, Trash2, Edit2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

type User = {
    id: number
    username: string
    role: string
    createdAt: string
}

export default function UsersManagement() {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingUserId, setEditingUserId] = useState<number | null>(null)
    const [formData, setFormData] = useState({ username: '', password: '', role: 'CASHIER' })

    useEffect(() => {
        fetchCurrentUser()
        fetchUsers()
    }, [])

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me')
            const data = await res.json()
            if (data.error || data.role !== 'ADMIN') {
                router.push('/')
            } else {
                setCurrentUser(data)
            }
        } catch (error) {
            console.error('Failed to fetch current user')
            router.push('/')
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            const data = await res.json()
            setUsers(Array.isArray(data) ? data : [])
            setLoading(false)
        } catch (error) {
            console.error('Failed to fetch users')
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users'
            const method = editingUserId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                alert(data.error || 'حدث خطأ')
                return
            }

            setIsFormOpen(false)
            setFormData({ username: '', password: '', role: 'CASHIER' })
            setEditingUserId(null)
            fetchUsers()
        } catch (error) {
            alert('تعذر الحفظ')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                alert(data.error || 'فشل الحذف')
                return
            }
            fetchUsers()
        } catch (error) {
            alert('تعذر الحذف')
        }
    }

    const openEdit = (u: User) => {
        setFormData({ username: u.username, password: '', role: u.role })
        setEditingUserId(u.id)
        setIsFormOpen(true)
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </main>
        )
    }

    if (currentUser?.role !== 'ADMIN') {
        return (
            <main className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="container mx-auto p-4 flex flex-col items-center justify-center h-96">
                    <ShieldAlert size={64} className="text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">عذراً، غير مسموح لك بالوصول</h2>
                    <p className="text-gray-500 mt-2">هذه الصفحة مخصصة للمدراء فقط</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="container mx-auto p-4 max-w-5xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <Users className="text-indigo-600" />
                            إدارة المستخدمين والصلاحيات
                        </h1>
                        <p className="text-gray-500 mt-1">إضافة وحذف المستخدمين وتحديد صلاحياتهم</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ username: '', password: '', role: 'CASHIER' })
                            setEditingUserId(null)
                            setIsFormOpen(true)
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                        <UserPlus size={18} />
                        إضافة مستخدم
                    </button>
                </div>

                {isFormOpen && (
                    <Card className="mb-8 border-t-4 border-indigo-500 bg-white">
                        <h2 className="text-xl font-bold mb-4">{editingUserId ? 'تعديل بيانات المستخدم' : 'مستخدم جديد'}</h2>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!editingUserId} // Don't change username if editing
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    كلمة المرور {editingUserId && <span className="text-xs font-normal text-amber-600">(اتركه فارغاً إن لم ترد التغيير)</span>}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUserId}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الصلاحية</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="ADMIN">مدير النظام (Admin)</option>
                                    <option value="CASHIER">كاشير المبيعات (Cashier)</option>
                                    <option value="WAREHOUSE">أمين المخزن (Warehouse)</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-bold">
                                    إلغاء
                                </button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors font-bold">
                                    حفظ المستخدم
                                </button>
                            </div>
                        </form>
                    </Card>
                )}

                <Card className="overflow-hidden p-0 border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right" dir="rtl">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-bold text-slate-800">اسم المستخدم</th>
                                    <th className="p-4 text-sm font-bold text-slate-800">الصلاحية</th>
                                    <th className="p-4 text-sm font-bold text-slate-800">تاريخ الإضافة</th>
                                    <th className="p-4 text-sm font-bold text-slate-800 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b last:border-0 border-gray-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700 truncate">{u.username}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'WAREHOUSE' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {u.role === 'ADMIN' ? 'مدير' : u.role === 'WAREHOUSE' ? 'أمين مخزن' : 'كاشير'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 font-mono">
                                            {new Date(u.createdAt).toLocaleDateString('ar-SD')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEdit(u)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {currentUser?.id !== u.id && ( // Don't allow self-deletion
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                لا يوجد مستخدمين لعرضهم
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </main>
    )
}
