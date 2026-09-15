"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatTime, formatDate, formatCurrency } from "@/lib/utils";
import type { Service, Staff, Booking, Customer, Schedule, AvailabilityRule } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/public";
import { Calendar, Clock, Users, Settings, LogOut, BarChart3, Globe, Plus, Edit, Trash2, Search, Save, X, Check, ChevronLeft, ChevronRight, User, Phone, Video, MapPin, Mail, Building, CheckCircle2, XCircle, TrendingUp, Zap, Shield, Bell, Database, Server, HardDrive, Wifi, Monitor, Laptop, Smartphone, Tablet, Globe2, Navigation, Compass, Target, Award, Star, Heart, Bookmark, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, StatCard, EmptyState } from "@/components/ui/card";
import { Field, Textarea, Select } from "@/components/ui/input";

const AUTH_KEY = "meridian_admin_auth";
const ORG_ID = "11111111-1111-1111-1111-111111111101";

function useAuth() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.loggedIn && data.email) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem(AUTH_KEY);
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    router.push("/admin/login");
  };

  return { authenticated, loading, logout };
}

export default function AdminPortal() {
  const router = useRouter();
  const { authenticated, loading, logout } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schedules, setSchedules] = useState<(Schedule & { availability_rules: AvailabilityRule[] })[]>([]);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"service" | "staff" | "booking" | "customer" | "schedule">("service");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const sb = createPublicClient();

  const fetchData = useCallback(async () => {
    if (!sb) return;
    try {
      const [svcRes, stfRes, bkRes, custRes, schRes] = await Promise.all([
        sb.from("meridian_services").select("*").eq("org_id", ORG_ID).eq("is_active", true).order("sort_order"),
        sb.from("meridian_staff").select("*").eq("org_id", ORG_ID).eq("is_active", true).order("display_name"),
        sb.from("meridian_bookings").select("*").eq("org_id", ORG_ID).order("starts_at", { ascending: false }),
        sb.from("meridian_customers").select("*").eq("org_id", ORG_ID).order("created_at", { ascending: false }),
        sb.from("meridian_schedules").select("*, meridian_availability_rules(*)").eq("org_id", ORG_ID),
      ]);
      setServices(svcRes.data || []);
      setStaff(stfRes.data || []);
      setBookings(bkRes.data || []);
      setCustomers(custRes.data || []);
      setSchedules(schRes.data || []);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }, [sb]);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/admin/login");
    }
  }, [loading, authenticated, router]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (type: typeof modalType, item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const saveService = async (item: Service) => {
    if (!sb) return;
    const { error } = await sb.from("meridian_services").upsert({ ...item, org_id: ORG_ID, updated_at: new Date().toISOString() });
    if (error) { showToast(error.message, "error"); return; }
    showToast("Service saved");
    closeModal();
    fetchData();
  };

  const saveStaff = async (item: Staff) => {
    if (!sb) { showToast("Database not connected", "error"); return; }
    try {
      const { error } = await sb.from("meridian_staff").upsert({ ...item, org_id: ORG_ID, updated_at: new Date().toISOString() });
      if (error) { showToast(`Error: ${error.message}`, "error"); console.error("Staff save error:", error); return; }
      showToast("Staff saved");
      closeModal();
      fetchData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`, "error"); console.error("Staff save exception:", e);
    }
  };

  const saveBooking = async (item: Booking) => {
    if (!sb) return;
    const { error } = await sb.from("meridian_bookings").upsert({ ...item, org_id: ORG_ID, updated_at: new Date().toISOString() });
    if (error) { showToast(error.message, "error"); return; }
    showToast("Booking saved");
    closeModal();
    fetchData();
  };

  const saveCustomer = async (item: Customer) => {
    if (!sb) return;
    const { error } = await sb.from("meridian_customers").upsert({ ...item, org_id: ORG_ID, updated_at: new Date().toISOString() });
    if (error) { showToast(error.message, "error"); return; }
    showToast("Customer saved");
    closeModal();
    fetchData();
  };

  const saveSchedule = async (item: Schedule & { availability_rules: AvailabilityRule[] }) => {
    if (!sb) return;
    const { availability_rules, ...scheduleData } = item;
    const { error: schError } = await sb.from("meridian_schedules").upsert({ ...scheduleData, org_id: ORG_ID, updated_at: new Date().toISOString() });
    if (schError) { showToast(schError.message, "error"); return; }
    await sb.from("meridian_availability_rules").delete().eq("schedule_id", item.id);
    if (availability_rules.length > 0) {
      const { error: rulesError } = await sb.from("meridian_availability_rules").insert(availability_rules.map(r => ({ ...r, schedule_id: item.id })));
      if (rulesError) { showToast(rulesError.message, "error"); return; }
    }
    showToast("Schedule saved");
    closeModal();
    fetchData();
  };

  const deleteItem = async (type: string, id: string) => {
    if (!confirm("Are you sure?")) return;
    if (!sb) return;
    const table = type === "service" ? "meridian_services" : type === "staff" ? "meridian_staff" : type === "booking" ? "meridian_bookings" : type === "customer" ? "meridian_customers" : "meridian_schedules";
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) { showToast(error.message, "error"); return; }
    showToast(`${type} deleted`, "info");
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-teal flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <p className="text-mute">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-mute">Redirecting to login...</p>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "services", label: "Services", icon: <Zap className="h-4 w-4" /> },
    { id: "staff", label: "Staff", icon: <Users className="h-4 w-4" /> },
    { id: "bookings", label: "Bookings", icon: <Calendar className="h-4 w-4" /> },
    { id: "customers", label: "Customers", icon: <User className="h-4 w-4" /> },
    { id: "availability", label: "Availability", icon: <Clock className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-paper flex">
      <aside className={cn("border-r border-hairline bg-surface transition-all duration-200 flex flex-col", sidebarOpen ? "w-64" : "w-16")}>
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          {sidebarOpen && <span className="font-display font-bold text-lg">Meridian Admin</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-hairline/50">
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setCurrentPage(item.id)} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-field text-sm transition-colors", currentPage === item.id ? "bg-teal-100 text-teal-600 font-medium" : "text-mute hover:text-ink hover:bg-hairline/50")}>
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-2 border-t border-hairline">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-field text-sm text-mute hover:text-stop hover:bg-stop/5 transition-colors">
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 max-w-7xl overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold capitalize">{currentPage}</h1>
            <p className="text-sm text-mute">Manage your {currentPage}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 rounded-field border border-hairline bg-surface text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 w-64" />
            </div>
            {(currentPage === "services" || currentPage === "staff" || currentPage === "bookings" || currentPage === "customers") && (
              <Button size="sm" onClick={() => openModal(currentPage.slice(0, -1) as any)}>
                <Plus className="h-4 w-4" /> Add {currentPage.slice(0, -1)}
              </Button>
            )}
          </div>
        </div>

        {currentPage === "dashboard" && <DashboardPage services={services} staff={staff} bookings={bookings} customers={customers} />}
        {currentPage === "services" && <ServicesPage services={services} onEdit={(s) => openModal("service", s)} onDelete={(id) => deleteItem("service", id)} searchQuery={searchQuery} />}
        {currentPage === "staff" && <StaffPage staff={staff} onEdit={(s) => openModal("staff", s)} onDelete={(id) => deleteItem("staff", id)} searchQuery={searchQuery} />}
        {currentPage === "bookings" && <BookingsPage bookings={bookings} services={services} staff={staff} onEdit={(b) => openModal("booking", b)} onDelete={(id) => deleteItem("booking", id)} searchQuery={searchQuery} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />}
        {currentPage === "customers" && <CustomersPage customers={customers} onEdit={(c) => openModal("customer", c)} onDelete={(id) => deleteItem("customer", id)} searchQuery={searchQuery} />}
        {currentPage === "availability" && <AvailabilityPage schedules={schedules} staff={staff} onEdit={(s) => openModal("schedule", s)} onDelete={(id) => deleteItem("schedule", id)} />}
        {currentPage === "settings" && <SettingsPage />}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-surface rounded-sheet shadow-float max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-hairline px-6 py-4 flex items-center justify-between rounded-t-sheet">
              <h2 className="font-display font-semibold text-lg">{editingItem ? "Edit" : "Add"} {modalType}</h2>
              <button onClick={closeModal} className="p-1 rounded hover:bg-hairline/50"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              {modalType === "service" && <ServiceForm item={editingItem} onSave={saveService} onClose={closeModal} />}
              {modalType === "staff" && <StaffForm item={editingItem} onSave={saveStaff} onClose={closeModal} />}
              {modalType === "booking" && <BookingForm item={editingItem} onSave={saveBooking} onClose={closeModal} services={services} staff={staff} />}
              {modalType === "customer" && <CustomerForm item={editingItem} onSave={saveCustomer} onClose={closeModal} />}
              {modalType === "schedule" && <ScheduleForm item={editingItem} onSave={saveSchedule} onClose={closeModal} />}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-field shadow-float text-sm font-medium z-50", toast.type === "success" ? "bg-ok text-white" : toast.type === "error" ? "bg-stop text-white" : "bg-ink text-paper")}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function DashboardPage({ services, staff, bookings, customers }: { services: Service[]; staff: Staff[]; bookings: Booking[]; customers: Customer[] }) {
  const confirmed = bookings.filter(b => b.status === "confirmed").length;
  const pending = bookings.filter(b => b.status === "pending").length;
  const cancelled = bookings.filter(b => b.status === "cancelled").length;
  const revenue = bookings.filter(b => b.status === "confirmed" || b.status === "completed").reduce((s, b) => s + (b.price_cents || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={bookings.length} icon={<Calendar className="h-4 w-4" />} />
        <StatCard label="Confirmed" value={confirmed} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Pending" value={pending} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Cancelled" value={cancelled} icon={<XCircle className="h-4 w-4" />} />
        <StatCard label="Revenue" value={formatCurrency(revenue, "USD")} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Customers" value={customers.length} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Services" value={services.length} icon={<Zap className="h-4 w-4" />} />
        <StatCard label="Staff" value={staff.length} icon={<User className="h-4 w-4" />} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-semibold mb-4">Recent Bookings</h3>
          {bookings.length === 0 ? <EmptyState title="No bookings yet" description="Bookings will appear here once customers start scheduling." /> : (
            <div className="space-y-3">{bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
                <div><p className="font-medium text-sm">{b.title || "Booking"}</p><p className="text-xs text-mute">{b.reference}</p></div>
                <Badge variant={b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending"}>{b.status}</Badge>
              </div>
            ))}</div>
          )}
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-4">Services</h3>
          {services.length === 0 ? <EmptyState title="No services yet" description="Create your first service to start accepting bookings." /> : (
            <div className="space-y-3">{services.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
                <div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-mute">{s.duration_minutes} min · {formatCurrency(s.price_cents, s.currency)}</p></div>
                <Badge variant={s.is_published ? "confirmed" : "pending"}>{s.is_published ? "Published" : "Draft"}</Badge>
              </div>
            ))}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ServicesPage({ services, onEdit, onDelete, searchQuery }: { services: Service[]; onEdit: (s: Service) => void; onDelete: (id: string) => void; searchQuery: string }) {
  const filtered = services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="space-y-4">
      {filtered.length === 0 ? <EmptyState title="No services found" description="Try adjusting your search or create a new service." /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-display font-semibold">{s.name}</h3>{s.description && <p className="text-sm text-mute mt-1 line-clamp-2">{s.description}</p>}</div>
                <Badge variant={s.is_published ? "confirmed" : "pending"}>{s.is_published ? "Published" : "Draft"}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-mute mb-3">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration_minutes} min</span>
                <span className="tabular font-medium text-brass">{formatCurrency(s.price_cents, s.currency)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(s)}><Edit className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" className="flex-1 text-stop hover:text-stop" onClick={() => onDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffPage({ staff, onEdit, onDelete, searchQuery }: { staff: Staff[]; onEdit: (s: Staff) => void; onDelete: (id: string) => void; searchQuery: string }) {
  const filtered = staff.filter(s => s.display_name.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="space-y-4">
      {filtered.length === 0 ? <EmptyState title="No staff found" description="Try adjusting your search or add a new staff member." /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} hover>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: s.color || "#0E7C7B" }}>{s.display_name.split(" ").map(n => n[0]).join("")}</div>
                <div><h3 className="font-display font-semibold">{s.display_name}</h3>{s.title && <p className="text-xs text-mute">{s.title}</p>}</div>
              </div>
              <div className="space-y-1 text-xs text-mute mb-3">
                {s.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</p>}
                {s.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</p>}
                <p className="flex items-center gap-1"><Globe className="h-3 w-3" />{s.timezone}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(s)}><Edit className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" className="flex-1 text-stop hover:text-stop" onClick={() => onDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsPage({ bookings, services, staff, onEdit, onDelete, searchQuery, filterStatus, setFilterStatus }: { bookings: Booking[]; services: Service[]; staff: Staff[]; onEdit: (b: Booking) => void; onDelete: (id: string) => void; searchQuery: string; filterStatus: string; setFilterStatus: (s: string) => void }) {
  const filtered = bookings.filter(b => {
    const matchSearch = b.reference?.toLowerCase().includes(searchQuery.toLowerCase()) || b.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {["all", "confirmed", "pending", "cancelled", "completed"].map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-colors", filterStatus === status ? "bg-teal text-white" : "bg-hairline/20 text-mute hover:bg-hairline/40")}>{status}</button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState title="No bookings found" description="Try adjusting your search or filters." /> : (
        <Card><div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th>Reference</th><th>Service</th><th>Staff</th><th>Date</th><th>Status</th><th>Price</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((b) => {
                const svc = services.find(s => s.id === b.service_id);
                const stf = staff.find(s => s.id === b.staff_id);
                return (
                  <tr key={b.id} className="border-b border-hairline last:border-0">
                    <td className="py-3 px-4 text-sm tabular">{b.reference}</td>
                    <td className="py-3 px-4 text-sm">{svc?.name || "-"}</td>
                    <td className="py-3 px-4 text-sm">{stf?.display_name || "-"}</td>
                    <td className="py-3 px-4 text-sm tabular">{formatDate(b.starts_at, b.customer_timezone)} {formatTime(b.starts_at, b.customer_timezone)}</td>
                    <td className="py-3 px-4"><Badge variant={b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending"}>{b.status}</Badge></td>
                    <td className="py-3 px-4 text-sm tabular">{formatCurrency(b.price_cents, b.currency)}</td>
                    <td className="py-3 px-4"><div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(b)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="text-stop hover:text-stop" onClick={() => onDelete(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></Card>
      )}
    </div>
  );
}

function CustomersPage({ customers, onEdit, onDelete, searchQuery }: { customers: Customer[]; onEdit: (c: Customer) => void; onDelete: (id: string) => void; searchQuery: string }) {
  const filtered = customers.filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="space-y-4">
      {filtered.length === 0 ? <EmptyState title="No customers found" description="Try adjusting your search or add a new customer." /> : (
        <Card><div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Last Booking</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-hairline last:border-0">
                  <td className="py-3 px-4 text-sm font-medium">{c.full_name}</td>
                  <td className="py-3 px-4 text-sm text-mute">{c.email}</td>
                  <td className="py-3 px-4 text-sm text-mute">{c.phone || "-"}</td>
                  <td className="py-3 px-4 text-sm tabular">{c.total_bookings}</td>
                  <td className="py-3 px-4 text-sm tabular">{c.last_booking_at ? formatDate(c.last_booking_at, c.timezone || "UTC") : "-"}</td>
                  <td className="py-3 px-4"><div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-stop hover:text-stop" onClick={() => onDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></Card>
      )}
    </div>
  );
}

function AvailabilityPage({ schedules, staff, onEdit, onDelete }: { schedules: (Schedule & { availability_rules: AvailabilityRule[] })[]; staff: Staff[]; onEdit: (s: any) => void; onDelete: (id: string) => void }) {
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return (
    <div className="space-y-6">
      {schedules.map((schedule) => {
        const stf = staff.find(s => s.id === schedule.staff_id);
        return (
          <Card key={schedule.id}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: stf?.color || "#0E7C7B" }}>{stf?.display_name.split(" ").map(n => n[0]).join("")}</div>
                <div><h3 className="font-display font-semibold">{schedule.name}</h3><p className="text-xs text-mute">{stf?.display_name} · {schedule.timezone}</p></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(schedule)}><Edit className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-stop hover:text-stop" onClick={() => onDelete(schedule.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekdayNames.map((day, idx) => {
                const rules = schedule.availability_rules?.filter(r => r.weekday === idx) || [];
                return (
                  <div key={day} className="p-3 rounded-field border border-hairline bg-paper/50">
                    <p className="text-xs font-medium text-mute mb-2">{day}</p>
                    {rules.length === 0 ? <p className="text-xs text-mute">Closed</p> : (
                      <div className="space-y-1">{rules.map(r => <p key={r.id} className="text-xs tabular">{r.start_time} - {r.end_time}</p>)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <Card>
        <h3 className="font-display font-semibold mb-4">Organization Settings</h3>
        <p className="text-sm text-mute">Settings are managed through the database. Contact your administrator to modify organization settings.</p>
      </Card>
    </div>
  );
}

function ServiceForm({ item, onSave, onClose }: { item: Service | null; onSave: (s: Service) => void; onClose: () => void }) {
  const [form, setForm] = useState<Service>(item || {
    id: crypto.randomUUID(), org_id: ORG_ID, category_id: null, slug: "", name: "", description: "",
    duration_minutes: 30, slot_interval_minutes: 15, price_cents: 0, currency: "USD",
    meeting_methods: ["video"] as any, default_method: "video" as any, location: null, phone_number: null,
    custom_meeting_url: null, meeting_instructions: null, buffer_before_minutes: 0, buffer_after_minutes: 0,
    minimum_notice_minutes: 60, maximum_advance_days: 60, max_bookings_per_day: null,
    requires_confirmation: false, allow_reschedule: true, allow_cancellation: true,
    cancellation_notice_hours: 24, capacity: 1, form_id: null, reminder_offsets_minutes: [1440, 120],
    color: "#0E7C7B", sort_order: 0, is_published: true, is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null,
  });

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid rgba(107,127,136,0.26)", borderRadius: "8px", background: "#FFFFFF", color: "#0B1F2A", fontSize: "14px", outline: "none" } as React.CSSProperties;
  const labelStyle = { display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px", color: "#0B1F2A" } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Slug</label>
          <input style={inputStyle} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Duration (min)</label>
          <input style={inputStyle} type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Price (cents)</label>
          <input style={inputStyle} type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Currency</label>
          <input style={inputStyle} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Buffer Before (min)</label>
          <input style={inputStyle} type="number" value={form.buffer_before_minutes} onChange={(e) => setForm({ ...form, buffer_before_minutes: Number(e.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Buffer After (min)</label>
          <input style={inputStyle} type="number" value={form.buffer_after_minutes} onChange={(e) => setForm({ ...form, buffer_after_minutes: Number(e.target.value) })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Min Notice (min)</label>
          <input style={inputStyle} type="number" value={form.minimum_notice_minutes} onChange={(e) => setForm({ ...form, minimum_notice_minutes: Number(e.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Max Advance (days)</label>
          <input style={inputStyle} type="number" value={form.maximum_advance_days} onChange={(e) => setForm({ ...form, maximum_advance_days: Number(e.target.value) })} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}><Save className="h-4 w-4" /> Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function StaffForm({ item, onSave, onClose }: { item: Staff | null; onSave: (s: Staff) => void; onClose: () => void }) {
  const [form, setForm] = useState<Staff>(item || {
    id: crypto.randomUUID(), org_id: ORG_ID, user_id: null, slug: "", display_name: "", title: "",
    bio: null, avatar_url: null, email: "", phone: "", timezone: "Asia/Beirut", color: "#0E7C7B",
    is_bookable: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null,
  });

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid rgba(107,127,136,0.26)",
    borderRadius: "8px",
    background: "#FFFFFF",
    color: "#0B1F2A",
    fontSize: "14px",
    outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "6px",
    color: "#0B1F2A",
  } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Display Name</label>
          <input style={inputStyle} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Slug</label>
          <input style={inputStyle} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Timezone</label>
          <select style={inputStyle} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            <option value="Asia/Beirut">Asia/Beirut</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="America/New_York">America/New_York</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}><Save className="h-4 w-4" /> Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function BookingForm({ item, onSave, onClose, services, staff }: { item: Booking | null; onSave: (b: Booking) => void; onClose: () => void; services: Service[]; staff: Staff[] }) {
  const [form, setForm] = useState<Booking>(item || {
    id: crypto.randomUUID(), org_id: ORG_ID, service_id: services[0]?.id || "", staff_id: staff[0]?.id || "",
    customer_id: "", reference: `MRD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 3600000).toISOString(),
    duration_minutes: 30, customer_timezone: "Asia/Beirut", staff_timezone: "Asia/Beirut",
    status: "confirmed" as any, meeting_method: "video" as any, meeting_url: null, meeting_phone: null,
    meeting_location: null, meeting_provider: null, meeting_ref: null, meeting_instructions: null,
    price_cents: 0, currency: "USD", access_token_hash: "", title: null, internal_notes: null,
    customer_note: null, source: "admin", rescheduled_from: null, cancelled_at: null, cancelled_by: null,
    cancellation_reason: null, completed_at: null, external_event_ids: {}, metadata: {},
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null,
  });

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid rgba(107,127,136,0.26)", borderRadius: "8px", background: "#FFFFFF", color: "#0B1F2A", fontSize: "14px", outline: "none" } as React.CSSProperties;
  const labelStyle = { display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px", color: "#0B1F2A" } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Service</label>
          <select style={inputStyle} value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Staff</label>
          <select style={inputStyle} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
            {staff.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Start</label>
          <input style={inputStyle} type="datetime-local" value={form.starts_at.slice(0, 16)} onChange={(e) => setForm({ ...form, starts_at: new Date(e.target.value).toISOString() })} />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>End</label>
          <input style={inputStyle} type="datetime-local" value={form.ends_at.slice(0, 16)} onChange={(e) => setForm({ ...form, ends_at: new Date(e.target.value).toISOString() })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Meeting Method</label>
          <select style={inputStyle} value={form.meeting_method} onChange={(e) => setForm({ ...form, meeting_method: e.target.value as any })}>
            <option value="video">Video</option>
            <option value="phone">Phone</option>
            <option value="audio">Audio</option>
            <option value="in_person">In Person</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}><Save className="h-4 w-4" /> Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function CustomerForm({ item, onSave, onClose }: { item: Customer | null; onSave: (c: Customer) => void; onClose: () => void }) {
  const [form, setForm] = useState<Customer>(item || {
    id: crypto.randomUUID(), org_id: ORG_ID, user_id: null, full_name: "", email: "", phone: "",
    company: "", timezone: "Asia/Beirut", notes: null, tags: [], total_bookings: 0,
    total_cancellations: 0, last_booking_at: null, is_blocked: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null,
  });

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid rgba(107,127,136,0.26)", borderRadius: "8px", background: "#FFFFFF", color: "#0B1F2A", fontSize: "14px", outline: "none" } as React.CSSProperties;
  const labelStyle = { display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px", color: "#0B1F2A" } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Full Name</label>
          <input style={inputStyle} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Company</label>
          <input style={inputStyle} value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}><Save className="h-4 w-4" /> Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function ScheduleForm({ item, onSave, onClose }: { item: (Schedule & { availability_rules: AvailabilityRule[] }) | null; onSave: (s: any) => void; onClose: () => void }) {
  const [form, setForm] = useState(item || {
    id: crypto.randomUUID(), org_id: ORG_ID, staff_id: "", name: "", timezone: "Asia/Beirut",
    is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), availability_rules: [],
  });

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid rgba(107,127,136,0.26)", borderRadius: "8px", background: "#FFFFFF", color: "#0B1F2A", fontSize: "14px", outline: "none" } as React.CSSProperties;
  const labelStyle = { display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px", color: "#0B1F2A" } as React.CSSProperties;

  const addRule = (weekday: number) => {
    const newRule: AvailabilityRule = { id: crypto.randomUUID(), schedule_id: form.id, weekday, start_time: "09:00", end_time: "17:00", created_at: new Date().toISOString() };
    setForm({ ...form, availability_rules: [...(form.availability_rules || []), newRule] });
  };

  const removeRule = (id: string) => {
    setForm({ ...form, availability_rules: form.availability_rules?.filter((r: AvailabilityRule) => r.id !== id) || [] });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>Timezone</label>
          <select style={inputStyle} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            <option value="Asia/Beirut">Asia/Beirut</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="America/New_York">America/New York</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Weekly Rules</p>
        <div className="space-y-2">
          {weekdayNames.map((day, idx) => {
            const rules = form.availability_rules?.filter((r: AvailabilityRule) => r.weekday === idx) || [];
            return (
              <div key={day} className="flex items-center gap-2 p-2 rounded-field border border-hairline">
                <span className="text-sm w-24">{day}</span>
                {rules.length === 0 ? <span className="text-xs text-mute">Closed</span> : (
                  <div className="flex-1 space-y-1">
                    {rules.map((r: AvailabilityRule) => (
                      <div key={r.id} className="flex items-center gap-2">
                        <input type="time" value={r.start_time} onChange={(e) => setForm({ ...form, availability_rules: form.availability_rules?.map((x: AvailabilityRule) => x.id === r.id ? { ...x, start_time: e.target.value } : x) || [] })} className="px-2 py-1 rounded-field border border-hairline text-sm" />
                        <span className="text-xs text-mute">to</span>
                        <input type="time" value={r.end_time} onChange={(e) => setForm({ ...form, availability_rules: form.availability_rules?.map((x: AvailabilityRule) => x.id === r.id ? { ...x, end_time: e.target.value } : x) || [] })} className="px-2 py-1 rounded-field border border-hairline text-sm" />
                        <button onClick={() => removeRule(r.id)} className="p-1 text-stop hover:text-stop"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => addRule(idx)}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}><Save className="h-4 w-4" /> Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
