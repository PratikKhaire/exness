'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  email: string
  verified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string) => Promise<boolean>
  signup: (email: string) => Promise<boolean>
  logout: () => void
  verifyToken: (token: string, email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('trading_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const signup = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()
      
      if (response.ok) {
        return true
      } else {
        throw new Error(result.error || 'Signup failed')
      }
    } catch (error) {
      console.error('Signup error:', error)
      return false
    }
  }

  const login = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()
      
      if (response.ok) {
        return true
      } else {
        throw new Error(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const verifyToken = async (token: string, email: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:4000/api/auth/verify?token=${token}&email=${email}`)
      const result = await response.json()

      if (response.ok && result.success) {
        const verifiedUser = { email, verified: true }
        setUser(verifiedUser)
        localStorage.setItem('trading_user', JSON.stringify(verifiedUser))
        return true
      } else {
        throw new Error(result.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('trading_user')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      signup, 
      logout, 
      verifyToken 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
