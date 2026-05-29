import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const CITIES = [
  { id: "mumbai",     name: "Mumbai",     state: "Maharashtra",    lat: 19.0760, lng: 72.8777 },
  { id: "bengaluru",  name: "Bengaluru",  state: "Karnataka",      lat: 12.9716, lng: 77.5946 },
  { id: "delhi",      name: "Delhi",      state: "Delhi",          lat: 28.6139, lng: 77.2090 },
  { id: "pune",       name: "Pune",       state: "Maharashtra",    lat: 18.5204, lng: 73.8567 },
  { id: "hyderabad",  name: "Hyderabad",  state: "Telangana",      lat: 17.3850, lng: 78.4867 },
  { id: "chennai",    name: "Chennai",    state: "Tamil Nadu",     lat: 13.0827, lng: 80.2707 },
  { id: "noida",      name: "Noida",      state: "Uttar Pradesh",  lat: 28.5355, lng: 77.3910 },
  { id: "gurugram",   name: "Gurugram",   state: "Haryana",        lat: 28.4595, lng: 77.0266 },
  { id: "ahmedabad",  name: "Ahmedabad",  state: "Gujarat",        lat: 23.0225, lng: 72.5714 },
  { id: "kolkata",    name: "Kolkata",    state: "West Bengal",    lat: 22.5726, lng: 88.3639 },
  { id: "kochi",      name: "Kochi",      state: "Kerala",         lat: 9.9312,  lng: 76.2673 },
  { id: "jaipur",     name: "Jaipur",     state: "Rajasthan",      lat: 26.9124, lng: 75.7873 },
  { id: "indore",     name: "Indore",     state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { id: "nagpur",     name: "Nagpur",     state: "Maharashtra",    lat: 21.1458, lng: 79.0882 },
  { id: "chandigarh", name: "Chandigarh", state: "Chandigarh",     lat: 30.7333, lng: 76.7794 },
]

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (c) => c.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ cities: CITIES })
  } catch (error) {
    console.error("Locations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}