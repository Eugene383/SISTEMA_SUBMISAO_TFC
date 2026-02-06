
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Footer } from "@/components/footer";
import { NavBar } from "@/components/nav-bar";


const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Plataforma TFC",
  description: "Plataforma para carregamento de TFC"
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          
           <div className="w-full justify-center flex flex-1 items-center px-5 py-5">
           
            <NavBar   />
           </div>

           
    <script src="https://cdn.botpress.cloud/webchat/v3.5/inject.js"></script>
    <script src="https://files.bpcontent.cloud/2026/01/10/19/20260110191559-HGOW0T34.js" defer></script>
    
        
          <Providers>{children}</Providers>
           <div className="w-full justify-center flex flex-1 items-center px-5">
            <Footer/>
           </div>
        </ThemeProvider>
       
      </body>
    </html>
  );
}
