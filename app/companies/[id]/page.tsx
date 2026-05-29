import DashboardLayout from "@/components/layout/DashboardLayout"
import Link from "next/link"

export default function CompanyDetailPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Link href="/companies" className="text-indigo-400 text-sm hover:text-indigo-300 mb-6 block">
          ← Back to Companies
        </Link>
        <h1 className="text-3xl font-bold text-white">Company Details</h1>
        <p className="text-slate-400 mt-2">Coming soon</p>
      </div>
    </DashboardLayout>
  )
}