"use client";

import { Bell, Search, Sun, Moon, UserCircle, Settings, LogOut, ChevronUp, X } from "lucide-react";
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
  city?: string | null;
  district?: string | null;
  quarter?: string | null;
  address?: string | null;
}

export function DashboardHeader() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<UserInfo>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        // API wraps response in { data: {...} }
        setUser(data?.data ?? data);
      })
      .catch(() => {});
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    router.push("/login");
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
          placeholder="Search..."
          className="pl-8 bg-muted/40 border-0 focus-visible:ring-1"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-6 w-6">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.first_name ?? user.username ?? ""} />}
              <AvatarFallback className="text-xs">
                {(user.first_name ?? user.username ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
                  onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                >
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  Edit profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Account settings
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
            <h2 className="text-lg font-semibold">Профайл мэдээлэл</h2>
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
              <Label className="text-xs text-muted-foreground">Нэр (First name)</Label>
              <Input readOnly value={user.first_name ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Овог (Last name)</Label>
              <Input readOnly value={user.last_name ?? ""} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Нэр дэвшилт (Informal)</Label>
              <Input readOnly value={user.informal ?? ""} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Имэйл (Email)</Label>
              <Input readOnly value={user.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Нэвтрэх нэр (Username)</Label>
              <Input readOnly value={user.username ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Утас (Phone)</Label>
              <Input readOnly value={user.phone ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Регистр (Register No)</Label>
              <Input readOnly value={user.register_no ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Topup ID</Label>
              <Input readOnly value={user.topup_id ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Хот (City)</Label>
              <Input readOnly value={user.city ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Дүүрэг (District)</Label>
              <Input readOnly value={user.district ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Хороо (Quarter)</Label>
              <Input readOnly value={user.quarter ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Хаяг (Address)</Label>
              <Input readOnly value={user.address ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Бүртгүүлсэн огноо</Label>
              <Input readOnly value={user.date_joined ? new Date(user.date_joined as string).toLocaleString() : ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Сүүлд нэвтэрсэн</Label>
              <Input readOnly value={user.last_login ? new Date(user.last_login as string).toLocaleString() : ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Идэвхтэй эсэх</Label>
              <Input readOnly value={user.is_active ? "Тийм" : "Үгүй"} />
            </div>
          </div>

          <div className="px-6 pb-5">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setProfileOpen(false)}
            >
              Хаах
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
