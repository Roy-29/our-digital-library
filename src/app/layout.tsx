import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ডিজিটাল বইয়ের ঘর | Digital Library",
  description: "Swapnil ও Bipro-এর ব্যক্তিগত ডিজিটাল লাইব্রেরি — সম্পূর্ণ বই ব্যবস্থাপনা সিস্টেম",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📚</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: "'Noto Sans Bengali', sans-serif",
                borderRadius: '10px',
                background: '#2D2A26',
                color: '#FDF6E3',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
