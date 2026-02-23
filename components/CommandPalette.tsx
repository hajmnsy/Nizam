'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Package, User, FileText, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    // Toggle on Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    // Focus input when open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    // Search effect
    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }

        const timer = setTimeout(() => {
            fetch(`/api/search?q=${query}`)
                .then(res => res.json())
                .then(data => setResults(data.results))
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const close = () => {
        setIsOpen(false)
        setQuery('')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh] backdrop-blur-sm transition-all" onClick={close}>
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center border-b p-4 gap-3">
                    <Search className="text-gray-400" />
                    <input
                        ref={inputRef}
                        className="flex-1 outline-none text-lg"
                        placeholder="ابحث عن منتج، عميل، أو فاتورة..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button onClick={close} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {results.length === 0 && query.length > 1 && (
                        <div className="p-8 text-center text-gray-500">لا توجد نتائج</div>
                    )}

                    {results.length > 0 && (
                        <div className="p-2 space-y-1">
                            {results.map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.type === 'product' ? `/inventory?search=${item.name}` : `/sales/${item.id}`}
                                    onClick={close}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg group transition-colors"
                                >
                                    <div className={`p-2 rounded-full ${item.type === 'product' ? 'bg-blue-100 text-blue-600' :
                                            item.type === 'customer' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                                        }`}>
                                        {item.type === 'product' && <Package size={18} />}
                                        {item.type === 'customer' && <User size={18} />}
                                        {item.type === 'sale' && <FileText size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800">
                                            {item.type === 'product' ? item.name : item.type === 'customer' ? item.customer : `فاتورة #${item.id}`}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {item.type === 'product' ? `الكمية: ${item.quantity} | السعر: ${item.price}` :
                                                item.type === 'customer' ? `فاتورة #${item.id}` :
                                                    `${new Date(item.createdAt).toLocaleDateString('ar-SD')} | ${item.total} ج.س`}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Enter ↵
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {query.length === 0 && (
                        <div className="p-4 text-center">
                            <p className="text-sm text-gray-400 mb-2">أمثلة للبحث:</p>
                            <div className="flex justify-center gap-2">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">سيخ</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">مواسير</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">محمد</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">#42</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 p-2 text-center border-t text-xs text-gray-400 flex justify-between px-4">
                    <span>للتنقل: الأسهم</span>
                    <span>للإغلاق: Esc</span>
                </div>
            </div>
        </div>
    )
}
