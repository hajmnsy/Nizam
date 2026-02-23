
import React from 'react'

interface ProformaInvoiceProps {
    items: any[]
    customer: string
    total: number
    discount?: number
    date: string
}

export const ProformaInvoice = React.forwardRef<HTMLDivElement, ProformaInvoiceProps>(({ items, customer, total, discount, date }, ref) => {
    return (
        <div ref={ref} className="hidden print:block print-container font-sans text-right bg-white" dir="rtl">
            {/* Header */}
            <div className="relative border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between h-32">
                {/* Right: Factory Name */}
                <div className="text-right w-1/3">
                    <h1 className="text-3xl font-black text-slate-900">مصنع الجودة</h1>
                </div>

                {/* Center: Logo */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32">
                        <img
                            src="/emblem.png"
                            alt="شعار مصنع الجودة"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Left: Invoice Info */}
                <div className="text-left w-1/3">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">فاتورة مبدئية <span className="text-lg font-medium">(عرض سعر)</span></h2>
                    <div className="text-gray-600 font-medium text-sm">
                        <p>التاريخ: <span className="font-mono text-black font-bold">{date}</span></p>
                        <p className="mt-1">العميل: <span className="font-bold text-black">{customer || 'نقدي'}</span></p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="print-table mb-8 w-full text-sm" style={{ width: '100%' }}>
                <thead>
                    <tr className="bg-gray-200 text-slate-900">
                        <th style={{ width: '5%' }} className="py-2 border border-black">م</th>
                        <th style={{ width: '35%' }} className="py-2 border border-black">المنتج</th>
                        <th style={{ width: '10%' }} className="py-2 border border-black">الكمية</th>
                        <th style={{ width: '20%' }} className="py-2 border border-black">سعر الوحدة</th>
                        <th style={{ width: '25%' }} className="py-2 border border-black">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1 border border-black">{index + 1}</td>
                            <td className="py-1 border border-black font-bold">{item.name}</td>
                            <td className="py-1 border border-black font-bold text-lg">{item.quantity}</td>
                            <td className="py-1 border border-black">{item.price.toLocaleString()}</td>
                            <td className="py-1 border border-black font-bold">{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={4} className="font-bold text-left px-4 border border-black py-2">المجموع الفرعي:</td>
                        <td className="font-bold border border-black py-2">{(total + (discount || 0)).toLocaleString()} ج.س</td>
                    </tr>
                    {(discount || 0) > 0 && (
                        <tr>
                            <td colSpan={4} className="font-bold text-left px-4 border border-black py-2 text-red-600">خصم:</td>
                            <td className="font-bold border border-black py-2 text-red-600">-{discount?.toLocaleString()} ج.س</td>
                        </tr>
                    )}
                    <tr>
                        <td colSpan={4} className="font-bold text-left px-4 border border-black py-2 text-lg">الإجمالي الكلي:</td>
                        <td className="font-bold text-lg border border-black py-2">{total.toLocaleString()} ج.س</td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer */}
            <div className="text-center text-sm mt-8 pt-4 border-t border-black">
                <p className="font-bold mb-1">هذه الفاتورة مبدئية وغير ملزمة ولا تعتبر سند قبض.</p>
                <p className="text-gray-600">العنوان: الدامر - المنطقة الصناعية - شمال سوق السبت</p>
            </div>
        </div>
    )
})

ProformaInvoice.displayName = 'ProformaInvoice'
