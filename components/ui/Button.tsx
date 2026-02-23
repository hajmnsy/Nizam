import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline'
    size?: 'sm' | 'md' | 'lg'
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseStyles = 'rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 active:scale-[0.98] border shadow-sm leading-none tracking-wide'
    const variants = {
        primary: 'bg-indigo-700 text-white border-indigo-800 hover:bg-indigo-800 focus:ring-indigo-600',
        secondary: 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-500',
        danger: 'bg-red-600 text-white border-red-700 hover:bg-red-700 focus:ring-red-600',
        outline: 'bg-transparent border-slate-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-600 focus:ring-indigo-600',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5',
        lg: 'px-6 py-3 text-lg',
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        />
    )
}

export default Button
