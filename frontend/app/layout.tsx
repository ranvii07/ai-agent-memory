import "./globals.css";

export const metadata = {
  title: "AI Agent with Memory",
  description: "Minimal full-stack AI agent with persistent, cross-session memory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
