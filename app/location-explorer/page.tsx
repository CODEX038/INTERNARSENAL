// app/location-explorer/page.tsx
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function LocationExplorerPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Location Explorer</h1>
        <p className="text-slate-400">City-wise internship discovery — coming soon</p>
      </div>
    </DashboardLayout>
  )
}