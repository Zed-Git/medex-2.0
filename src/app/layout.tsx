import './globals.css'

export const metadata = {
  title: 'Medex 2.0',
  description: 'Cardiology PhD Analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}



