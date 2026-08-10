'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Save, Settings2, Building2, Phone, Receipt, Loader2, Image as ImageIcon, Trash2, Calculator, Scale, Truck, Percent, DollarSign, Target, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [savingCategory, setSavingCategory] = useState<number | null>(null)
    const [exchangeRate, setExchangeRate] = useState<number>(0)

    const [formData, setFormData] = useState({
        companyName: '',
        phone: '',
        address: '',
        vatRate: 0,
        logoUrl: '',
        fixedMonthlyExpenses: 0,
        expectedMonthlySupplyTons: 0,
        targetNetProfitMargin: 0,
        transportCostUSD: 15
    })

    useEffect(() => {
        fetch('/api/auth/me', { cache: 'no-store' })
            .then(res => res.json())
            .then(user => {
                if (user.error || user.role !== 'ADMIN') {
                    router.push('/')
                } else {
                    setIsAuthorized(true)

                    Promise.all([
                        fetch('/api/settings', { cache: 'no-store' }).then(res => res.json()),
                        fetch('/api/categories', { cache: 'no-store' }).then(res => res.json()),
                        fetch('/api/exchange-rate', { cache: 'no-store' }).then(res => res.json())
                    ]).then(([settingsData, categoriesData, rateData]) => {
                        if (settingsData && !settingsData.error) {
                            setFormData({
                                companyName: settingsData.companyName || '',
                                phone: settingsData.phone || '',
                                address: settingsData.address || '',
                                vatRate: settingsData.vatRate || 0,
                                logoUrl: settingsData.logoUrl || '',
                                fixedMonthlyExpenses: settingsData.fixedMonthlyExpenses || 0,
                                expectedMonthlySupplyTons: settingsData.expectedMonthlySupplyTons || 0,
                                targetNetProfitMargin: settingsData.targetNetProfitMargin || 0,
                                transportCostUSD: settingsData.transportCostUSD || 15
                            })
                        }
                        if (Array.isArray(categoriesData)) {
                            const hidden = ['قطاعات', 'مسطحات', 'مواسير', 'سيخ']
                            setCategories(categoriesData.filter((cat: any) => !hidden.includes(cat.name)))
                        }
                        if (rateData && rateData.rate) {
                            setExchangeRate(rateData.rate)
                        }
                        setLoading(false)
                    }).catch(err => {
                        console.error(err)
                        setMessage({ type: 'error', text: 'فشل في تحميل الإعدادات' })
                        setLoading(false)
                    })
                }
            })
            .catch(() => router.push('/'))
    }, [router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (parseFloat(value) || 0) : value
        }))
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

            const resultData = await res.json().catch(() => null);

            if (res.ok) {
                setMessage({ type: 'success', text: 'تم حفظ إعدادات النظام ومعايير التسعير بنجاح!' })
            } else {
                setMessage({ type: 'error', text: resultData?.details || resultData?.error || 'حدث خطأ أثناء الحفظ.' })
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error?.message || 'حدث خطأ في الاتصال بالخادم.' })
        } finally {
            setSaving(false)
        }
    }

    const handleCategoryPriceSave = async (catId: number, newPriceUSD: number) => {
        setSavingCategory(catId)
        try {
            const res = await fetch(`/api/categories/${catId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellingPricePerTonUSD: newPriceUSD })
            })
            if (res.ok) {
                setCategories(prev => prev.map(c => c.id === catId ? { ...c, sellingPricePerTonUSD: newPriceUSD } : c))
            } else {
                alert('فشل حفظ سعر التصنيف')
            }
        } catch (error) {
            console.error(error)
            alert('خطأ في الاتصال')
        } finally {
            setSavingCategory(null)
        }
    }

    // Calculated Monthly Metrics
    const overheadPerTonSDG = formData.expectedMonthlySupplyTons > 0 
        ? formData.fixedMonthlyExpenses / formData.expectedMonthlySupplyTons 
        : 0
    const overheadPerTonUSD = exchangeRate > 0 ? overheadPerTonSDG / exchangeRate : 0

    return (
        <main className="min-h-screen bg-slate-50 font-sans pb-12">
            <Navbar />

            <div className="container mx-auto p-4 max-w-5xl animate-fade-in-up">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Settings2 className="text-indigo-600" size={32} />
                        <span>الإعدادات المتقدمة وتخصيص الفروع</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        تخصيص بيانات الفرع، المعايير التشغيلية الثابتة، وحاسبة أسعار الطن بالدولار للمدير.
                    </p>
                </div>

                {!isAuthorized || loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-indigo-600" size={48} />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message.text && (
                            <div className={`p-4 rounded-2xl border font-bold flex items-center gap-2 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Section 1: General Company Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="space-y-5 border-slate-200 shadow-sm border-t-4 border-t-indigo-500 rounded-2xl p-6 bg-white">
                                <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 border-b pb-3">
                                    <Building2 className="text-indigo-500" size={20} />
                                    بيانات الشركة والفرع الأساسية
                                </h2>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الفرع / الشركة (يظهر في الفواتير)</label>
                                    <Input
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        required
                                        placeholder="مثال: مصنع الجودة للحديد"
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-indigo-100 font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف الأساسي</label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-3 text-slate-400" size={18} />
                                        <Input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="0123456789"
                                            className="h-11 pr-10 text-left font-bold" dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان</label>
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="مثال: الخرطوم - المنطقة الصناعية"
                                        className="h-11 font-bold"
                                    />
                                </div>
                            </Card>

                            {/* Section 2: Logo & Tax Settings */}
                            <div className="space-y-6">
                                <Card className="space-y-5 border-slate-200 shadow-sm border-t-4 border-t-emerald-500 rounded-2xl p-6 bg-white">
                                    <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 border-b pb-3">
                                        <Receipt className="text-emerald-500" size={20} />
                                        الضريبة ورقم الضريبي
                                    </h2>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة ضريبة القيمة المضافة (VAT %)</label>
                                        <div className="relative">
                                            <span className="absolute right-3 top-3 font-bold text-slate-500">%</span>
                                            <Input
                                                name="vatRate"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={formData.vatRate}
                                                onChange={handleChange}
                                                className="h-11 pr-10 font-mono font-bold text-base"
                                            />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="space-y-5 border-slate-200 shadow-sm border-t-4 border-t-purple-500 rounded-2xl p-6 bg-white">
                                    <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 border-b pb-3">
                                        <ImageIcon className="text-purple-500" size={20} />
                                        الشعار (Logo)
                                    </h2>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">رابط صورة الشعار</label>
                                        <Input
                                            name="logoUrl"
                                            value={formData.logoUrl}
                                            onChange={handleChange}
                                            placeholder="ضع رابط الشعار هنا..."
                                            className="h-11 font-bold text-xs"
                                        />
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Section 3: Operational Expenses & Pricing Parameters (Combined Pricing Calculator Setup) */}
                        <Card className="space-y-6 border-slate-200 shadow-sm border-t-4 border-t-amber-500 rounded-2xl p-6 bg-white">
                            <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 border-b pb-3">
                                <Calculator className="text-amber-500" size={24} />
                                <span>المنصرفات التشغيلية والمعايير المالية للتسعير</span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
                                        <DollarSign size={16} className="text-amber-600" />
                                        <span>المنصرفات التشغيلية الثابتة الشهرية (ج.س)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="fixedMonthlyExpenses"
                                        value={formData.fixedMonthlyExpenses || ''}
                                        onChange={handleChange}
                                        placeholder="مثال: 5000000"
                                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                    <p className="text-[11px] text-slate-500 font-medium mt-1">الإيجارات، المرتبات، الكهرباء، والنثريات</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
                                        <Scale size={16} className="text-blue-600" />
                                        <span>حجم التوريد / المبيعات المتوقع (بالطن شهرياً)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="expectedMonthlySupplyTons"
                                        value={formData.expectedMonthlySupplyTons || ''}
                                        onChange={handleChange}
                                        placeholder="مثال: 100"
                                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-[11px] text-slate-500 font-medium mt-1">المبيعات المتوقعة لتوزيع المصاريف للطن</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
                                        <Percent size={16} className="text-emerald-600" />
                                        <span>نسبة الربح الصافي المستهدفة (%)</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        name="targetNetProfitMargin"
                                        value={formData.targetNetProfitMargin || ''}
                                        onChange={handleChange}
                                        placeholder="مثال: 15"
                                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    <p className="text-[11px] text-slate-500 font-medium mt-1">صافي الهامش المستهدف بعد كافة التكاليف</p>
                                </div>
                            </div>

                            {/* Summary Calculation Box */}
                            {formData.expectedMonthlySupplyTons > 0 && formData.fixedMonthlyExpenses > 0 && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-amber-950">
                                    <div>
                                        <span>تكلفة المنصرفات الثابتة لكل طن (بالجنيه): </span>
                                        <span className="font-mono text-sm font-black text-amber-900">{overheadPerTonSDG.toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.س/طن</span>
                                    </div>
                                    <div>
                                        <span>تكلفة المنصرفات الثابتة لكل طن (بالدولار): </span>
                                        <span className="font-mono text-sm font-black text-amber-900">${overheadPerTonUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} /طن</span>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Section 4: Target Selling Price Per Ton USD per Category Table */}
                        <Card className="space-y-6 border-slate-200 shadow-sm border-t-4 border-t-blue-600 rounded-2xl p-6 bg-white">
                            <h2 className="text-xl font-black flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <Target className="text-blue-600" size={24} />
                                    <span>جدول سعر البيع المستهدف للطن بالدولار ($) حسب التصنيف</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400">تطبيق تلقائي في شاشة نقطة البيع</span>
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-black">
                                            <th className="p-3">اسم التصنيف</th>
                                            <th className="p-3 text-center">سعر البيع المستهدف للطن ($)</th>
                                            <th className="p-3 text-center">المكافئ بالجنيه/طن (سعر اليوم)</th>
                                            <th className="p-3 text-center">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-800">
                                        {categories.map((cat: any) => {
                                            const priceUSD = cat.sellingPricePerTonUSD || 0
                                            const priceSDG = priceUSD * exchangeRate

                                            return (
                                                <tr key={cat.id} className="hover:bg-slate-50">
                                                    <td className="p-3 font-black text-slate-900">{cat.name}</td>
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="number"
                                                            value={cat.sellingPricePerTonUSD || ''}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0
                                                                setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, sellingPricePerTonUSD: val } : c))
                                                            }}
                                                            placeholder="0"
                                                            className="w-32 text-center py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-blue-900 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center font-mono font-black text-emerald-700">
                                                        {priceSDG > 0 ? priceSDG.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' ج.س' : '-'}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleCategoryPriceSave(cat.id, cat.sellingPricePerTonUSD || 0)}
                                                            disabled={savingCategory === cat.id}
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
                                                        >
                                                            {savingCategory === cat.id ? 'جاري...' : 'حفظ السعر'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4 mb-12">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-9 py-4 rounded-2xl font-black text-base flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Save size={22} />
                                        حفظ إعدادات النظام ومعايير التسعير
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </main>
    )
}
