'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { FileText, Printer, ArrowLeft, Download, Filter, DollarSign } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Expense {
    id: number
    description: string
    amount: number
    date: string
    category: string
}

// Fixed categories matching the 10-day report columns from user request
const COLUMNS = [
    { id: 'صدقة', label: 'صدقة' },
    { id: 'عام', label: 'عام' },
    { id: 'عتالة وترحيل', label: 'عتالة وترحيل' },
    { id: 'الرواتب', label: 'الرواتب' },
    { id: 'سعر الصرف', label: 'سعر الصرف' }, // Always empty for manual entry
    { id: 'توريدات', label: 'التوريدات' },
    { id: 'الفطور', label: 'الفطور' }
]

export default function ExpensesReportPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)

    // Default to last 10 days
    const getDaysAgo = (days: number) => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000) - (days * 24 * 60 * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [startDate, setStartDate] = useState(getDaysAgo(9)) // 10 days inclusive
    const [endDate, setEndDate] = useState(getDaysAgo(0))
    const [exchangeRate, setExchangeRate] = useState<number>(0)

    const handlePrint = () => {
        window.print()
    }

    const fetchExpenses = () => {
        setLoading(true)
        const qp = new URLSearchParams()
        if (startDate) qp.append('startDate', startDate)
        if (endDate) qp.append('endDate', endDate)

        fetch(`/api/expenses?${qp.toString()}`)
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

    useEffect(() => {
        fetchExpenses()
    }, [])

    // Grouping Logic
    const grouped: Record<string, Record<string, Expense[]>> = {}
    const datesSet = new Set<string>()

    expenses.forEach(e => {
        const dateStr = new Date(e.date).toISOString().split('T')[0]
        datesSet.add(dateStr)
        if (!grouped[dateStr]) {
            grouped[dateStr] = {}
            COLUMNS.forEach(col => { grouped[dateStr][col.id] = [] })
        }

        // Push into the correct category column if it exists, otherwise put it under "عام"
        if (grouped[dateStr][e.category]) {
            grouped[dateStr][e.category].push(e)
        } else {
            grouped[dateStr]['عام'].push(e)
        }
    })

    const sortedDates = Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    const calculateDailyTotal = (dateStr: string) => {
        return Object.values(grouped[dateStr]).flat().reduce((sum, e) => sum + e.amount, 0)
    }

    const calculateColumnTotal = (colId: string) => {
        let total = 0
        sortedDates.forEach(dateStr => {
            total += grouped[dateStr][colId]?.reduce((sum, e) => sum + e.amount, 0) || 0
        })
        return total
    }

    const grandTotal = sortedDates.reduce((sum, d) => sum + calculateDailyTotal(d), 0)




    return (
        <main className="min-h-screen bg-slate-50 print:bg-white print:m-0 print:p-0">
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="container mx-auto p-4 max-w-7xl print:max-w-none print:w-full print:p-0">

                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link href="/expenses" className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
                            <ArrowLeft size={16} />
                            رجوع
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="text-blue-600" />
                            تقرير المصروفات المفصل
                        </h1>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2 border-slate-300 whitespace-nowrap hidden sm:flex">
                            <Printer size={16} />
                            استخراج كـ PDF
                        </Button>
                        <Button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white sm:hidden whitespace-nowrap">
                            <Printer size={16} /> طباعة / PDF
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6 print:hidden">
                    <div className="flex flex-col sm:flex-row items-end gap-4">
                        <div className="w-full sm:w-auto">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">من تاريخ</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm font-bold text-slate-700"
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">إلى تاريخ</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm font-bold text-slate-700"
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">سعر الصرف</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-2 w-full focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all bg-emerald-50/30">
                                <DollarSign size={16} className="text-emerald-500" />
                                <input
                                    type="number"
                                    placeholder="اختياري"
                                    value={exchangeRate || ''}
                                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                                    className="bg-transparent border-none outline-none text-sm font-bold text-emerald-700 w-full"
                                />
                            </div>
                        </div>
                        <Button onClick={fetchExpenses} className="bg-slate-800 text-white w-full sm:w-auto whitespace-nowrap flex items-center gap-2">
                            <Filter size={16} /> عرض التقرير
                        </Button>
                    </div>
                </Card>

                {/* Print Styles Content */}
                <style type="text/css" media="print">
                    {`
                        @page { size: landscape; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-table th, .print-table td { border: 2px solid #1e293b !important; }
                    `}
                </style>

                {/* Printable Document Area */}
                <div className="bg-white p-4 sm:p-8 rounded-xl shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0 print:p-0 overflow-x-auto min-h-[500px] print:min-h-0">

                    {/* Document Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-black text-slate-900 underline underline-offset-4 decoration-2">
                            المدفوعات من تاريخ {new Date(startDate).toLocaleDateString('en-GB')} إلى {new Date(endDate).toLocaleDateString('en-GB')}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-slate-400 font-bold">جاري تحميل البيانات...</div>
                    ) : sortedDates.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 font-bold">لا توجد سجلات في هذه الفترة.</div>
                    ) : (
                        <table className="w-full text-center border-collapse print-table text-sm">
                            <thead>
                                <tr className="bg-slate-50 font-black text-slate-900 border-2 border-slate-800">
                                    <th className="py-2 px-2 border-2 border-slate-800 w-[12%]">الجملة</th>
                                    {COLUMNS.map(col => (
                                        <th key={col.id} className="py-2 px-2 border-2 border-slate-800 break-words">{col.label}</th>
                                    ))}
                                    <th className="py-2 px-2 border-2 border-slate-800 w-[8%]">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold text-slate-800">
                                {sortedDates.map((dateStr, index) => (
                                    <tr key={dateStr} className="border-2 border-slate-800">
                                        <td className="py-3 px-2 border-2 border-slate-800 text-base">
                                            <div className="flex flex-col items-center justify-center">
                                                <span>{calculateDailyTotal(dateStr).toLocaleString()}</span>
                                                {exchangeRate > 0 && (
                                                    <span className="text-emerald-600 font-black text-xs mt-1 block tracking-wider print:text-black">
                                                        ${(calculateDailyTotal(dateStr) / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {COLUMNS.map(col => {
                                            if (col.id === 'سعر الصرف') {
                                                return <td key={col.id} className="py-3 px-2 border-2 border-slate-800 bg-slate-50/50"></td>
                                            }

                                            const items = grouped[dateStr][col.id]

                                            // Render multiple items in a single cell
                                            return (
                                                <td key={col.id} className="py-2 px-2 border-2 border-slate-800 align-top">
                                                    {items && items.length > 0 ? (
                                                        <div className="flex flex-col gap-1 text-[13px] leading-tight">
                                                            {items.map(item => (
                                                                <div key={item.id} className="flex flex-col text-right">
                                                                    <span className="font-black text-slate-900">{item.amount.toLocaleString()}</span>
                                                                    <span className="text-slate-600 font-medium break-words">{item.description}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            )
                                        })}

                                        <td className="py-3 px-2 border-2 border-slate-800 whitespace-nowrap font-black">
                                            {new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}

                                {/* Grand Total Footer */}
                                <tr className="border-2 border-slate-800 bg-slate-50 font-black text-slate-900 text-base">
                                    <td className="py-3 px-2 border-2 border-slate-800">
                                        <div className="flex flex-col items-center justify-center">
                                            <span>{grandTotal.toLocaleString()}</span>
                                            {exchangeRate > 0 && (
                                                <span className="text-emerald-600 font-black text-sm mt-1 block tracking-wider print:text-black">
                                                    ${(grandTotal / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {COLUMNS.map(col => (
                                        <td key={col.id} className="py-3 px-2 border-2 border-slate-800">
                                            {col.id === 'سعر الصرف' ? '-' : calculateColumnTotal(col.id).toLocaleString()}
                                        </td>
                                    ))}
                                    <td className="py-3 px-2 border-2 border-slate-800">الجملة</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </main>
    )
}
