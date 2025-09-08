import '../styles/globals.css'

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
        {children}
      </body>
    </html>
  )
}
