"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatTime, formatDate, formatCurrency } from "@/lib/utils";
import type { Service, Staff, Booking, Customer, Schedule, AvailabilityRule } from "@/lib/types";
import { Calendar, Clock, Users, Settings, LogOut, BarChart3, Globe, Plus, Edit, Trash2, Search, Filter, Download, Upload, Save, X, Check, ChevronLeft, ChevronRight, User, Phone, Video, MapPin, Mail, Building, FileText, Tag, AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff, Copy, ExternalLink, RefreshCw, MoreVertical, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity, Zap, Shield, Bell, Database, Server, HardDrive, Wifi, Monitor, Laptop, Smartphone, Tablet, Globe2, Navigation, Compass, Target, Award, Star, Heart, Bookmark, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, StatCard, EmptyState } from "@/components/ui/card";
import { Field, Textarea, Select } from "@/components/ui/input";

const AUTH_KEY = "meridian_admin_auth";

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

/* =====================================================================
   TYPES
   ===================================================================== */
interface AdminData {
  services: Service[];
  staff: Staff[];
  bookings: Booking[];
  customers: Customer[];
  schedules: Schedule[];
  availabilityRules: AvailabilityRule[];
  settings: {
    orgName: string;
    orgSlug: string;
    timezone: string;
    currency: string;
    locale: string;
  };
}

/* =====================================================================
   STORAGE
   ===================================================================== */
const STORAGE_KEY = "meridian_admin_data";

function loadData(): AdminData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultData();
}

function saveData(data: AdminData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function defaultData(): AdminData {
  return {
    services: [
      { id: "s1", org_id: "org1", category_id: null, slug: "it-consultation", name: "IT Consultation", description: "Scoping call for infrastructure, network or broadcast systems.", duration_minutes: 30, slot_interval_minutes: 15, price_cents: 2500, currency: "USD", meeting_methods: ["video", "phone"], default_method: "video", location: null, phone_number: null, custom_meeting_url: null, meeting_instructions: null, buffer_before_minutes: 0, buffer_after_minutes: 10, minimum_notice_minutes: 60, maximum_advance_days: 45, max_bookings_per_day: 6, requires_confirmation: false, allow_reschedule: true, allow_cancellation: true, cancellation_notice_hours: 24, capacity: 1, form_id: null, reminder_offsets_minutes: [1440, 120], color: "#0E7C7B", sort_order: 1, is_published: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
      { id: "s2", org_id: "org1", category_id: null, slug: "tech-support", name: "Technical Support", description: "Live troubleshooting with screen sharing.", duration_minutes: 60, slot_interval_minutes: 30, price_cents: 5000, currency: "USD", meeting_methods: ["video", "phone", "audio"], default_method: "video", location: null, phone_number: null, custom_meeting_url: null, meeting_instructions: null, buffer_before_minutes: 5, buffer_after_minutes: 15, minimum_notice_minutes: 120, maximum_advance_days: 30, max_bookings_per_day: 4, requires_confirmation: false, allow_reschedule: true, allow_cancellation: true, cancellation_notice_hours: 24, capacity: 1, form_id: null, reminder_offsets_minutes: [1440, 120], color: "#C08A2E", sort_order: 2, is_published: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
      { id: "s3", org_id: "org1", category_id: null, slug: "discovery", name: "Discovery Call", description: "Fifteen minutes to see whether we are a fit. No charge.", duration_minutes: 15, slot_interval_minutes: 15, price_cents: 0, currency: "USD", meeting_methods: ["video", "phone"], default_method: "video", location: null, phone_number: null, custom_meeting_url: null, meeting_instructions: null, buffer_before_minutes: 0, buffer_after_minutes: 5, minimum_notice_minutes: 30, maximum_advance_days: 21, max_bookings_per_day: 8, requires_confirmation: false, allow_reschedule: true, allow_cancellation: true, cancellation_notice_hours: 24, capacity: 1, form_id: null, reminder_offsets_minutes: [1440], color: "#1E7A4B", sort_order: 3, is_published: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
    ],
    staff: [
      { id: "st1", org_id: "org1", user_id: null, slug: "elie-khoury", display_name: "Elie Khoury", title: "Lead Systems Engineer", bio: null, avatar_url: null, email: "elie@meridian.com", phone: "+961 76 784 433", timezone: "Asia/Beirut", color: "#0E7C7B", is_bookable: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
      { id: "st2", org_id: "org1", user_id: null, slug: "rana-haddad", display_name: "Rana Haddad", title: "Network Specialist", bio: null, avatar_url: null, email: "rana@meridian.com", phone: "+961 76 784 434", timezone: "Asia/Beirut", color: "#C08A2E", is_bookable: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
      { id: "st3", org_id: "org1", user_id: null, slug: "marc-aoun", display_name: "Marc Aoun", title: "Support Engineer", bio: null, avatar_url: null, email: "marc@meridian.com", phone: "+961 76 784 435", timezone: "Europe/Paris", color: "#1E7A4B", is_bookable: true, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
    ],
    bookings: [],
    customers: [],
    schedules: [
      { id: "sch1", org_id: "org1", staff_id: "st1", name: "Elie - Standard", timezone: "Asia/Beirut", is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), availability_rules: [
        { id: "ar1", schedule_id: "sch1", weekday: 1, start_time: "09:00", end_time: "13:00", created_at: new Date().toISOString() },
        { id: "ar2", schedule_id: "sch1", weekday: 1, start_time: "14:00", end_time: "18:00", created_at: new Date().toISOString() },
        { id: "ar3", schedule_id: "sch1", weekday: 2, start_time: "09:00", end_time: "13:00", created_at: new Date().toISOString() },
        { id: "ar4", schedule_id: "sch1", weekday: 2, start_time: "14:00", end_time: "18:00", created_at: new Date().toISOString() },
        { id: "ar5", schedule_id: "sch1", weekday: 3, start_time: "09:00", end_time: "13:00", created_at: new Date().toISOString() },
        { id: "ar6", schedule_id: "sch1", weekday: 3, start_time: "14:00", end_time: "18:00", created_at: new Date().toISOString() },
        { id: "ar7", schedule_id: "sch1", weekday: 4, start_time: "09:00", end_time: "13:00", created_at: new Date().toISOString() },
        { id: "ar8", schedule_id: "sch1", weekday: 4, start_time: "14:00", end_time: "18:00", created_at: new Date().toISOString() },
        { id: "ar9", schedule_id: "sch1", weekday: 5, start_time: "09:00", end_time: "14:00", created_at: new Date().toISOString() },
      ]},
      { id: "sch2", org_id: "org1", staff_id: "st2", name: "Rana - Standard", timezone: "Asia/Beirut", is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), availability_rules: [
        { id: "ar10", schedule_id: "sch2", weekday: 1, start_time: "10:00", end_time: "17:00", created_at: new Date().toISOString() },
        { id: "ar11", schedule_id: "sch2", weekday: 2, start_time: "10:00", end_time: "17:00", created_at: new Date().toISOString() },
        { id: "ar12", schedule_id: "sch2", weekday: 3, start_time: "10:00", end_time: "17:00", created_at: new Date().toISOString() },
        { id: "ar13", schedule_id: "sch2", weekday: 4, start_time: "10:00", end_time: "17:00", created_at: new Date().toISOString() },
        { id: "ar14", schedule_id: "sch2", weekday: 6, start_time: "10:00", end_time: "13:00", created_at: new Date().toISOString() },
      ]},
      { id: "sch3", org_id: "org1", staff_id: "st3", name: "Marc - Standard", timezone: "Europe/Paris", is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), availability_rules: [
        { id: "ar15", schedule_id: "sch3", weekday: 1, start_time: "08:00", end_time: "16:00", created_at: new Date().toISOString() },
        { id: "ar16", schedule_id: "sch3", weekday: 2, start_time: "08:00", end_time: "16:00", created_at: new Date().toISOString() },
        { id: "ar17", schedule_id: "sch3", weekday: 3, start_time: "08:00", end_time: "16:00", created_at: new Date().toISOString() },
        { id: "ar18", schedule_id: "sch3", weekday: 4, start_time: "08:00", end_time: "16:00", created_at: new Date().toISOString() },
        { id: "ar19", schedule_id: "sch3", weekday: 5, start_time: "08:00", end_time: "12:00", created_at: new Date().toISOString() },
      ]},
    ],
    availabilityRules: [],
    settings: {
      orgName: "Meridian Demo Co.",
      orgSlug: "meridian-demo",
      timezone: "Asia/Beirut",
      currency: "USD",
      locale: "en",
    },
  };
}

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */
export default function AdminPortal() {
  const router = useRouter();
  const { authenticated, loading, logout } = useAuth();
  const [data, setData] = useState<AdminData>(defaultData());
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"service" | "staff" | "booking" | "customer" | "schedule" | "settings">("service");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (authenticated) {
      setData(loadData());
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) {
      saveData(data);
    }
  }, [data, authenticated]);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/admin/login");
    }
  }, [loading, authenticated, router]);

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
    return null; // Router will redirect
  }

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

  const saveItem = (item: any) => {
    setData((prev) => {
      const next = { ...prev };
      if (modalType === "service") {
        const idx = next.services.findIndex((s) => s.id === item.id);
        if (idx >= 0) next.services[idx] = item;
        else next.services.push(item);
      } else if (modalType === "staff") {
        const idx = next.staff.findIndex((s) => s.id === item.id);
        if (idx >= 0) next.staff[idx] = item;
        else next.staff.push(item);
      } else if (modalType === "booking") {
        const idx = next.bookings.findIndex((b) => b.id === item.id);
        if (idx >= 0) next.bookings[idx] = item;
        else next.bookings.push(item);
      } else if (modalType === "customer") {
        const idx = next.customers.findIndex((c) => c.id === item.id);
        if (idx >= 0) next.customers[idx] = item;
        else next.customers.push(item);
      } else if (modalType === "schedule") {
        const idx = next.schedules.findIndex((s) => s.id === item.id);
        if (idx >= 0) next.schedules[idx] = item;
        else next.schedules.push(item);
      } else if (modalType === "settings") {
        next.settings = item;
      }
      return next;
    });
    closeModal();
    showToast(`${modalType} saved successfully`);
  };

  const deleteItem = (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setData((prev) => {
      const next = { ...prev };
      if (type === "service") next.services = next.services.filter((s) => s.id !== id);
      else if (type === "staff") next.staff = next.staff.filter((s) => s.id !== id);
      else if (type === "booking") next.bookings = next.bookings.filter((b) => b.id !== id);
      else if (type === "customer") next.customers = next.customers.filter((c) => c.id !== id);
      else if (type === "schedule") next.schedules = next.schedules.filter((s) => s.id !== id);
      return next;
    });
    showToast(`${type} deleted`, "info");
  };

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
      {/* Sidebar */}
      <aside className={cn("border-r border-hairline bg-surface transition-all duration-200", sidebarOpen ? "w-64" : "w-16")}>
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          {sidebarOpen && <span className="font-display font-bold text-lg">Meridian Admin</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-hairline/50">
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-field text-sm transition-colors", currentPage === item.id ? "bg-teal-100 text-teal-600 font-medium" : "text-mute hover:text-ink hover:bg-hairline/50")}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-2 border-t border-hairline">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-field text-sm text-mute hover:text-stop hover:bg-stop/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold capitalize">{currentPage}</h1>
            <p className="text-sm text-mute">Manage your {currentPage}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-field border border-hairline bg-surface text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 w-64"
              />
            </div>
            {(currentPage === "services" || currentPage === "staff" || currentPage === "bookings" || currentPage === "customers") && (
              <Button size="sm" onClick={() => openModal(currentPage.slice(0, -1) as any)}>
                <Plus className="h-4 w-4" />
                Add {currentPage.slice(0, -1)}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {currentPage === "dashboard" && <DashboardPage data={data} />}
        {currentPage === "services" && <ServicesPage data={data} onEdit={(s) => openModal("service", s)} onDelete={(id) => deleteItem("service", id)} searchQuery={searchQuery} />}
        {currentPage === "staff" && <StaffPage data={data} onEdit={(s) => openModal("staff", s)} onDelete={(id) => deleteItem("staff", id)} searchQuery={searchQuery} />}
        {currentPage === "bookings" && <BookingsPage data={data} onEdit={(b) => openModal("booking", b)} onDelete={(id) => deleteItem("booking", id)} searchQuery={searchQuery} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />}
        {currentPage === "customers" && <CustomersPage data={data} onEdit={(c) => openModal("customer", c)} onDelete={(id) => deleteItem("customer", id)} searchQuery={searchQuery} />}
        {currentPage === "availability" && <AvailabilityPage data={data} onEdit={(s) => openModal("schedule", s)} onDelete={(id) => deleteItem("schedule", id)} />}
        {currentPage === "settings" && <SettingsPage data={data} onSave={(s) => saveItem(s)} />}
      </main>

      {/* Modal */}
      {showModal && (
        <Modal onClose={closeModal}>
          {modalType === "service" && <ServiceForm item={editingItem} onSave={saveItem} onClose={closeModal} />}
          {modalType === "staff" && <StaffForm item={editingItem} onSave={saveItem} onClose={closeModal} />}
          {modalType === "booking" && <BookingForm item={editingItem} onSave={saveItem} onClose={closeModal} data={data} />}
          {modalType === "customer" && <CustomerForm item={editingItem} onSave={saveItem} onClose={closeModal} />}
          {modalType === "schedule" && <ScheduleForm item={editingItem} onSave={saveItem} onClose={closeModal} />}
          {modalType === "settings" && <SettingsForm item={editingItem || data.settings} onSave={saveItem} onClose={closeModal} />}
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-field shadow-float text-sm font-medium z-50", toast.type === "success" ? "bg-ok text-white" : toast.type === "error" ? "bg-stop text-white" : "bg-ink text-paper")}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   DASHBOARD PAGE
   ===================================================================== */
function DashboardPage({ data }: { data: AdminData }) {
  const totalBookings = data.bookings.length;
  const confirmedBookings = data.bookings.filter((b) => b.status === "confirmed").length;
  const pendingBookings = data.bookings.filter((b) => b.status === "pending").length;
  const cancelledBookings = data.bookings.filter((b) => b.status === "cancelled").length;
  const totalRevenue = data.bookings.filter((b) => b.status === "confirmed" || b.status === "completed").reduce((sum, b) => sum + b.price_cents, 0);
  const totalCustomers = data.customers.length;
  const totalServices = data.services.length;
  const totalStaff = data.staff.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={totalBookings} icon={<Calendar className="h-4 w-4" />} />
        <StatCard label="Confirmed" value={confirmedBookings} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Pending" value={pendingBookings} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Cancelled" value={cancelledBookings} icon={<XCircle className="h-4 w-4" />} />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue, data.settings.currency)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Customers" value={totalCustomers} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Services" value={totalServices} icon={<Zap className="h-4 w-4" />} />
        <StatCard label="Staff" value={totalStaff} icon={<User className="h-4 w-4" />} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-semibold mb-4">Recent Bookings</h3>
          {data.bookings.length === 0 ? (
            <EmptyState title="No bookings yet" description="Bookings will appear here once customers start scheduling." />
          ) : (
            <div className="space-y-3">
              {data.bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
                  <div>
                    <p className="font-medium text-sm">{b.customer_name || "Unknown"}</p>
                    <p className="text-xs text-mute">{b.service_name || "Unknown service"}</p>
                  </div>
                  <Badge variant={b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending"}>
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-display font-semibold mb-4">Services</h3>
          {data.services.length === 0 ? (
            <EmptyState title="No services yet" description="Create your first service to start accepting bookings." />
          ) : (
            <div className="space-y-3">
              {data.services.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-mute">{s.duration_minutes} min · {formatCurrency(s.price_cents, s.currency)}</p>
                  </div>
                  <Badge variant={s.is_published ? "confirmed" : "pending"}>
                    {s.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* =====================================================================
   SERVICES PAGE
   ===================================================================== */
function ServicesPage({ data, onEdit, onDelete, searchQuery }: { data: AdminData; onEdit: (s: Service) => void; onDelete: (id: string) => void; searchQuery: string }) {
  const filtered = data.services.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <EmptyState title="No services found" description="Try adjusting your search or create a new service." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold">{s.name}</h3>
                  {s.description && <p className="text-sm text-mute mt-1 line-clamp-2">{s.description}</p>}
                </div>
                <Badge variant={s.is_published ? "confirmed" : "pending"}>
                  {s.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-mute mb-3">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration_minutes} min</span>
                <span className="tabular font-medium text-brass">{formatCurrency(s.price_cents, s.currency)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(s)}>
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-stop hover:text-stop" onClick={() => onDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   STAFF PAGE
   ===================================================================== */
function StaffPage({ data, onEdit, onDelete, searchQuery }: { data: AdminData; onEdit: (s: Staff) => void; onDelete: (id: string) => void; searchQuery: string }) {
  const filtered = data.staff.filter((s) => s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <EmptyState title="No staff found" description="Try adjusting your search or add a new staff member." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} hover>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: s.color || "#0E7C7B" }}>
                  {s.display_name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-display font-semibold">{s.display_name}</h3>
                  {s.title && <p className="text-xs text-mute">{s.title}</p>}
                </div>
              </div>
              <div className="space-y-1 text-xs text-mute mb-3">
                {s.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</p>}
                {s.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</p>}
                <p className="flex items-center gap-1"><Globe className="h-3 w-3" />{s.timezone}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(s)}>
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-stop hover:text-stop" onClick={() => onDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   BOOKINGS PAGE
   ===================================================================== */
function BookingsPage({ data, onEdit, onDelete, searchQuery, filterStatus, setFilterStatus }: { data: AdminData; onEdit: (b: Booking) => void; onDelete: (id: string) => void; searchQuery: string; filterStatus: string; setFilterStatus: (s: string) => void }) {
  const filtered = data.bookings.filter((b) => {
    const matchesSearch = b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || b.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) || b.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {["all", "confirmed", "pending", "cancelled", "completed", "no_show"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-colors", filterStatus === status ? "bg-teal text-white" : "bg-hairline/20 text-mute hover:bg-hairline/40")}
          >
            {status.replace("_", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No bookings found" description="Try adjusting your search or filters." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-hairline last:border-0">
                    <td className="py-3 px-4 text-sm tabular">{b.reference}</td>
                    <td className="py-3 px-4 text-sm">{b.customer_name}</td>
                    <td className="py-3 px-4 text-sm">{b.service_name}</td>
                    <td className="py-3 px-4 text-sm tabular">{formatDate(b.starts_at, b.customer_timezone)} {formatTime(b.starts_at, b.customer_timezone)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending"}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm tabular">{formatCurrency(b.price_cents, b.currency)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(b)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-stop hover:text-stop" onClick={() => onDelete(b.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* =====================================================================
   CUSTOMERS PAGE
   ===================================================================== */
function CustomersPage({ data, onEdit, onDelete, searchQuery }: { data: AdminData; onEdit: (c: Customer) => void; onDelete: (id: string) => void; searchQuery: string }) {
  const filtered = data.customers.filter((c) => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <EmptyState title="No customers found" description="Try adjusting your search or add a new customer." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Bookings</th>
                  <th>Last Booking</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-hairline last:border-0">
                    <td className="py-3 px-4 text-sm font-medium">{c.full_name}</td>
                    <td className="py-3 px-4 text-sm text-mute">{c.email}</td>
                    <td className="py-3 px-4 text-sm text-mute">{c.phone || "-"}</td>
                    <td className="py-3 px-4 text-sm tabular">{c.total_bookings}</td>
                    <td className="py-3 px-4 text-sm tabular">{c.last_booking_at ? formatDate(c.last_booking_at, c.timezone || "UTC") : "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-stop hover:text-stop" onClick={() => onDelete(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* =====================================================================
   AVAILABILITY PAGE
   ===================================================================== */
function AvailabilityPage({ data, onEdit, onDelete }: { data: AdminData; onEdit: (s: Schedule) => void; onDelete: (id: string) => void }) {
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-6">
      {data.schedules.map((schedule) => {
        const staff = data.staff.find((s) => s.id === schedule.staff_id);
        return (
          <Card key={schedule.id}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: staff?.color || "#0E7C7B" }}>
                  {staff?.display_name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-display font-semibold">{schedule.name}</h3>
                  <p className="text-xs text-mute">{staff?.display_name} · {schedule.timezone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(schedule)}>
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-stop hover:text-stop" onClick={() => onDelete(schedule.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekdayNames.map((day, idx) => {
                const rules = schedule.availability_rules?.filter((r) => r.weekday === idx) || [];
                return (
                  <div key={day} className="p-3 rounded-field border border-hairline bg-paper/50">
                    <p className="text-xs font-medium text-mute mb-2">{day}</p>
                    {rules.length === 0 ? (
                      <p className="text-xs text-mute">Closed</p>
                    ) : (
                      <div className="space-y-1">
                        {rules.map((r) => (
                          <p key={r.id} className="text-xs tabular">{r.start_time} - {r.end_time}</p>
                        ))}
                      </div>
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

/* =====================================================================
   SETTINGS PAGE
   ===================================================================== */
function SettingsPage({ data, onSave }: { data: AdminData; onSave: (s: any) => void }) {
  const [form, setForm] = useState(data.settings);

  return (
    <div className="max-w-2xl">
      <Card>
        <h3 className="font-display font-semibold mb-4">Organization Settings</h3>
        <div className="space-y-4">
          <Field label="Organization Name" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
          <Field label="Slug" value={form.orgSlug} onChange={(e) => setForm({ ...form, orgSlug: e.target.value })} />
          <Select label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} options={[
            { value: "Asia/Beirut", label: "Asia/Beirut" },
            { value: "Europe/London", label: "Europe/London" },
            { value: "Europe/Paris", label: "Europe/Paris" },
            { value: "America/New_York", label: "America/New_York" },
            { value: "UTC", label: "UTC" },
          ]} />
          <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} options={[
            { value: "USD", label: "USD" },
            { value: "EUR", label: "EUR" },
            { value: "GBP", label: "GBP" },
            { value: "LBP", label: "LBP" },
          ]} />
          <Select label="Locale" value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} options={[
            { value: "en", label: "English" },
            { value: "fr", label: "French" },
            { value: "ar", label: "Arabic" },
          ]} />
          <Button onClick={() => onSave(form)}>
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* =====================================================================
   MODAL
   ===================================================================== */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-sheet shadow-float max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-hairline px-6 py-4 flex items-center justify-between rounded-t-sheet">
          <h2 className="font-display font-semibold text-lg">Edit</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-hairline/50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* =====================================================================
   FORMS
   ===================================================================== */
function ServiceForm({ item, onSave, onClose }: { item: Service | null; onSave: (s: Service) => void; onClose: () => void }) {
  const [form, setForm] = useState(item || {
    id: `s${Date.now()}`,
    org_id: "org1",
    category_id: null,
    slug: "",
    name: "",
    description: "",
    duration_minutes: 30,
    slot_interval_minutes: 15,
    price_cents: 0,
    currency: "USD",
    meeting_methods: ["video"] as any[],
    default_method: "video" as any,
    location: null,
    phone_number: null,
    custom_meeting_url: null,
    meeting_instructions: null,
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
    minimum_notice_minutes: 60,
    maximum_advance_days: 60,
    max_bookings_per_day: null,
    requires_confirmation: false,
    allow_reschedule: true,
    allow_cancellation: true,
    cancellation_notice_hours: 24,
    capacity: 1,
    form_id: null,
    reminder_offsets_minutes: [1440, 120],
    color: "#0E7C7B",
    sort_order: 0,
    is_published: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Field label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
      </div>
      <Textarea label="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="grid grid-cols-3 gap-4">
        <Field label="Duration (min)" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
        <Field label="Price (cents)" type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })} />
        <Field label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Buffer Before (min)" type="number" value={form.buffer_before_minutes} onChange={(e) => setForm({ ...form, buffer_before_minutes: Number(e.target.value) })} />
        <Field label="Buffer After (min)" type="number" value={form.buffer_after_minutes} onChange={(e) => setForm({ ...form, buffer_after_minutes: Number(e.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Notice (min)" type="number" value={form.minimum_notice_minutes} onChange={(e) => setForm({ ...form, minimum_notice_minutes: Number(e.target.value) })} />
        <Field label="Max Advance (days)" type="number" value={form.maximum_advance_days} onChange={(e) => setForm({ ...form, maximum_advance_days: Number(e.target.value) })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}>
          <Save className="h-4 w-4" /> Save
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function StaffForm({ item, onSave, onClose }: { item: Staff | null; onSave: (s: Staff) => void; onClose: () => void }) {
  const [form, setForm] = useState(item || {
    id: `st${Date.now()}`,
    org_id: "org1",
    user_id: null,
    slug: "",
    display_name: "",
    title: "",
    bio: null,
    avatar_url: null,
    email: "",
    phone: "",
    timezone: "Asia/Beirut",
    color: "#0E7C7B",
    is_bookable: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Display Name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required />
        <Field label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Field label="Email" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} options={[
          { value: "Asia/Beirut", label: "Asia/Beirut" },
          { value: "Europe/London", label: "Europe/London" },
          { value: "Europe/Paris", label: "Europe/Paris" },
          { value: "America/New_York", label: "America/New_York" },
          { value: "UTC", label: "UTC" },
        ]} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}>
          <Save className="h-4 w-4" /> Save
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function BookingForm({ item, onSave, onClose, data }: { item: Booking | null; onSave: (b: Booking) => void; onClose: () => void; data: AdminData }) {
  const [form, setForm] = useState(item || {
    id: `b${Date.now()}`,
    org_id: "org1",
    service_id: data.services[0]?.id || "",
    staff_id: data.staff[0]?.id || "",
    customer_id: data.customers[0]?.id || "",
    reference: `MRD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 3600000).toISOString(),
    duration_minutes: 30,
    customer_timezone: "Asia/Beirut",
    staff_timezone: "Asia/Beirut",
    status: "confirmed" as any,
    meeting_method: "video" as any,
    meeting_url: null,
    meeting_phone: null,
    meeting_location: null,
    meeting_provider: null,
    meeting_ref: null,
    meeting_instructions: null,
    price_cents: 0,
    currency: "USD",
    access_token_hash: "",
    title: null,
    internal_notes: null,
    customer_note: null,
    source: "admin",
    rescheduled_from: null,
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    completed_at: null,
    external_event_ids: {},
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label="Service" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} options={data.services.map((s) => ({ value: s.id, label: s.name }))} />
        <Select label="Staff" value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} options={data.staff.map((s) => ({ value: s.id, label: s.display_name }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start" type="datetime-local" value={form.starts_at.slice(0, 16)} onChange={(e) => setForm({ ...form, starts_at: new Date(e.target.value).toISOString() })} />
        <Field label="End" type="datetime-local" value={form.ends_at.slice(0, 16)} onChange={(e) => setForm({ ...form, ends_at: new Date(e.target.value).toISOString() })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} options={[
          { value: "pending", label: "Pending" },
          { value: "confirmed", label: "Confirmed" },
          { value: "cancelled", label: "Cancelled" },
          { value: "completed", label: "Completed" },
          { value: "no_show", label: "No Show" },
        ]} />
        <Select label="Meeting Method" value={form.meeting_method} onChange={(e) => setForm({ ...form, meeting_method: e.target.value as any })} options={[
          { value: "video", label: "Video" },
          { value: "phone", label: "Phone" },
          { value: "audio", label: "Audio" },
          { value: "in_person", label: "In Person" },
        ]} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}>
          <Save className="h-4 w-4" /> Save
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function CustomerForm({ item, onSave, onClose }: { item: Customer | null; onSave: (c: Customer) => void; onClose: () => void }) {
  const [form, setForm] = useState(item || {
    id: `c${Date.now()}`,
    org_id: "org1",
    user_id: null,
    full_name: "",
    email: "",
    phone: "",
    company: "",
    timezone: "Asia/Beirut",
    notes: null,
    tags: [],
    total_bookings: 0,
    total_cancellations: 0,
    last_booking_at: null,
    is_blocked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="Company" value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}>
          <Save className="h-4 w-4" /> Save
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function ScheduleForm({ item, onSave, onClose }: { item: Schedule | null; onSave: (s: Schedule) => void; onClose: () => void }) {
  const [form, setForm] = useState<Schedule>(item || {
    id: `sch${Date.now()}`,
    org_id: "org1",
    staff_id: "",
    name: "",
    timezone: "Asia/Beirut",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_rules: [],
  });

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const addRule = (weekday: number) => {
    const newRule: AvailabilityRule = {
      id: `ar${Date.now()}`,
      schedule_id: form.id,
      weekday,
      start_time: "09:00",
      end_time: "17:00",
      created_at: new Date().toISOString(),
    };
    setForm({ ...form, availability_rules: [...(form.availability_rules || []), newRule] });
  };

  const removeRule = (id: string) => {
    setForm({ ...form, availability_rules: form.availability_rules?.filter((r: AvailabilityRule) => r.id !== id) || [] });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Select label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} options={[
          { value: "Asia/Beirut", label: "Asia/Beirut" },
          { value: "Europe/London", label: "Europe/London" },
          { value: "Europe/Paris", label: "Europe/Paris" },
          { value: "America/New_York", label: "America/New_York" },
          { value: "UTC", label: "UTC" },
        ]} />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Weekly Rules</p>
        <div className="space-y-2">
          {weekdayNames.map((day, idx) => {
            const rules = form.availability_rules?.filter((r: AvailabilityRule) => r.weekday === idx) || [];
            return (
              <div key={day} className="flex items-center gap-2 p-2 rounded-field border border-hairline">
                <span className="text-sm w-24">{day}</span>
                {rules.length === 0 ? (
                  <span className="text-xs text-mute">Closed</span>
                ) : (
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
                <Button variant="ghost" size="sm" onClick={() => addRule(idx)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}>
          <Save className="h-4 w-4" /> Save
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function SettingsForm({ item, onSave, onClose }: { item: any; onSave: (s: any) => void; onClose: () => void }) {
  const [form, setForm] = useState(item);

  return (
    <div className="space-y-4">
      <Field label="Organization Name" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
      <Field label="Slug" value={form.orgSlug} onChange={(e) => setForm({ ...form, orgSlug: e.target.value })} />
      <Select label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} options={[
        { value: "Asia/Beirut", label: "Asia/Beirut" },
        { value: "Europe/London", label: "Europe/London" },
        { value: "Europe/Paris", label: "Europe/Paris" },
        { value: "America/New_York", label: "America/New_York" },
        { value: "UTC", label: "UTC" },
      ]} />
      <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} options={[
        { value: "USD", label: "USD" },
        { value: "EUR", label: "EUR" },
        { value: "GBP", label: "GBP" },
        { value: "LBP", label: "LBP" },
      ]} />
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}>
          <Save className="h-4 w-4" /> Save
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
