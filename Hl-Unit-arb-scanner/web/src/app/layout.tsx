
import './globals.css';
export const metadata = { title: 'HL Unit Arb Scanner', description: 'Cross-venue arb monitor' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <div className="max-w-7xl mx-auto p-6 space-y-6">{children}</div>
      </body>
    </html>
  );
}
