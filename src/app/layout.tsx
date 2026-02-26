import type { Metadata } from "next";
import "./globals.css";
import NavBar from "../components/nav-bar";

export const metadata: Metadata = {
  title: "DevCard",
  description: "Developer Identity Card Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
