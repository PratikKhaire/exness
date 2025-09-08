import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`trading-card ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      {children}
    </div>
  )
}

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'buy' | 'sell' | 'secondary'
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = '',
  size = 'md'
}: ButtonProps) {
  const baseClass = 'trading-button'
  const variantClass = {
    primary: 'trading-button-primary',
    buy: 'trading-button-buy',
    sell: 'trading-button-sell',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
  }[variant]
  
  const sizeClass = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }[size]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  )
}

interface InputProps {
  label?: string
  placeholder?: string
  type?: string
  step?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  required?: boolean
}

export function Input({ 
  label, 
  placeholder, 
  type = 'text', 
  step,
  value, 
  onChange, 
  className = '',
  required = false
}: InputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="trading-input"
        required={required}
      />
    </div>
  )
}

interface SelectProps {
  label?: string
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function Select({ label, options, value, onChange, className = '' }: SelectProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="trading-input"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size]

  return (
    <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClass} ${className}`} />
  )
}
