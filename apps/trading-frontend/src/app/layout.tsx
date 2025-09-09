import '../styles/globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
  title: 'Exness Trading Platform',
  description: 'Modern trading platform with real-time data and advanced features',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
