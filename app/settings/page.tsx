'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Save, Settings2, Building2, Phone, Receipt, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [isAuthorized, setIsAuthorized] = useState(false)

    const [formData, setFormData] = useState({
        companyName: '',
        phone: '',
        address: '',
        vatRate: 0,
        logoUrl: ''
    })

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(user => {
                if (user.error) {
                    router.push('/')
                } else {
                    setIsAuthorized(true)
                    // Fetch Settings only if authorized
                    fetch('/api/settings')
                        .then(res => res.json())
                        .then(data => {
                            if (data && !data.error) {
                                setFormData({
                                    companyName: data.companyName || '',
                                    phone: data.phone || '',
                                    address: data.address || '',
                                    vatRate: data.vatRate || 0,
                                    logoUrl: data.logoUrl || ''
                                })
                            }
                            setLoading(false)
                        })
                        .catch(err => {
                            console.error(err)
                            setMessage({ type: 'error', text: 'فشل في تحميل الإعدادات' })
                            setLoading(false)
                        })
                }
            })
            .catch(() => router.push('/'))
    }, [router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage({ type: '', text: '' })

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح!' })
            } else {
                setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ.' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'حدث خطأ في الاتصال بالخادم.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="container mx-auto p-4 max-w-4xl animate-fade-in-up">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Settings2 className="text-blue-600" size={32} />
                        إعدادات النظام
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">تخصيص بيانات الشركة والضرائب وعرض الفواتير</p>
                </div>

                {!isAuthorized || loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message.text && (
                            <div className={`p-4 rounded-xl border font-bold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* General Settings */}
                            <Card className="space-y-6 border-slate-200 shadow-sm border-t-4 border-t-blue-500">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4">
                                    <Building2 className="text-blue-500" />
                                    بيانات الشركة الرئيسية
                                </h2>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم الشركة (يظهر في الفواتير)</label>
                                    <Input
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        required
                                        placeholder="مثال: مصنع الجودة للحديد"
                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف الأساسي</label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-3.5 text-slate-400" size={18} />
                                        <Input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="0123456789"
                                            className="h-12 pr-10 text-left" dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">العنوان</label>
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="مثال: الخرطوم - المنطقة الصناعية"
                                        className="h-12"
                                    />
                                </div>
                            </Card>

                            {/* Financial & Display Settings */}
                            <div className="space-y-6">
                                <Card className="space-y-6 border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4">
                                        <Receipt className="text-emerald-500" />
                                        الإعدادات المالية
                                    </h2>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">نسبة ضريبة القيمة المضافة (VAT %)</label>
                                        <div className="relative">
                                            <span className="absolute right-3 top-3.5 font-bold text-slate-500">%</span>
                                            <Input
                                                name="vatRate"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={formData.vatRate}
                                                onChange={handleChange}
                                                className="h-12 pr-10 font-mono text-lg"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">اجعلها 0 إذا كنت لا تطبق ضرائب</p>
                                    </div>
                                </Card>

                                <Card className="space-y-6 border-slate-200 shadow-sm border-t-4 border-t-purple-500">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4">
                                        <ImageIcon className="text-purple-500" />
                                        الشعار (Logo)
                                    </h2>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">ارفع صورة الشعار</label>
                                        <div className="flex flex-col gap-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    const uploadData = new FormData();
                                                    uploadData.append('file', file);

                                                    try {
                                                        const res = await fetch('/api/upload', {
                                                            method: 'POST',
                                                            body: uploadData
                                                        });
                                                        const data = await res.json();
                                                        if (res.ok && data.url) {
                                                            setFormData(prev => ({ ...prev, logoUrl: data.url }));
                                                        } else {
                                                            alert(data.error || 'فشل في رفع الصورة');
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('حدث خطأ أثناء رفع الصورة');
                                                    }
                                                }}
                                                className="block w-full text-sm text-slate-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-sm file:font-bold
                                                    file:bg-purple-50 file:text-purple-700
                                                    hover:file:bg-purple-100 transition-all cursor-pointer"
                                            />
                                            {formData.logoUrl && (
                                                <div className="mt-4 p-4 border border-purple-100 rounded-xl bg-slate-50 relative group flex justify-center">
                                                    <img src={formData.logoUrl} alt="Logo Preview" className="max-h-24 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                                                        className="absolute top-2 right-2 bg-red-100 text-red-600 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold shadow-sm"
                                                        title="إزالة الشعار"
                                                    >
                                                        <Trash2 size={14} /> إزالة
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 mb-12">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-200 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        حفظ إعدادات النظام
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Password Change Form Section */}
                {!loading && (
                    <div className="mt-8 border-t border-slate-200 pt-8" id="password-section">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">إعدادات الحساب</h2>
                        <Card className="max-w-md border-slate-200 shadow-sm border-t-4 border-t-slate-800 p-6">
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
                                    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
                                    const btn = form.querySelector('button');
                                    if (btn) btn.disabled = true;

                                    try {
                                        const res = await fetch('/api/auth/password', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ currentPassword, newPassword })
                                        });
                                        const data = await res.json();

                                        if (res.ok) {
                                            alert('تم تحديث كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول بها.');
                                            form.reset();
                                        } else {
                                            alert(data.error || 'فشل في تحديث كلمة المرور');
                                        }
                                    } catch (err) {
                                        alert('حدث خطأ بالاتصال');
                                    } finally {
                                        if (btn) btn.disabled = false;
                                    }
                                }}
                                className="space-y-4"
                            >
                                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">تغيير كلمة المرور</h3>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور الحالية</label>
                                    <Input
                                        name="currentPassword"
                                        type="password"
                                        required
                                        className="h-11 border-slate-200 focus:bg-white focus:ring-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور الجديدة</label>
                                    <Input
                                        name="newPassword"
                                        type="password"
                                        required
                                        minLength={6}
                                        className="h-11 border-slate-200 focus:bg-white focus:ring-slate-100"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        تحديث كلمة السـر
                                    </button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </main>
    )
}
