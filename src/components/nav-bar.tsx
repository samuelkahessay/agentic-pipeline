"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/simulator", label: "Simulator" },
  { href: "/replay", label: "Replay" },
  { href: "/forensics", label: "Forensics" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 h-16 bg-gray-900 flex items-center px-6 shadow-md">
      <span className="text-lg font-semibold text-white mr-auto">
        Pipeline Observatory
      </span>
      <div className="flex gap-6">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={
              pathname === href
                ? "text-white font-medium border-b-2 border-indigo-400 pb-0.5"
                : "text-gray-400 hover:text-white transition-colors"
            }
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
