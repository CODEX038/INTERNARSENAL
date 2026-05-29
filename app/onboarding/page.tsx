// app/onboarding/page.tsx
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function OnboardingPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Onboarding</h1>
        <p className="text-slate-400">Welcome setup — coming soon</p>
      </div>
    </DashboardLayout>
  )
}