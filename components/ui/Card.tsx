import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
    variant?: 'default' | 'glass' | 'gradient'
    noPadding?: boolean
    style?: React.CSSProperties
}

const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default', noPadding = false, style }) => {
    const variants = {
        default: 'bg-white shadow-sm border border-slate-300 hover:border-slate-400 hover:shadow',
        glass: 'bg-white shadow-sm border border-slate-300',
        gradient: 'bg-gradient-to-br from-white to-slate-50 shadow-sm border border-slate-300',
    }

    return (
        <div className={`rounded-md transition-all duration-300 ${!noPadding ? 'p-6' : ''} ${variants[variant]} ${className}`} style={style}>
            {children}
        </div>
    )
}

export default Card
