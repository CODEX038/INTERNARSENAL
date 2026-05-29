// app/integrations/page.tsx
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function IntegrationsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
        <p className="text-slate-400">GitHub, Gmail, Google Calendar — coming soon</p>
      </div>
    </DashboardLayout>
  )
}