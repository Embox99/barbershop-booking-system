import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../api/axios";
import {
  Trash2, UserPlus, Calendar, Users, Phone, Scissors,
  PlusCircle, Pencil, Check, X, TrendingUp, Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import type { Appointment, Barber, Service, Stats } from "../types";

const statusBadge: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};


export const AdminPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"stats" | "appointments" | "barbers" | "services">("stats");

  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);

  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberPhone, setNewBarberPhone] = useState("");
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: stats } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await axios.get("/admin/stats")).data,
    refetchInterval: 60_000,
  });

  const { data: appointmentsResp } = useQuery<{ data: Appointment[]; pagination: Pagination }>({
    queryKey: ["appointments", filterDate, page],
    queryFn: async () =>
      (await axios.get("/admin/appointments", { params: { date: filterDate || undefined, page } })).data,
    enabled: activeTab === "appointments",
  });
  const appointments = appointmentsResp?.data ?? [];
  const pagination = appointmentsResp?.pagination;

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ["admin-barbers"],
    queryFn: async () => (await axios.get("/admin/barbers")).data,
    enabled: activeTab === "barbers",
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => (await axios.get("/shop/services")).data,
    enabled: activeTab === "services",
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      axios.put(`/admin/appointments/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const createBarberMutation = useMutation({
    mutationFn: async () => axios.post("/admin/barbers", { name: newBarberName, phone: newBarberPhone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-barbers"] });
      setNewBarberName(""); setNewBarberPhone("");
      toast.success("Barber added!");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Error"),
  });

  const updateBarberMutation = useMutation({
    mutationFn: async () =>
      axios.patch(`/admin/barbers/${editingBarber!.id}`, { name: editingBarber!.name, phone: editingBarber!.phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-barbers"] });
      setEditingBarber(null); toast.success("Updated!");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Error"),
  });

  const deleteBarberMutation = useMutation({
    mutationFn: async (id: number) => axios.delete(`/admin/barbers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-barbers"] }),
    onError: (err: any) => toast.error(err.response?.data?.error || "Error"),
  });

  const createServiceMutation = useMutation({
    mutationFn: async () =>
      axios.post("/admin/services", {
        name: newServiceName, description: newServiceDesc || undefined,
        price: Number(newServicePrice), duration: Number(newServiceDuration),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setNewServiceName(""); setNewServiceDesc(""); setNewServicePrice(""); setNewServiceDuration("");
      toast.success("Service added!");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Error"),
  });

  const updateServiceMutation = useMutation({
    mutationFn: async () =>
      axios.patch(`/admin/services/${editingService!.id}`, {
        name: editingService!.name, description: editingService!.description,
        price: Number(editingService!.price), duration: Number(editingService!.duration),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setEditingService(null); toast.success("Updated!");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Error"),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => axios.delete(`/admin/services/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
    onError: (err: any) => toast.error(err.response?.data?.error || "Error"),
  });

  const tabs = [
    { key: "stats", label: "Overview", icon: <TrendingUp size={18} /> },
    { key: "appointments", label: "Appointments", icon: <Calendar size={18} /> },
    { key: "barbers", label: "Barbers", icon: <Users size={18} /> },
    { key: "services", label: "Services", icon: <Scissors size={18} /> },
  ] as const;

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Link to="/" className="text-lg font-bold hover:underline">← Home</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl w-fit border shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.key ? "bg-black text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      {activeTab === "stats" && (
        <div className="animate-fade-in space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Today's bookings", value: stats?.today.appointments ?? "—" },
              { label: "Week revenue", value: stats ? `₪${stats.week.revenue.toLocaleString()}` : "—" },
              { label: "Month revenue", value: stats ? `₪${stats.month.revenue.toLocaleString()}` : "—" },
              { label: "Total clients", value: stats?.totalClients ?? "—" },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl border shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Top service */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Star size={14} /> Most popular service
              </p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.topService ?? "No data yet"}
              </p>
            </div>

            {/* Barber load this week */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Users size={14} /> Barber load this week
              </p>
              {stats?.barberLoad.length === 0 && (
                <p className="text-gray-400 text-sm">No data yet</p>
              )}
              {stats?.barberLoad.map((b) => {
                const maxLoad = Math.max(...(stats.barberLoad.map((x) => x.appointments)));
                const pct = maxLoad > 0 ? (b.appointments / maxLoad) * 100 : 0;
                return (
                  <div key={b.barberId} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{b.name}</span>
                      <span className="text-gray-400">{b.appointments} appts</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* This week vs month */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">This week</p>
              <p className="text-2xl font-bold">{stats?.week.appointments ?? 0} <span className="text-base font-normal text-gray-400">appointments</span></p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">This month</p>
              <p className="text-2xl font-bold">{stats?.month.appointments ?? 0} <span className="text-base font-normal text-gray-400">appointments</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ── Appointments ────────────────────────────────────────────────── */}
      {activeTab === "appointments" && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <input type="date" value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
              className="border bg-white p-2 rounded-lg outline-none text-sm" />
            {filterDate && (
              <button onClick={() => { setFilterDate(""); setPage(1); }}
                className="text-sm text-gray-500 hover:text-black border px-3 py-2 rounded-lg">
                Clear
              </button>
            )}
            {pagination && <span className="text-sm text-gray-400 ml-auto">{pagination.total} total</span>}
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Time", "Client", "Barber", "Service", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium">
                      {new Date(app.dateTime).toLocaleString("en-US", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
                      })}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-sm">{app.user?.name}</div>
                      <div className="text-xs text-gray-500">{app.user?.phone}</div>
                    </td>
                    <td className="p-4 text-sm">{app.barber?.name}</td>
                    <td className="p-4 text-sm">{app.service?.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge[app.status] ?? ""}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      {app.status !== "confirmed" && (
                        <button onClick={() => statusMutation.mutate({ id: app.id, status: "confirmed" })}
                          className="text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-2 py-1 rounded hover:bg-green-100">
                          ✔ Confirm
                        </button>
                      )}
                      {app.status !== "cancelled" && (
                        <button onClick={() => statusMutation.mutate({ id: app.id, status: "cancelled" })}
                          className="text-red-600 text-xs font-bold border border-red-200 bg-red-50 px-2 py-1 rounded hover:bg-red-100">
                          ✖ Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && <div className="p-8 text-center text-gray-400">No appointments</div>}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100">← Prev</button>
              <span className="px-4 py-2 text-sm text-gray-600">{page} / {pagination.totalPages}</span>
              <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100">Next →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Barbers ─────────────────────────────────────────────────────── */}
      {activeTab === "barbers" && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus size={20} /> New Barber</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                <input className="w-full border bg-gray-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="e.g. David" value={newBarberName} onChange={(e) => setNewBarberName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                <input className="w-full border bg-gray-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="050-..." value={newBarberPhone} onChange={(e) => setNewBarberPhone(e.target.value)} />
              </div>
              <button onClick={() => createBarberMutation.mutate()}
                disabled={createBarberMutation.isPending || !newBarberName || !newBarberPhone}
                className="w-full bg-black text-white py-3 rounded-lg font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50">
                {createBarberMutation.isPending ? "Adding..." : "Create Barber"}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 grid gap-4 sm:grid-cols-2 content-start">
            {barbers?.map((barber) => (
              <div key={barber.id} className="bg-white p-4 rounded-xl border shadow-sm hover:border-black transition">
                {editingBarber?.id === barber.id ? (
                  <div className="space-y-2">
                    <input className="w-full border bg-gray-50 p-2 rounded-lg text-sm outline-none"
                      value={editingBarber.name ?? ""} onChange={(e) => setEditingBarber({ ...editingBarber, name: e.target.value })} />
                    <input className="w-full border bg-gray-50 p-2 rounded-lg text-sm outline-none"
                      value={editingBarber.phone} onChange={(e) => setEditingBarber({ ...editingBarber, phone: e.target.value })} />
                    <div className="flex gap-2">
                      <button onClick={() => updateBarberMutation.mutate()}
                        className="flex-1 bg-black text-white py-1.5 rounded text-sm font-bold flex items-center justify-center gap-1">
                        <Check size={14} /> Save
                      </button>
                      <button onClick={() => setEditingBarber(null)}
                        className="flex-1 border py-1.5 rounded text-sm flex items-center justify-center gap-1 text-gray-500">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                        {barber.name?.[0] ?? "?"}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{barber.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {barber.phone}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingBarber(barber)} className="text-gray-400 hover:text-black p-2 rounded transition"><Pencil size={16} /></button>
                      <button onClick={() => { if (confirm(`Delete ${barber.name}?`)) deleteBarberMutation.mutate(barber.id); }}
                        className="text-gray-300 hover:text-red-500 p-2 rounded transition"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Services ────────────────────────────────────────────────────── */}
      {activeTab === "services" && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><PlusCircle size={20} /> New Service</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                <input className="w-full border bg-gray-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="e.g. Haircut" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (optional)</label>
                <textarea rows={2} className="w-full border bg-gray-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-black/5 text-sm resize-none"
                  placeholder="What's included..." value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (₪)</label>
                  <input type="number" min={1} className="w-full border bg-gray-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="100" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time (min)</label>
                  <input type="number" min={1} className="w-full border bg-gray-50 p-2 rounded-lg outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="45" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} />
                </div>
              </div>
              <button onClick={() => createServiceMutation.mutate()}
                disabled={createServiceMutation.isPending || !newServiceName || !newServicePrice || !newServiceDuration}
                className="w-full bg-black text-white py-3 rounded-lg font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50">
                {createServiceMutation.isPending ? "Adding..." : "Add Service"}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 grid gap-4 sm:grid-cols-2 content-start">
            {services?.map((service) => (
              <div key={service.id} className="bg-white p-5 rounded-xl border shadow-sm hover:border-black transition">
                {editingService?.id === service.id ? (
                  <div className="space-y-2">
                    <input className="w-full border bg-gray-50 p-2 rounded-lg text-sm outline-none"
                      placeholder="Name" value={editingService.name}
                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })} />
                    <textarea rows={2} className="w-full border bg-gray-50 p-2 rounded-lg text-sm outline-none resize-none"
                      placeholder="Description (optional)" value={editingService.description ?? ""}
                      onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} />
                    <div className="flex gap-2">
                      <input type="number" min={1} className="w-1/2 border bg-gray-50 p-2 rounded-lg text-sm outline-none"
                        placeholder="Price" value={editingService.price}
                        onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })} />
                      <input type="number" min={1} className="w-1/2 border bg-gray-50 p-2 rounded-lg text-sm outline-none"
                        placeholder="Duration" value={editingService.duration}
                        onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateServiceMutation.mutate()}
                        className="flex-1 bg-black text-white py-1.5 rounded text-sm font-bold flex items-center justify-center gap-1">
                        <Check size={14} /> Save
                      </button>
                      <button onClick={() => setEditingService(null)}
                        className="flex-1 border py-1.5 rounded text-sm flex items-center justify-center gap-1 text-gray-500">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <div className="font-bold text-lg text-gray-900">{service.name}</div>
                      {service.description && (
                        <p className="text-xs text-gray-400 mt-0.5 mb-2 leading-relaxed">{service.description}</p>
                      )}
                      <div className="text-sm text-gray-500 flex gap-3 mt-1">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">₪{service.price}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {service.duration} min</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditingService(service)} className="text-gray-400 hover:text-black p-2 rounded transition"><Pencil size={16} /></button>
                      <button onClick={() => { if (confirm(`Delete "${service.name}"?`)) deleteServiceMutation.mutate(service.id); }}
                        className="text-gray-300 hover:text-red-500 p-2 rounded transition"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {services?.length === 0 && <div className="text-gray-500 col-span-2 text-center py-8">No services yet</div>}
          </div>
        </div>
      )}
    </div>
  );
};
