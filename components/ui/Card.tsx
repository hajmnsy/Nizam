import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
    variant?: 'default' | 'glass' | 'gradient' | 'enterprise' | 'glow'
    noPadding?: boolean
    style?: React.CSSProperties
    onClick?: () => void
}

const Card: React.FC<CardProps> = ({ 
    children, 
    className = '', 
    variant = 'enterprise', 
    noPadding = false, 
    style,
    onClick 
}) => {
    const variants = {
        default: 'bg-white shadow-md shadow-slate-200/60 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-all duration-300',
        enterprise: 'bg-white/90 backdrop-blur-md shadow-lg shadow-slate-200/50 border border-slate-200/80 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300',
        glass: 'bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-slate-200/40 rounded-2xl',
        gradient: 'bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 shadow-lg shadow-slate-200/50 border border-indigo-100 rounded-2xl hover:border-indigo-300 transition-all duration-300',
        glow: 'bg-slate-900 text-white shadow-2xl shadow-indigo-500/20 border border-indigo-500/30 rounded-2xl relative overflow-hidden'
    }

    return (
        <div 
            onClick={onClick}
            className={`${!noPadding ? 'p-6' : ''} ${variants[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`} 
            style={style}
        >
            {children}
        </div>
    )
}

export default Card
