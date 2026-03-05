'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft, Printer, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
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

    const fetchReport = () => {
        setLoading(true)
        fetch(`/api/reports/movement?startDate=${startDate}&endDate=${endDate}`)
            .then(res => res.json())
            .then(data => {
                setReportData(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    // Fetch on initial load
    useEffect(() => {
        fetchReport()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

                {/* Printable Report Document */}
                {reportData && (
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
                                </span> <span className="mr-8">{reportData.openingBalance.toLocaleString()}</span>
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
                                            <td className="border border-black p-2" dir="ltr">{row.date.replace('-', '/')}</td>
                                            <td className="border border-black p-2">{row.receipts > 0 ? row.receipts.toLocaleString() : '-'}</td>
                                            <td className="border border-black p-2">{row.expenses > 0 ? row.expenses.toLocaleString() : '-'}</td>
                                            <td className="border border-black p-2 font-black">{row.runningBalance.toLocaleString()}</td>
                                        </tr>
                                    ))}

                                    {/* Footer Row */}
                                    <tr className="border-t-[3px] border-t-black"> {/* Thicker top border for grand total logic if needed, but standard in image is just border */}
                                        <td className="border border-black p-2 font-black">الجملة</td>
                                        <td className="border border-black p-2 font-black">{reportData.totals.receipts.toLocaleString()}</td>
                                        <td className="border border-black p-2 font-black">{reportData.totals.expenses.toLocaleString()}</td>
                                        <td className="border border-black p-2 bg-gray-100 print:bg-transparent"> {/* Empty or final balance? Image shows it spanning but basically empty underneath the last running balance */}</td>
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
