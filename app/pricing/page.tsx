'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Calculator, DollarSign, Percent, Scale, Truck, Lightbulb, Target } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function PricingCalculator() {
    const [exchangeRate, setExchangeRate] = useState<number>(0)
    const [purchasePriceUSD, setPurchasePriceUSD] = useState<string>('')
    const [weightKg, setWeightKg] = useState<string>('')
    const [transportPerTonUSD, setTransportPerTonUSD] = useState<string>('15') // Added slightly more margin to 10$ default as absolute safety
    const [marginPercent, setMarginPercent] = useState<string>('15') // Target Net Profit Margin over the calculated direct cost

    // New Operational Variables
    const [rentExpSDG, setRentExpSDG] = useState<string>('')
    const [salariesExpSDG, setSalariesExpSDG] = useState<string>('')
    const [utilitiesExpSDG, setUtilitiesExpSDG] = useState<string>('')
    const [taxesExpSDG, setTaxesExpSDG] = useState<string>('')
    
    // Local processing
    const [localLaborPerTonSDG, setLocalLaborPerTonSDG] = useState<string>('') // العتالة المحلية للطن
    const [expectedMonthlySalesVolume, setExpectedMonthlySalesVolume] = useState<string>('1000') // المبيعات المتوقعة شهرياً للقطعة

    useEffect(() => {
        fetch('/api/exchange-rate', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data && data.rate) {
                    setExchangeRate(data.rate)
                }
            })
            .catch(console.error)
    }, [])

    // --- Core Calculations ---

    // 1. Parsing numeric inputs safely
    const priceUSD = parseFloat(purchasePriceUSD) || 0
    const weight = parseFloat(weightKg) || 0
    const transPerTon = parseFloat(transportPerTonUSD) || 0
    const rate = exchangeRate || 0
    const margin = parseFloat(marginPercent) || 0

    const rent = parseFloat(rentExpSDG) || 0
    const salaries = parseFloat(salariesExpSDG) || 0
    const utils = parseFloat(utilitiesExpSDG) || 0
    const taxes = parseFloat(taxesExpSDG) || 0
    const totalMonthlyOverheadSDG = rent + salaries + utils + taxes

    const localLaborPerTon = parseFloat(localLaborPerTonSDG) || 0
    const monthlyVolume = parseFloat(expectedMonthlySalesVolume) || 1

    // 2. Costs per piece
    const transportPerPieceUSD = weight > 0 ? (weight / 1000) * transPerTon : 0
    
    const localLaborPerPieceSDG = weight > 0 ? (weight / 1000) * localLaborPerTon : 0
    const localLaborPerPieceUSD = rate > 0 ? localLaborPerPieceSDG / rate : 0

    // 3. Overhead distribution
    const overheadPerPieceSDG = totalMonthlyOverheadSDG / monthlyVolume
    const overheadPerPieceUSD = rate > 0 ? overheadPerPieceSDG / rate : 0

    // 4. Total Direct Cost in USD
    const directCostUSD = priceUSD + transportPerPieceUSD + localLaborPerPieceUSD + overheadPerPieceUSD

    // 5. Proposed Selling Price in USD (Cost / (1 - Margin%))
    // Formula: Price = Cost / (1 - (Margin / 100))
    const expectedMarginRatio = margin / 100
    // To prevent division by zero or negative prices if user enters margin >= 100
    const validMarginRatio = expectedMarginRatio >= 1 ? 0.99 : expectedMarginRatio

    const suggestedPriceUSD = directCostUSD > 0 ? directCostUSD / (1 - validMarginRatio) : 0

    // 6. Converting to local currency (SDG)
    const directCostSDG = directCostUSD * rate
    const suggestedPriceSDG = suggestedPriceUSD * rate

    // 7. Net Profit Analysis per piece
    const netProfitUSD = suggestedPriceUSD - directCostUSD
    const netProfitSDG = netProfitUSD * rate

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="container mx-auto p-4 max-w-4xl py-8 animate-fade-in-up">
                {/* Header */}
                <div className="mb-8 text-center sm:text-right">
                    <h1 className="text-3xl font-black text-slate-800 flex items-center justify-center sm:justify-start gap-3">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                            <Calculator size={28} />
                        </div>
                        حاسبة الأسعار الذكية
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-2xl text-sm leading-relaxed">
                        أداة لتسعير المنتجات وحماية أرباحك من تقلبات صرف العملة. تُدخل التكاليف بالدولار الثابت وتقوم الحاسبة باقتراح سعر بيع يضمن لك نسبة ربحك الصافية (تتضمن الرسوم السنوية والمنصرفات) بمعادلة دقيقة.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* INPUTS SECTION */}
                    <div className="space-y-6">
                        <Card className="p-6 border-t-4 border-slate-700 shadow-md">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-3">
                                <Target size={20} className="text-slate-500" />
                                معطيات التسعير الأساسية
                            </h2>

                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        سعر صرف الدولار المعتمد (ج.س)
                                        <div className="group relative cursor-help">
                                            <Lightbulb size={14} className="text-amber-500" />
                                            <div className="absolute right-0 top-full mt-1 w-60 bg-slate-800 text-white text-xs p-2 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                يتم سحب السعر افتراضياً من آخر سعر مسجل في صفحة المصروفات، ويمكنك تغييره يدوياً لاختبار تأثير تقلبات العملة على السعر.
                                            </div>
                                        </div>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 right-0 pl-3 pr-4 flex items-center pointer-events-none text-emerald-600 bg-emerald-50 border-l border-slate-200 rounded-r-lg font-bold">
                                            SDG
                                        </div>
                                        <Input
                                            type="number"
                                            value={exchangeRate || ''}
                                            onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)}
                                            className="w-full pl-3 pr-16 bg-white border-2 focus:border-emerald-500 focus:ring-emerald-500 font-bold text-lg text-slate-800"
                                            placeholder="أدخل سعر الصرف"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        سعر شراء القطعة من المورد
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 right-0 pl-3 pr-4 flex items-center pointer-events-none text-slate-600 bg-slate-100 border-l border-slate-200 rounded-r-lg">
                                            <DollarSign size={16} />
                                        </div>
                                        <Input
                                            type="number"
                                            value={purchasePriceUSD}
                                            onChange={e => setPurchasePriceUSD(e.target.value)}
                                            className="w-full pl-3 pr-14 font-bold font-mono text-lg text-slate-800"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            وزن القطعة الواحدة
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 right-0 pl-3 pr-3 flex items-center pointer-events-none text-slate-500 bg-slate-100 border-l border-slate-200 rounded-r-lg">
                                                <Scale size={16} />
                                            </div>
                                            <Input
                                                type="number"
                                                value={weightKg}
                                                onChange={e => setWeightKg(e.target.value)}
                                                className="w-full pl-3 pr-12 font-bold font-mono"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                                                KG
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2 text-xs">
                                            تكلفة الترحيل العالمي <span className="text-slate-500">(للطن)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 right-0 pl-3 pr-3 flex items-center pointer-events-none text-slate-500 bg-slate-100 border-l border-slate-200 rounded-r-lg">
                                                <Truck size={16} />
                                            </div>
                                            <Input
                                                type="number"
                                                value={transportPerTonUSD}
                                                onChange={e => setTransportPerTonUSD(e.target.value)}
                                                className="w-full pl-3 pr-12 font-bold font-mono"
                                                placeholder="10.00"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                                                $
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-1 mt-4">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2 text-xs">
                                        تكلفة التنزيل والعتالة المحلية <span className="text-slate-500">(للطن بالجنيه)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 right-0 pl-3 pr-3 flex items-center pointer-events-none text-emerald-600 bg-emerald-50 border-l border-emerald-200 rounded-r-lg">
                                            SDG
                                        </div>
                                        <Input
                                            type="number"
                                            value={localLaborPerTonSDG}
                                            onChange={e => setLocalLaborPerTonSDG(e.target.value)}
                                            className="w-full pl-3 pr-14 font-bold font-mono text-emerald-800"
                                            placeholder="مثال: 50,000"
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-6 mt-6">
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Target size={18} className="text-amber-500" />
                                        المنصرفات التشغيلية الثابتة (شهرياً بالجنيه)
                                    </h2>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">الإيجار</label>
                                            <Input
                                                type="number"
                                                value={rentExpSDG}
                                                onChange={e => setRentExpSDG(e.target.value)}
                                                placeholder="0.00"
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">الرواتب والأجور</label>
                                            <Input
                                                type="number"
                                                value={salariesExpSDG}
                                                onChange={e => setSalariesExpSDG(e.target.value)}
                                                placeholder="0.00"
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">الكهرباء والماء</label>
                                            <Input
                                                type="number"
                                                value={utilitiesExpSDG}
                                                onChange={e => setUtilitiesExpSDG(e.target.value)}
                                                placeholder="0.00"
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">رسوم وضرائب وأخرى</label>
                                            <Input
                                                type="number"
                                                value={taxesExpSDG}
                                                onChange={e => setTaxesExpSDG(e.target.value)}
                                                placeholder="0.00"
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-2">
                                        <label className="text-sm font-bold text-amber-900">
                                            حجم التوريد/المبيعات المتوقع شهرياً بالقطعة
                                        </label>
                                        <p className="text-xs text-amber-700">
                                            يستخدم هذا الرقم لتوزيع إجمالي المنصرفات الشهرية أعلاه على القطعة الواحدة بشكل عادل.
                                        </p>
                                        <Input
                                            type="number"
                                            value={expectedMonthlySalesVolume}
                                            onChange={e => setExpectedMonthlySalesVolume(e.target.value)}
                                            className="w-full font-bold font-mono text-lg"
                                            placeholder="1000"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t mt-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            نسبة الربح الصافية المستهدفة (Net Margin)
                                            <div className="group relative cursor-help">
                                                <Lightbulb size={14} className="text-amber-500" />
                                                <div className="absolute right-0 top-full mt-1 w-64 bg-slate-800 text-white text-xs p-2 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal">
                                                    يمثل هذا الرقم هامش الربح الصافي لك بعد تغطية المورد المباشر والمنصرفات التشغيلية أعلاه.
                                                </div>
                                            </div>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 right-0 pl-3 pr-3 flex items-center pointer-events-none text-blue-600 bg-blue-50 border-l border-blue-200 rounded-r-lg">
                                                <Percent size={16} />
                                            </div>
                                            <Input
                                                type="number"
                                                value={marginPercent}
                                                onChange={e => setMarginPercent(e.target.value)}
                                                className="w-full pl-3 pr-12 font-black text-lg text-blue-800 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-blue-50/10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* OUTPUTS SECTION */}
                    <div className="space-y-6">
                        <Card className="p-6 border-t-4 border-indigo-500 shadow-xl bg-gradient-to-br from-white to-slate-50">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 border-b pb-3 border-indigo-100">
                                نتـيجة التسعير الموصى بها
                            </h2>

                            <div className="space-y-6">
                                {/* Total Direct Cost Breakdown */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">تفصيل رأس المال والمصروفات (للقطعة)</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span>سعر الصنف الاستيرادي</span>
                                            <span className="font-mono font-bold">${priceUSD.toFixed(3)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span>تكلفة الترحيل العالمي</span>
                                            <span className="font-mono font-bold text-amber-600">+ ${transportPerPieceUSD.toFixed(3)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span>العتالة والتنزيل المحلي</span>
                                            <span className="font-mono font-bold text-emerald-600">+ ${localLaborPerPieceUSD.toFixed(3)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span>نصيب القطعة من المنصرفات (<span dir="ltr">{totalMonthlyOverheadSDG.toLocaleString()}</span> ج.س)</span>
                                            <span className="font-mono font-bold text-purple-600">+ ${overheadPerPieceUSD.toFixed(3)}</span>
                                        </div>
                                        
                                        <div className="pt-2 border-t border-dashed flex justify-between items-center bg-slate-50 p-2 rounded font-black text-slate-800 mt-2">
                                            <span>التكلفة الإجمالية للقطعة</span>
                                            <span className="font-mono">${directCostUSD.toFixed(3)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Suggested Price */}
                                <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                    {/* Decorative background shape */}
                                    <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12">
                                        <Calculator size={150} />
                                    </div>

                                    <h3 className="text-indigo-100 font-bold mb-2 relative z-10 flex items-center justify-between">
                                        <span>سعر البيع المقترح للجمهور</span>
                                        <span className="bg-indigo-500/50 px-2 py-1 rounded text-xs">هامش {margin}% محقق</span>
                                    </h3>

                                    <div className="relative z-10 flex flex-col mt-4">
                                        <div className="flex items-baseline gap-2 justify-end font-mono">
                                            <span className="text-indigo-200 font-bold">$</span>
                                            <span className="text-4xl font-black tracking-tight">{suggestedPriceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="text-right mt-1 opacity-80 text-sm">
                                            دولار أمريكي ثابت للقطعة
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-6 pt-6 border-t border-indigo-500/50 flex flex-col">
                                        <div className="flex items-baseline gap-2 justify-end font-mono">
                                            <span className="text-indigo-200 font-bold">SDG</span>
                                            <span className="text-3xl font-black text-emerald-300 tracking-tight">{Math.round(suggestedPriceSDG).toLocaleString()}</span>
                                        </div>
                                        <div className="text-right mt-1 opacity-80 text-sm">
                                            جنيه سوداني (بسعر الصرف الموضح ⬆️)
                                        </div>
                                    </div>
                                </div>

                                {/* Profit Breakdown */}
                                {suggestedPriceUSD > 0 && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                                            <p className="text-emerald-800/70 text-xs font-bold mb-1">صافي الربح الفعلي</p>
                                            <p className="font-mono font-black text-emerald-700 text-lg">${netProfitUSD.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                                            <p className="text-emerald-800/70 text-xs font-bold mb-1">صافي الربح بالجنيه</p>
                                            <p className="font-mono font-black text-emerald-700 text-lg">{Math.round(netProfitSDG).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    )
} 
