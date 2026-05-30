"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Contact {
  id:                 string
  name:               string
  role:               string | null
  email:              string | null
  linkedinUrl:        string | null
  verificationStatus: string
  replyStatus:        string
  doNotContact:       boolean
  lastContactedAt:    string | null
  notes:              string | null
  createdAt:          string
}

const VERIFICATION_COLORS: Record<string, string> = {
  verified:       "bg-green-500/10 text-green-400 border-green-500/20",
  unverified:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  bounced:        "bg-red-500/10 text-red-400 border-red-500/20",
  do_not_contact: "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

const REPLY_COLORS: Record<string, string> = {
  no_response: "text-slate-400",
  replied:     "text-green-400",
  rejected:    "text-red-400",
}

export default function ContactsPage() {
  const [contacts,   setContacts]   = useState<Contact[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState("")
  const [showForm,   setShowForm]   = useState(false)
  const [adding,     setAdding]     = useState(false)
  const [error,      setError]      = useState("")
  const [editContact, setEditContact] = useState<Contact | null>(null)

  const [form, setForm] = useState({
    name:        "",
    role:        "",
    email:       "",
    linkedinUrl: "",
    notes:       "",
  })

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function fetchContacts() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res  = await fetch(`/api/contacts?${params}`)
      const data = await res.json()
      setContacts(data.contacts ?? [])
    } catch {
      console.error("Failed to fetch contacts")
    } finally {
      setLoading(false)
    }
  }

  async function addContact() {
    if (!form.name) return
    setAdding(true)
    setError("")
    try {
      const res = await fetch("/api/contacts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setForm({ name: "", role: "", email: "", linkedinUrl: "", notes: "" })
        setShowForm(false)
        fetchContacts()
      } else {
        setError(data.error ?? "Failed to add contact")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setAdding(false)
    }
  }

  async function updateReplyStatus(id: string, replyStatus: string) {
    try {
      await fetch(`/api/contacts/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ replyStatus }),
      })
      setContacts(prev =>
        prev.map(c => c.id === id ? { ...c, replyStatus } : c)
      )
    } catch {
      console.error("Failed to update contact")
    }
  }

  async function toggleDoNotContact(id: string, current: boolean) {
    try {
      await fetch(`/api/contacts/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ doNotContact: !current }),
      })
      setContacts(prev =>
        prev.map(c => c.id === id ? { ...c, doNotContact: !current } : c)
      )
    } catch {
      console.error("Failed to update contact")
    }
  }

  async function deleteContact(id: string) {
    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" })
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch {
      console.error("Failed to delete contact")
    }
  }

  useEffect(() => { fetchContacts() }, [])

  const stats = {
    total:      contacts.length,
    verified:   contacts.filter(c => c.verificationStatus === "verified").length,
    replied:    contacts.filter(c => c.replyStatus === "replied").length,
    doNotContact: contacts.filter(c => c.doNotContact).length,
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Recruiter CRM</h1>
            <p className="text-slate-400">Manage HR, founder, and recruiter contacts</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            + Add Contact
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Contacts", value: stats.total,        icon: "👥" },
            { label: "Verified",       value: stats.verified,     icon: "✅" },
            { label: "Replied",        value: stats.replied,      icon: "💬" },
            { label: "Do Not Contact", value: stats.doNotContact, icon: "🚫" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add Contact Form */}
        {showForm && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Add New Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-sm">Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => updateForm("name", e.target.value)}
                  placeholder="Priya Sharma"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Role/Title</Label>
                <Input
                  value={form.role}
                  onChange={e => updateForm("role", e.target.value)}
                  placeholder="HR Manager / Founder / Recruiter"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Email</Label>
                <Input
                  value={form.email}
                  onChange={e => updateForm("email", e.target.value)}
                  placeholder="priya@company.com"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">LinkedIn URL</Label>
                <Input
                  value={form.linkedinUrl}
                  onChange={e => updateForm("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/priya"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => updateForm("notes", e.target.value)}
                  placeholder="Met at hackathon, interested in React developers..."
                  className="mt-1 bg-slate-800 border-white/10 text-white h-20"
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                onClick={addContact}
                disabled={adding || !form.name}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {adding ? "Adding..." : "Add Contact"}
              </Button>
              <Button
                onClick={() => { setShowForm(false); setError("") }}
                variant="outline"
                className="border-white/10 text-slate-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-3 mb-6">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchContacts()}
            placeholder="Search by name, email, role..."
            className="max-w-md bg-slate-800 border-white/10 text-white"
          />
          <Button
            onClick={fetchContacts}
            variant="outline"
            className="border-white/10 text-slate-400"
          >
            Search
          </Button>
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-white/10 rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-white font-semibold mb-2">No contacts yet</h3>
            <p className="text-slate-400 text-sm mb-4">
              Add HR managers, founders, and recruiters you want to reach out to
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Add Your First Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-colors ${
                  contact.doNotContact
                    ? "border-red-500/20 opacity-60"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-medium">{contact.name}</h3>

                      {/* Verification status badge */}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        VERIFICATION_COLORS[contact.verificationStatus] ?? ""
                      }`}>
                        {contact.verificationStatus.replace(/_/g, " ")}
                      </span>

                      {/* Do not contact badge */}
                      {contact.doNotContact && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          🚫 Do Not Contact
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-400 text-sm">
                      {contact.role && <span>💼 {contact.role}</span>}
                      {contact.email && (
                        
                          <a  href={`mailto:${contact.email}`}
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          ✉️ {contact.email}
                        </a>
                      )}
                      {contact.linkedinUrl && (
                        
                          <a href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          LinkedIn
                        </a>
                      )}
                      {contact.lastContactedAt && (
                        <span>
                          Last contacted: {new Date(contact.lastContactedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {contact.notes && (
                      <p className="text-slate-500 text-xs mt-2 italic">
                        "{contact.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Reply status */}
                    <select
                      value={contact.replyStatus}
                      onChange={e => updateReplyStatus(contact.id, e.target.value)}
                      className={`bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-xs ${
                        REPLY_COLORS[contact.replyStatus] ?? "text-slate-400"
                      }`}
                    >
                      <option value="no_response">No Response</option>
                      <option value="replied">Replied</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    {/* Cold email button */}
                    {!contact.doNotContact && contact.email && (
                      
                        <a href={`/cold-email?company=${encodeURIComponent(contact.name)}`}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Email
                      </a>
                    )}

                    {/* Do not contact toggle */}
                    <button
                      onClick={() => toggleDoNotContact(contact.id, contact.doNotContact)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        contact.doNotContact
                          ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                          : "bg-slate-800 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {contact.doNotContact ? "Unblock" : "Block"}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="text-xs bg-slate-800 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}