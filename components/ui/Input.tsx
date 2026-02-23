import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
    return (
        <div className="flex flex-col space-y-1.5">
            {label && <label className="text-sm font-bold text-slate-700">{label}</label>}
            <input
                className={`border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 placeholder:text-slate-400 text-slate-900 font-medium ${className}`}
                {...props}
            />
        </div>
    )
}

export default Input
