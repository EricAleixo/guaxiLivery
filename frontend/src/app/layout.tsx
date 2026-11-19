import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ChatProvider } from "@/lib/chat";
import { BagProvider } from "@/lib/bag";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["600", "700", "800"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GuaxiLivery — entrega rápida, esperta e noturna",
  description: "O delivery do guaxinim: peça, acompanhe e entregue comida com a GuaxiLivery.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${baloo.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ChatProvider>
            <BagProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </BagProvider>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
