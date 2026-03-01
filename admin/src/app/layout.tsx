import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin | Jaff's Lomos",
  description: "Panel de control para empleados y administrador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-zinc-950 text-slate-50 min-h-screen font-sans selection:bg-orange-500/30 selection:text-orange-200`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b', // zinc-900
              color: '#f8fafc', // slate-50
              border: '1px solid #3f3f46', // zinc-700
            },
            success: {
              iconTheme: { primary: '#f97316', secondary: '#18181b' }, // orange-500
            }
          }}
        />
      </body>
    </html>
  );
}
