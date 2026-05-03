"use client";

import { Bell, Search, Sun, Moon, UserCircle, Settings, LogOut, ChevronUp, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  informal?: string;
  register_no?: string;
  date_joined?: string;
  last_login?: string;
  is_active?: boolean;
  avatar?: string | null;
  topup_id?: string;
  city?: { key: number; value: string } | string | null;
  district?: { key: number; value: string } | string | null;
  quarter?: { key: number; value: string } | string | null;
  address?: string | null;
}

export function DashboardHeader() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<UserInfo>({});
  const [profileFields, setProfileFields] = useState({ first_name: "", last_name: "", phone: "", email: "" });
  const [addressFields, setAddressFields] = useState({ city: "", district: "", quarter: "", address: "" });
  const [addressLabels, setAddressLabels] = useState({ city: "", district: "", quarter: "" });
  type KV = { key: number; value: string };
  const [cities, setCities] = useState<KV[]>([]);
  const [districts, setDistricts] = useState<KV[]>([]);
  const [quarters, setQuarters] = useState<KV[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function toKV(data: unknown): KV[] {
    const arr = Array.isArray(data) ? data
      : Array.isArray((data as any)?.data) ? (data as any).data
      : Array.isArray((data as any)?.results) ? (data as any).results
      : [];
    return arr.map((i: any) => ({ key: Number(i.id ?? i.key ?? 0), value: String(i.name ?? i.value ?? "") })).filter((i: KV) => i.key > 0);
  }

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        // API wraps response in { data: {...} }
        const u = data?.data ?? data;
        setUser(u);
        setProfileFields({
          first_name: u.first_name ?? "",
          last_name:  u.last_name  ?? "",
          phone:      u.phone      ?? "",
          email:      u.email      ?? "",
        });
        setAddressFields({
          city:     String((u.city     && typeof u.city     === "object" ? (u.city     as {key:number}).key : u.city)     ?? ""),
          district: String((u.district && typeof u.district === "object" ? (u.district as {key:number}).key : u.district) ?? ""),
          quarter:  String((u.quarter  && typeof u.quarter  === "object" ? (u.quarter  as {key:number}).key : u.quarter)  ?? ""),
          address:  u.address  ?? "",
        });
        setAddressLabels({
          city:     (u.city     && typeof u.city     === "object" ? (u.city     as {value:string}).value : String(u.city     ?? "")),
          district: (u.district && typeof u.district === "object" ? (u.district as {value:string}).value : String(u.district ?? "")),
          quarter:  (u.quarter  && typeof u.quarter  === "object" ? (u.quarter  as {value:string}).value : String(u.quarter  ?? "")),
        });
      })
      .catch(() => {});
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    router.push("/login");
  }

  function openProfile() {
    setMenuOpen(false);
    setProfileOpen(true);
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch("/api/v1/city", { headers: h }).then((r) => r.json()).then((d) => setCities(toKV(d))).catch(() => {});
    fetch("/api/v1/district", { headers: h }).then((r) => r.json()).then((d) => setDistricts(toKV(d))).catch(() => {});
    fetch("/api/v1/quarter", { headers: h }).then((r) => r.json()).then((d) => setQuarters(toKV(d))).catch(() => {});
  }

  async function handleSave() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const { email, ...profileRest } = profileFields;
      const [profileRes, addressRes, emailRes] = await Promise.all([
        fetch("/api/v1/user/profile", {
          method: "PATCH",
          headers,
          body: JSON.stringify(profileRest),
        }),
        fetch("/api/v1/user/address", {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            city:     addressFields.city     ? Number(addressFields.city)     : undefined,
            district: addressFields.district ? Number(addressFields.district) : undefined,
            quarter:  addressFields.quarter  ? Number(addressFields.quarter)  : undefined,
            address:  addressFields.address,
          }),
        }),
        fetch("/api/v1/user/email", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ email }),
        }),
      ]);

      if (!profileRes.ok || !addressRes.ok || !emailRes.ok) {
        const profileErr = !profileRes.ok ? await profileRes.json().catch(() => ({})) : null;
        const addressErr = !addressRes.ok ? await addressRes.json().catch(() => ({})) : null;
        const emailErr   = !emailRes.ok   ? await emailRes.json().catch(() => ({}))   : null;
        if (profileErr) console.error("[profile PATCH error]", profileRes.status, profileErr);
        if (addressErr) console.error("[address PATCH error]", addressRes.status, addressErr);
        if (emailErr)   console.error("[email PATCH error]",   emailRes.status,   emailErr);
        const err = profileErr ?? addressErr ?? emailErr ?? {};
        setSaveError(err?.error ?? err?.detail ?? JSON.stringify(err) ?? "Хадгалахад алдаа гарлаа");
      } else {
        setUser((u) => ({ ...u, ...profileFields, ...addressFields }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Хайх..."
          className="pl-8 bg-muted/40 border-0 focus-visible:ring-1"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {/* <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button> */}

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-muted/50 transition-colors"
          >
            {/* <Avatar className="h-6 w-6">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.first_name ?? user.username ?? ""} />}
              <AvatarFallback className="text-xs">
                {(user.first_name ?? user.username ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar> */}
            <span className="text-sm font-medium hidden sm:block">
              {user.first_name ?? user.username ?? "..."}
            </span>
            <ChevronUp
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                menuOpen ? "" : "rotate-180"
              }`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-popover shadow-lg z-50 py-1 text-sm">
              {/* User info */}
              <div className="px-4 py-3 border-b">
                <p className="font-semibold">{user.first_name ?? user.username ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email ?? ""}</p>
              </div>

              <div className="py-1">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors"
                  onClick={openProfile}
                >
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  Борлуулагчийн мэдээлэл засах
                </button>
               
              </div>

              <div className="border-t py-1">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors text-red-500">
                  <LogOut className="h-4 w-4" />
                  Гарах
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* ── Edit Profile Modal ─────────────────────────────────────────── */}
    {profileOpen && (
      <div
        className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
        onClick={() => setProfileOpen(false)}
      >
        <div
          className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Борлуулагчийн мэдээлэл засах</h2>
            <button
              onClick={() => setProfileOpen(false)}
              className="rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Fields */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Нэр</Label>
              <Input value={profileFields.first_name} onChange={(e) => setProfileFields((f) => ({ ...f, first_name: e.target.value }))} placeholder="Нэр" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Овог</Label>
              <Input value={profileFields.last_name} onChange={(e) => setProfileFields((f) => ({ ...f, last_name: e.target.value }))} placeholder="Овог" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Байгууллага</Label>
              <Input readOnly value={user.informal ?? ""} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Имэйл</Label>
              <Input value={profileFields.email} onChange={(e) => setProfileFields((f) => ({ ...f, email: e.target.value }))} placeholder="Имэйл хаяг" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Нэвтрэх нэр</Label>
              <Input readOnly value={user.username ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Утас</Label>
              <Input value={profileFields.phone} onChange={(e) => setProfileFields((f) => ({ ...f, phone: e.target.value }))} placeholder="Утасны дугаар" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Регистр</Label>
              <Input readOnly value={user.register_no ?? ""} />
            </div>
            {/* <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Topup ID</Label>
              <Input readOnly value={user.topup_id ?? ""} />
            </div> */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Хот</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={addressFields.city}
                onChange={(e) => {
                  const val = e.target.value;
                  const label = cities.find((c) => String(c.key) === val)?.value ?? "";
                  setAddressFields((f) => ({ ...f, city: val, district: "", quarter: "" }));
                  setAddressLabels((l) => ({ ...l, city: label, district: "", quarter: "" }));
                }}
              >
                <option value="">Хот сонгон уу...</option>
                {cities.map((c) => <option key={c.key} value={String(c.key)}>{c.value}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Дүүрэг</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={addressFields.district}
                onChange={(e) => {
                  const val = e.target.value;
                  const label = districts.find((d) => String(d.key) === val)?.value ?? "";
                  setAddressFields((f) => ({ ...f, district: val, quarter: "" }));
                  setAddressLabels((l) => ({ ...l, district: label, quarter: "" }));
                }}
              >
                <option value="">Дүүрэг сонгон уу...</option>
                {districts.map((d) => <option key={d.key} value={String(d.key)}>{d.value}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Хороо</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={addressFields.quarter}
                onChange={(e) => {
                  const val = e.target.value;
                  const label = quarters.find((q) => String(q.key) === val)?.value ?? "";
                  setAddressFields((f) => ({ ...f, quarter: val }));
                  setAddressLabels((l) => ({ ...l, quarter: label }));
                }}
              >
                <option value="">Хороо сонгон уу...</option>
                {quarters.map((q) => <option key={q.key} value={String(q.key)}>{q.value}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Хаяг</Label>
              <Input value={addressFields.address} onChange={(e) => setAddressFields((f) => ({ ...f, address: e.target.value }))} placeholder="Хаяг" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Бүртгүүлсэн огноо</Label>
              <Input readOnly value={user.date_joined ? new Date(user.date_joined as string).toLocaleString() : ""} />
            </div>
           
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Идэвхтэй эсэх</Label>
              <Input readOnly value={user.is_active ? "Тийм" : "Үгүй"} />
            </div>
          </div>

          <div className="px-6 pb-5 space-y-3">
            {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            {saveSuccess && <p className="text-sm text-emerald-600">Амжилттай хадгаллаа</p>}
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Хадгалах
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setProfileOpen(false)}>
                Хаах
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
