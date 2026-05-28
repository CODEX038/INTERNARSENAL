import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-white/10">
        <span className="text-white font-bold text-xl tracking-tight">
          Intern<span className="text-indigo-400">Arsenal</span>
        </span>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 text-indigo-400 text-sm mb-8">
          🚀 Built for Indian Engineering Students
        </div>
        <h1 className="text-6xl font-bold text-white mb-6 leading-tight max-w-3xl">
          Find Internships.<br />
          <span className="text-indigo-400">Land Them.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mb-10">
          AI-powered internship discovery, ATS resume generation, cold email system,
          and application tracking — all in one place.
        </p>
        <Link href="/signup">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-6 text-lg">
            Start for Free →
          </Button>
        </Link>
      </section>

      {/* Feature Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "🔍", title: "Internship Discovery", desc: "Aggregated listings from 10+ platforms with smart filters" },
          { icon: "📄", title: "AI Resume Builder", desc: "ATS-optimized resumes tailored to each job description" },
          { icon: "✉️", title: "Cold Email System", desc: "Ethical outreach to founders & HR with follow-up tracking" },
          { icon: "🏢", title: "Hidden Opportunities", desc: "City-wise startup discovery — companies not on job boards" },
          { icon: "🎯", title: "Match Score", desc: "Know exactly how well your profile fits each internship" },
          { icon: "📊", title: "Application Tracker", desc: "Full pipeline from saved → applied → offer in one dashboard" },
        ].map((f) => (
          <div key={f.title} className="bg-slate-900 border border-white/10 rounded-xl p-6 hover:border-indigo-500/40 transition-colors">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-white font-semibold mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}