import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'gradient' | 'glass'
    size?: 'sm' | 'md' | 'lg'
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseStyles = 'rounded-xl font-bold focus:outline-none focus:ring-4 transition-all duration-300 active:scale-[0.98] inline-flex items-center justify-center gap-2 border shadow-sm leading-none'
    const variants = {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 focus:ring-indigo-500/20 shadow-indigo-500/25 shadow-md hover:shadow-lg hover:shadow-indigo-500/35',
        gradient: 'bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 hover:from-indigo-500 hover:via-blue-500 hover:to-sky-500 text-white border-transparent shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
        secondary: 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-400/20 shadow-sm',
        danger: 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 focus:ring-rose-500/20 shadow-rose-500/20 shadow-md',
        outline: 'bg-transparent border-indigo-200 text-indigo-700 hover:bg-indigo-50/80 hover:border-indigo-400 focus:ring-indigo-500/20',
        glass: 'bg-white/80 backdrop-blur-md border border-white/60 text-slate-800 hover:bg-white focus:ring-slate-300/30 shadow-md'
    }

    const sizes = {
        sm: 'px-3 py-2 text-xs font-bold',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3.5 text-base',
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        />
    )
}

export default Button
