"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 h-16 w-full bg-gray-900/80 backdrop-blur flex items-center px-6">
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <Link href="/" className="text-white font-bold text-lg">
          🃏 DevCard
        </Link>
        <div className="flex gap-6">
          <Link
            href="/"
            className={`text-sm ${pathname === "/" ? "text-white font-semibold" : "text-gray-400 hover:text-white"}`}
          >
            Home
          </Link>
          <Link
            href="/gallery"
            className={`text-sm ${pathname === "/gallery" ? "text-white font-semibold" : "text-gray-400 hover:text-white"}`}
          >
            Gallery
          </Link>
        </div>
      </div>
    </nav>
  );
}
