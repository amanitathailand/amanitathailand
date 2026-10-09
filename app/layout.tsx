import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amanita Thailand | 3D Digital Museum & Botanical Archive",
  description: "พิพิธภัณฑ์ดิจิทัล 3 มิติ และคลังบันทึกข้อมูลทางประวัติศาสตร์ ชีวเคมี และพฤกษศาสตร์ของเห็ดศักดิ์สิทธิ์ Amanita Muscaria",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://amanitathailand.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" style={{ backgroundColor: '#070b08', color: '#f5f3eb' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;600&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body 
        className="antialiased bg-[#070b08] text-[#f5f3eb]"
        style={{ backgroundColor: '#070b08', color: '#f5f3eb', minHeight: '100vh', margin: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
