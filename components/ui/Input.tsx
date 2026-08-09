import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className="flex flex-col space-y-1.5 w-full">
            {label && <label className="text-sm font-bold text-slate-700">{label}</label>}
            <div className="relative w-full">
                {icon && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300 transition-all duration-300 ${icon ? 'pr-10' : ''} ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && <span className="text-xs text-rose-500 font-bold">{error}</span>}
        </div>
    )
}

export default Input
