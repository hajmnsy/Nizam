'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, Printer, Calendar as CalendarIcon, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DailyData {
    date: string
    receipts: number
    expenses: number
    runningBalance: number
}

interface ReportData {
    openingBalance: number
    startDate: string
    endDate: string
    data: DailyData[]
    totals: {
        receipts: number
        expenses: number
    }
    error?: string
    details?: string
}

export default function CashFlowMovement() {
    // Default: first day of current month to today
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const getFirstDayLocal = () => {
        const d = new Date()
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
        const offset = firstDay.getTimezoneOffset()
        const local = new Date(firstDay.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [startDate, setStartDate] = useState(getFirstDayLocal())
    const [endDate, setEndDate] = useState(getTodayLocal())
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(false)

    // Initial Balance State
    const [initialBalance, setInitialBalance] = useState<number>(0)
    const [initialBalanceDate, setInitialBalanceDate] = useState<string>('')
    const [savingBalance, setSavingBalance] = useState(false)
    const [balanceMessage, setBalanceMessage] = useState({ type: '', text: '' })
    const [exchangeRate, setExchangeRate] = useState<number>(0)

    const fetchReport = () => {
        setLoading(true)
        fetch(`/api/reports/movement?startDate=${startDate}&endDate=${endDate}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error('API Error:', data.error, data.details);
                    setReportData(null);
                } else {
                    setReportData(data);
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    // Fetch on initial load
    useEffect(() => {
        Promise.all([
            fetch('/api/settings').then(res => res.json()),
            fetch('/api/exchange-rate').then(res => res.json())
        ])
            .then(([settingsData, exchangeRateData]) => {
                if (settingsData && !settingsData.error) {
                    setInitialBalance(settingsData.initialBalance || 0)
                    if (settingsData.initialBalanceDate) {
                        setInitialBalanceDate(new Date(settingsData.initialBalanceDate).toISOString().split('T')[0])
                    }
                }
                if (exchangeRateData && exchangeRateData.rate > 0) {
                    setExchangeRate(exchangeRateData.rate)
                }
            })
            .catch(console.error)

        fetchReport()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSaveBalance = async () => {
        setSavingBalance(true)
        setBalanceMessage({ type: '', text: '' })
        try {
            const res = await fetch('/api/settings/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initialBalance, initialBalanceDate })
            })
            if (res.ok) {
                setBalanceMessage({ type: 'success', text: 'تم الحفظ وسيتم تحديث التقرير' })
                setTimeout(() => setBalanceMessage({ type: '', text: '' }), 3000)
                fetchReport() // refresh the report right away with the new balance
            } else {
                setBalanceMessage({ type: 'error', text: 'فشل الحفظ' })
            }
        } catch (error) {
            setBalanceMessage({ type: 'error', text: 'فشل الاتصال بالخادم' })
        }
        setSavingBalance(false)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <main className="min-h-screen bg-slate-50 print:bg-white print:min-h-0 print:m-0 print:p-0">
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="container mx-auto p-4 max-w-4xl print:max-w-none print:w-full print:p-0">
                {/* Header Actions - hidden in print */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link href="/reports" className="text-gray-500 hover:text-blue-600 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded text-sm font-bold">
                            <ArrowLeft size={16} />
                            العودة للتقارير
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">تقرير حركة المقبوضات والمصروفات</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handlePrint} className="flex items-center gap-2 shadow-sm font-bold bg-slate-800 hover:bg-slate-900 border-none text-white">
                            <Printer size={18} />
                            طباعة PDF
                        </Button>
                    </div>
                </div>

                {/* Initial Balance Form - hidden in print */}
                <Card className="mb-6 p-4 bg-amber-50 shadow-sm border-amber-200 print:hidden">
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">الرصيد الافتتاحي (ج.س):</label>
                            <Input
                                type="number"
                                value={initialBalance}
                                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                                className="h-10 font-bold bg-white"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">تاريخ الرصيد الافتتاحي:</label>
                            <Input
                                type="date"
                                value={initialBalanceDate}
                                onChange={(e) => setInitialBalanceDate(e.target.value)}
                                className="h-10 font-bold bg-white"
                            />
                        </div>
                        <Button
                            onClick={handleSaveBalance}
                            disabled={savingBalance}
                            className="bg-amber-600 hover:bg-amber-700 flex-none h-10 px-6 font-bold flex items-center justify-center"
                        >
                            {savingBalance ? <Loader2 className="animate-spin" size={18} /> : <span>حفظ وتحديث</span>}
                        </Button>
                    </div>
                    {balanceMessage.text && (
                        <p className={`text-sm mt-3 font-bold ${balanceMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                            {balanceMessage.text}
                        </p>
                    )}
                </Card>

                {/* Filters - hidden in print */}
                <Card className="mb-8 p-4 bg-white shadow-sm border-slate-200 print:hidden flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-bold text-slate-600 mb-2 whitespace-nowrap">من تاريخ:</label>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-blue-500">
                            <CalendarIcon size={18} className="text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-slate-700 w-full"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-bold text-slate-600 mb-2 whitespace-nowrap">إلى تاريخ:</label>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-blue-500">
                            <CalendarIcon size={18} className="text-slate-400" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-slate-700 w-full"
                            />
                        </div>
                    </div>
                    <Button onClick={fetchReport} disabled={loading} className="px-8 flex-none py-2.5">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'تحديث البيانات'}
                    </Button>
                </Card>

                {/* Summary Cards - hidden in print */}
                {reportData && !reportData.error && reportData.data && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 print:hidden">
                        <Card className="bg-white p-6 border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-sm font-bold text-slate-500 mb-1">إجمالي المقبوضات</span>
                            <span className="text-2xl font-black text-slate-800">{reportData.totals?.receipts ? reportData.totals.receipts.toLocaleString() : '0'}</span>
                            {exchangeRate > 0 && (
                                <span className="text-sm font-bold text-emerald-600 mt-1">${((reportData.totals?.receipts || 0) / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            )}
                        </Card>
                        <Card className="bg-white p-6 border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <span className="text-sm font-bold text-slate-500 mb-1">إجمالي المصروفات</span>
                            <span className="text-2xl font-black text-slate-800">{reportData.totals?.expenses ? reportData.totals.expenses.toLocaleString() : '0'}</span>
                            {exchangeRate > 0 && (
                                <span className="text-sm font-bold text-emerald-600 mt-1">${((reportData.totals?.expenses || 0) / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            )}
                        </Card>
                        <Card className="bg-slate-900 p-6 shadow-md flex flex-col items-center justify-center text-center">
                            <span className="text-sm font-bold text-slate-400 mb-1">الرصيد النهائي</span>
                            <span className="text-2xl font-black text-white">
                                {reportData.data.length > 0 ? reportData.data[reportData.data.length - 1].runningBalance.toLocaleString() : (reportData.openingBalance?.toLocaleString() || '0')}
                            </span>
                            {exchangeRate > 0 && (
                                <span className="text-sm font-bold text-emerald-400 mt-1">
                                    ${((reportData.data.length > 0 ? reportData.data[reportData.data.length - 1].runningBalance : (reportData.openingBalance || 0)) / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            )}
                        </Card>
                    </div>
                )}

                {/* Printable Report Document */}
                {reportData && !reportData.error && reportData.data && (
                    <div className="bg-white rounded border border-slate-200 p-12 print:border-none print:shadow-none print:p-0 font-sans mx-auto shadow-sm min-h-[800px] printable-doc">
                        {/* Title Section matching the image perfectly */}
                        <div className="text-center mb-8 flex flex-col items-center justify-center space-y-3 report-header">
                            <h4 className="text-xl font-bold font-serif mb-2">بسم الله الرحمن الرحيم</h4>
                            <h2 className="text-2xl font-bold font-serif underline underline-offset-8 mb-2">حركة المقبوضات والمصروفات</h2>

                            {/* Dates formatted explicitly to match image: من يوم YYYY/MM/DD إلى YYYY/MM/DD */}
                            <h3 className="text-lg font-bold">
                                من يوم <span dir="ltr" className="inline-block">{new Date(startDate).toLocaleDateString('en-CA').replace(/-/g, '/')}</span> إلى <span dir="ltr" className="inline-block">{new Date(endDate).toLocaleDateString('en-CA').replace(/-/g, '/')}</span>
                            </h3>

                            <h3 className="text-lg font-bold border-b border-black pb-1">
                                رصيد مرحل من يوم <span dir="ltr" className="inline-block mx-1">
                                    {/* The day *before* the start date */}
                                    {(() => {
                                        const d = new Date(startDate);
                                        d.setDate(d.getDate() - 1);
                                        return d.toLocaleDateString('en-CA').replace(/-/g, '/');
                                    })()}
                                </span> <span className="mr-8">{reportData.openingBalance ? reportData.openingBalance.toLocaleString() : '0'}</span>
                            </h3>
                        </div>

                        {/* Exact Table replication */}
                        <div className="flex justify-center mt-10">
                            <table className="report-table w-full max-w-3xl text-center border-collapse text-base font-bold">
                                <thead>
                                    <tr>
                                        <th className="border border-black p-2">التاريخ</th>
                                        <th className="border border-black p-2">المقبوضات</th>
                                        <th className="border border-black p-2">المصروفات</th>
                                        <th className="border border-black p-2">رصيد مرحل</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.data.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="border border-black p-2 align-top" dir="ltr">{row.date.replace('-', '/')}</td>
                                            <td className="border border-black p-2 align-top">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span>{row.receipts > 0 ? row.receipts.toLocaleString() : '-'}</span>
                                                    {exchangeRate > 0 && row.receipts > 0 && (
                                                        <span className="text-emerald-600 font-bold text-xs mt-1 block tracking-wider print:text-black">
                                                            ${(row.receipts / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="border border-black p-2 align-top">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span>{row.expenses > 0 ? row.expenses.toLocaleString() : '-'}</span>
                                                    {exchangeRate > 0 && row.expenses > 0 && (
                                                        <span className="text-emerald-600 font-bold text-xs mt-1 block tracking-wider print:text-black">
                                                            ${(row.expenses / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="border border-black p-2 font-black align-top">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span>{row.runningBalance.toLocaleString()}</span>
                                                    {exchangeRate > 0 && (
                                                        <span className="text-emerald-600 font-black text-xs mt-1 block tracking-wider print:text-black">
                                                            ${(row.runningBalance / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Footer Row */}
                                    <tr className="border-t-[3px] border-t-black">
                                        <td className="border border-black p-2 font-black align-top">الجملة</td>
                                        <td className="border border-black p-2 font-black align-top">
                                            <div className="flex flex-col items-center justify-center">
                                                <span>{reportData.totals?.receipts ? reportData.totals.receipts.toLocaleString() : '0'}</span>
                                                {exchangeRate > 0 && reportData.totals?.receipts > 0 && (
                                                    <span className="text-emerald-600 font-black text-xs mt-1 block tracking-wider print:text-black">
                                                        ${(reportData.totals.receipts / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-black p-2 font-black align-top">
                                            <div className="flex flex-col items-center justify-center">
                                                <span>{reportData.totals?.expenses ? reportData.totals.expenses.toLocaleString() : '0'}</span>
                                                {exchangeRate > 0 && reportData.totals?.expenses > 0 && (
                                                    <span className="text-emerald-600 font-black text-xs mt-1 block tracking-wider print:text-black">
                                                        ${(reportData.totals.expenses / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-black p-2 bg-gray-100 print:bg-transparent"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 20mm;
                    }
                    body {
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    /* Make all fonts pure black for print */
                    .printable-doc, .printable-doc * {
                        color: #000 !important;
                    }

                    /* Match exact table cell borders */
                    .report-table th, .report-table td {
                        border-color: #000 !important;
                        border-width: 1px !important;
                    }
                }
            `}</style>
        </main >
    )
}
