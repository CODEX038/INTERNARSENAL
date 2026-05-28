"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"

const HIDDEN_COMPANIES = [
  { name: "Sarvam AI",      city: "Bengaluru", industry: "AI/ML",      stack: ["Python", "LLMs", "FastAPI"],            website: "https://sarvam.ai"      },
  { name: "Krutrim",        city: "Bengaluru", industry: "AI",         stack: ["Python", "ML", "Cloud"],                website: "https://krutrim.com"     },
  { name: "Moonshot Jr",    city: "Mumbai",    industry: "EdTech",     stack: ["React", "Node.js", "MongoDB"],          website: "https://moonshotjr.com"  },
  { name: "Supermoney",     city: "Bengaluru", industry: "FinTech",    stack: ["React", "Python", "PostgreSQL"],        website: "https://supermoney.in"   },
  { name: "Eka.care",       city: "Bengaluru", industry: "HealthTech", stack: ["React Native", "Node.js", "AWS"],      website: "https://eka.care"        },
  { name: "Teachmint",      city: "Bengaluru", industry: "EdTech",     stack: ["React", "Node.js", "Redis"],           website: "https://teachmint.com"   },
  { name: "Jar App",        city: "Bengaluru", industry: "FinTech",    stack: ["Flutter", "Python", "AWS"],             website: "https://myjar.app"       },
  { name: "Pixis",          city: "Bengaluru", industry: "AI/ML",      stack: ["Python", "TensorFlow", "React"],       website: "https://pixis.ai"        },
  { name: "Leverage Edu",   city: "Delhi",     industry: "EdTech",     stack: ["React", "Node.js", "MongoDB"],          website: "https://leverageedu.com" },
  { name: "Classplus",      city: "Noida",     industry: "EdTech",     stack: ["React Native", "Node.js", "MySQL"],    website: "https://classplusapp.com"},
  { name: "Freo",           city: "Bengaluru", industry: "FinTech",    stack: ["React", "Python", "Kubernetes"],        website: "https://freo.money"      },
  { name: "OneCode",        city: "Bengaluru", industry: "FinTech",    stack: ["React", "Node.js", "PostgreSQL"],       website: "https://onecode.in"      },
]

export default function HiddenOpportunitiesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Hidden Opportunities</h1>
          <p className="text-slate-400">
            Startups not actively posting on job boards — reach out directly
          </p>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
          <p className="text-indigo-400 text-sm font-medium mb-1">
            💎 Why hidden opportunities?
          </p>
          <p className="text-slate-400 text-sm">
            60% of Indian startups never post on Internshala or LinkedIn.
            Cold emailing the right person directly has a much higher success rate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HIDDEN_COMPANIES.map(company => (
            <div
              key={company.name}
              className="bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-indigo-500/40 transition-colors"
            >
              <div className="mb-3">
                <h3 className="text-white font-semibold text-sm">{company.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {company.city} · {company.industry}
                </p>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {company.stack.map(t => (
                  <span key={t} className="text-xs bg-slate-800 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 py-2 rounded-lg transition-colors"
                >
                  Visit Site
                </a>
                <a
                  href="/cold-email"
                  className="flex-1 text-center text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors"
                >
                  Cold Email
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}