import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TranslationProvider } from "../contexts/TranslationContext";
import { AuthProvider } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ahmed Cooling Workshop | AC & Appliance Repair",
  description: "Professional AC, Refrigerator, Washing Machine repair & maintenance services in Jeddah, Saudi Arabia. 24/7 Emergency service available.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>❄️</text></svg>",
  },
  openGraph: {
    title: "Ahmed Cooling Workshop",
    description: "Professional AC & Appliance Repair in Jeddah, Saudi Arabia",
    siteName: "Ahmed Cooling Workshop",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#F0F4FF] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9] antialiased">
        <ThemeProvider>
          <TranslationProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <WhatsAppButton />
            </AuthProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
