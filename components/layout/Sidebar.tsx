"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "Dashboard",    href: "/dashboard",           icon: "📊" },
  { label: "Internships",  href: "/internships",          icon: "🔍" },
  { label: "Companies",    href: "/companies",            icon: "🏢" },
  { label: "Hidden Opps",  href: "/hidden-opportunities", icon: "💎" },
  { label: "Skills Gap", href: "/skills-gap", icon: "🎯" },
  { label: "Resume Builder", href: "/resume-builder",    icon: "📄" },
  { label: "Cover Letter", href: "/cover-letter",         icon: "📝" },
  { label: "Library", href: "/library", icon: "📚" },
  { label: "Cold Email",   href: "/cold-email",           icon: "✉️" },
  { label: "Applications", href: "/applications",         icon: "📋" },
  { label: "Recruiter CRM", href: "/contacts", icon: "👥" },
  { label: "InternBot AI", href: "/internbot",            icon: "🤖" },
  { label: "Profile",      href: "/profile",              icon: "👤" },
  { label: "Settings",     href: "/settings",             icon: "⚙️" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/dashboard" className="text-white font-bold text-lg">
          Intern<span className="text-indigo-400">Arsenal</span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <span>🚪</span> Logout
        </Link>
      </div>
    </aside>
  )
}