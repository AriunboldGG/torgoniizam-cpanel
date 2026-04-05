"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

import { Search, Loader2, Trash2, Pencil } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import LotDetailModal from "@/components/lot-detail-modal";
import EditLotModal from "@/components/edit-lot-modal";

// Flexible type — all fields from the API are preserved

type Lot = Record<string, unknown>;

// ── Field accessor helpers ────────────────────────────────────────────────────

function getField(lot: Lot, ...keys: string[]): unknown {
  for (const key of keys) {
    if (lot[key] !== undefined && lot[key] !== null) return lot[key];
  }

  return undefined;
}

function getString(lot: Lot, ...keys: string[]): string {
  const v = getField(lot, ...keys);

  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

function getNumber(lot: Lot, ...keys: string[]): number {
  const v = getField(lot, ...keys);

  return typeof v === "number"
    ? v
    : typeof v === "string"
      ? parseFloat(v) || 0
      : 0;
}

function getImages(lot: Lot): string[] {
  const v = getField(lot, "images", "photos", "image_urls", "media");

  if (Array.isArray(v)) {
    return v

      .map((i) =>
        typeof i === "string"
          ? i
          : typeof i === "object" && i !== null
            ? ((i as Record<string, string>).url ??
              (i as Record<string, string>).image ??
              "")
            : "",
      )

      .filter(Boolean);
  }

  const single = getString(lot, "image", "image_url", "thumbnail", "photo");

  return single ? [single] : [];
}

function getStatus(lot: Lot): string {
  const raw = getField(lot, "status", "state", "lot_status", "lot_state", "auction_status");
  if (raw && typeof raw === "object") {
    const key = (raw as Record<string, unknown>).key;
    if (key !== undefined) return String(key).toLowerCase();
  }
  if (typeof raw === "string") return raw.toLowerCase();
  if (lot.is_active === true) return "active";
  return "";
}

function getId(lot: Lot): string {
  return getString(lot, "id", "lot_id", "uuid", "pk");
}

function getName(lot: Lot): string {
  return getString(lot, "name", "title", "lot_name", "product_name");
}

function getCategory(lot: Lot): string {
  const raw = getField(lot, "category", "lot_type", "type");

  if (typeof raw === "string") return raw;

  if (typeof raw === "object" && raw !== null)
    return getString(raw as Lot, "name", "title", "label");

  return "";
}

function getSubCategory(lot: Lot): string {
  const raw = getField(lot, "subcategory", "sub_category", "child_category", "subtype");
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null)
    return getString(raw as Lot, "name", "title", "label");
  return "";
}

// Render any value as a readable string for the "all fields" table

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return "—";

  if (typeof val === "boolean") return val ? "true" : "false";

  if (typeof val === "string" || typeof val === "number") return String(val);

  return JSON.stringify(val, null, 2);
}

// ── Status badge style ────────────────────────────────────────────────────────

function getStatusLabel(lot: Lot): string {
  const raw = getField(lot, "status", "state", "lot_status", "lot_state", "auction_status");
  if (raw && typeof raw === "object") {
    const val = (raw as Record<string, unknown>).value;
    if (val !== undefined) return String(val);
  }
  return getStatus(lot);
}

function statusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case "active":   return { bg: "bg-emerald-500", text: "text-white" };
    case "ended":    return { bg: "bg-blue-600",    text: "text-white" };
    case "pending":  return { bg: "bg-yellow-400",  text: "text-black" };
    case "rejected": return { bg: "bg-red-500",     text: "text-white" };
    default:         return { bg: "bg-gray-400",    text: "text-white" };
  }
}

function formatMNT(n: number) {
  return "MNT " + n.toLocaleString("mn-MN");
}

// ── Normalise API list response to an array ───────────────────────────────────

function toArray(data: unknown): Lot[] {
  if (Array.isArray(data)) return data as Lot[];

  if (data && typeof data === "object") {
    for (const key of ["results", "data", "lots", "items", "list"]) {
      const v = (data as Record<string, unknown>)[key];

      if (Array.isArray(v)) return v as Lot[];
    }
  }

  return [];
}

export default function ProductListPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<{ key: number; value: string }[]>([]);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setFetchError("Нэвтрэх шаардлагатай.");
      setLoading(false);
      return;
    }

    // Fetch lots and categories in parallel
    Promise.all([
      fetch("/api/lots", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([lotsData, catsData]) => {
        if (lotsData?.error) { setFetchError(lotsData.error); return; }
        const lotArr = toArray(lotsData);
        if (lotArr.length > 0) console.log("[lot sample]", lotArr[0]);
        setLots(lotArr);

        const isNum = (v: unknown) => typeof v === "number" || (typeof v === "string" && /^\d+$/.test(String(v)));
        const rawCats: Record<string, unknown>[] = Array.isArray(catsData) ? catsData
          : Array.isArray(catsData?.data) ? catsData.data
          : Array.isArray(catsData?.results) ? catsData.results
          : [];
        const catList = rawCats.map((item) => {
          if (item.id !== undefined && isNum(item.id))
            return { key: Number(item.id), value: String(item.name ?? item.value ?? "") };
          if (item.key !== undefined && item.value !== undefined) {
            if (isNum(item.key)) return { key: Number(item.key), value: String(item.value) };
            return { key: Number(item.value), value: String(item.key) };
          }
          return { key: 0, value: "" };
        }).filter((c) => c.key > 0 && c.value);
        setCategories(catList);
      })
      .catch(() => setFetchError("Сервертэй холбогдоход алдаа гарлаа."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = lots.filter((lot) => {
    const name = getName(lot).toLowerCase();
    const id = getId(lot).toLowerCase();
    const desc = getString(lot, "description", "body", "details").toLowerCase();

    const matchSearch =
      search === "" ||
      name.includes(search.toLowerCase()) ||
      id.includes(search.toLowerCase()) ||
      desc.includes(search.toLowerCase());

    const lotStatus = getStatus(lot);
    const matchStatus = statusFilter === "all" || lotStatus === statusFilter;

    const lotCatRaw = getField(lot, "category", "lot_type", "type");
    const lotCatObj = typeof lotCatRaw === "object" && lotCatRaw !== null
      ? (lotCatRaw as Record<string, unknown>)
      : null;
    const lotCatId = lotCatObj
      ? String(lotCatObj.id ?? lotCatObj.key ?? lotCatObj.pk ?? "")
      : String(lotCatRaw ?? "");
    const lotCatName = lotCatObj
      ? String(lotCatObj.name ?? lotCatObj.title ?? lotCatObj.value ?? "").toLowerCase()
      : String(lotCatRaw ?? "").toLowerCase();
    const selectedCatName = categories.find((c) => String(c.key) === categoryFilter)?.value?.toLowerCase() ?? "";
    const matchCategory =
      categoryFilter === "all" ||
      lotCatId === categoryFilter ||
      (selectedCatName !== "" && lotCatName === selectedCatName);

    return matchSearch && matchStatus && matchCategory;
  });

  function openModal(lot: Lot) {
    setSelectedLot(lot);
  }

  function closeModal() {
    setSelectedLot(null);
  }

  async function handleDelete(lotId: string) {
    if (!confirm("Энэ бүтээгдэхүүнийг устгах уу?")) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setDeletingId(lotId);
    try {
      const res = await fetch(`/api/v1/lot/delete/${lotId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setLots((prev) => prev.filter((l) => getId(l) !== lotId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.msg ?? data?.error ?? "Устгахад алдаа гарлаа.");
      }
    } catch {
      alert("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Product List</h1>

      {/* Category Filter Tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            Бүгд
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(String(cat.key))}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                categoryFilter === String(cat.key)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {cat.value}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1.5">Search Products</p>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

                <Input
                  placeholder="Search by name, ID..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1.5">Status</p>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v ?? "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>

                  {Array.from(
                    new Set(lots.map((l) => getStatus(l)).filter(Boolean)),
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {getStatusLabel(lots.find((l) => getStatus(l) === s)!)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span>Мэдээлэл ачааллаж байна...</span>
        </div>
      )}

      {/* Error */}

      {!loading && fetchError && (
        <div className="text-center py-16 text-red-500 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
          {fetchError}
        </div>
      )}

      {/* Empty */}

      {!loading && !fetchError && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          {lots.length === 0
            ? "Бүтээгдэхүүн олдсонгүй."
            : "Хайлтад тохирох бүтээгдэхүүн байхгүй."}
        </div>
      )}

      {/* Product Grid */}

      {!loading && !fetchError && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((lot) => {
            const images = getImages(lot);

            const name = getName(lot);

            const id = getId(lot);
            const refNo = getString(lot, "reference_no", "ref_no", "lot_no");

            const desc = getString(lot, "description", "body", "details");

            const lotStatus = getStatus(lot);
            const lotStatusLabel = getStatusLabel(lot);

            const badge = statusStyle(lotStatus);

            const yourPrice = getNumber(
              lot,
              "starting_price",
              "yourPrice",
              "price",
              "start_price",
            );

            const highestBid = getNumber(
              lot,
              "highest_bid",
              "current_bid",
              "highestBid",
              "max_bid",
            );

            const bids = getNumber(
              lot,
              "bids_count",
              "bids",
              "bid_count",
              "total_bids",
            );

            // Try name from lot; fall back to looking up by ID in the categories list
            const catRaw = getField(lot, "category", "lot_type", "type");
            const catId = catRaw && typeof catRaw === "object"
              ? String((catRaw as Record<string, unknown>).id ?? (catRaw as Record<string, unknown>).key ?? "")
              : String(catRaw ?? "");
            const category =
              getCategory(lot) ||
              categories.find((c) => String(c.key) === catId)?.value ||
              "";
            const subCategory = getSubCategory(lot);

            const created = getString(
              lot,
              "created_at",
              "created",
              "date_created",
            );

            return (
              <Card
                key={id || JSON.stringify(lot)}
                className="overflow-hidden p-0"
              >
                {/* Image */}

                <div className="relative h-60 w-full bg-muted">
                  {images[0] ? (
                    <Image
                      src={images[0]}
                      alt={name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No image
                    </div>
                  )}

                  {lotStatus && (
                    <span
                      className={`absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                    >
                      {lotStatusLabel}
                    </span>
                  )}
                </div>

                {/* Content */}

                <CardContent className="p-4 space-y-3">
                  <div>
                    {(refNo || id) && (
                      <p className="text-xs font-medium text-orange-500 mb-1 truncate">
                        {refNo || id}
                      </p>
                    )}

                    <h3 className="font-bold text-lg leading-tight">
                      {name || "—"}
                    </h3>

                    {(category || subCategory) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[category, subCategory].filter(Boolean).join(" › ")}
                      </p>
                    )}

                    {desc && (
                      <p className="text-sm text-blue-500 mt-0.5 line-clamp-2">
                        {desc}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    {yourPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Starting Price:
                        </span>

                        <span className="font-medium">
                          {formatMNT(yourPrice)}
                        </span>
                      </div>
                    )}

                    {highestBid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Highest Bid:
                        </span>

                        <span className="font-semibold text-emerald-600">
                          {formatMNT(highestBid)}
                        </span>
                      </div>
                    )}

                    {bids > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bids:</span>

                        <span className="font-medium">{bids}</span>
                      </div>
                    )}

                    {category && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>

                        <span className="font-medium text-right">
                          {category}
                        </span>
                      </div>
                    )}

                    {created && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>

                        <span className="font-medium">{created}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => openModal(lot)}
                  >
                    Дэлгэрэнгүй үзэх
                  </Button>

                  {lotStatus === "pending" && (
                    <Button
                      variant="outline"
                      className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 gap-2"
                      onClick={() => setEditingLot(lot)}
                    >
                      <Pencil className="w-4 h-4" />
                      Засах
                    </Button>
                  )}

                  {lotStatus === "pending" && (
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 gap-2"
                      onClick={() => handleDelete(id)}
                      disabled={deletingId === id}
                    >
                      {deletingId === id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                      Устгах
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}

      <LotDetailModal lot={selectedLot} onClose={closeModal} />

      <EditLotModal
        lot={editingLot}
        onClose={() => setEditingLot(null)}
        onUpdated={(updated) => {
          setLots((prev) => prev.map((l) => (String(l.id ?? l.lot_id ?? l.uuid ?? l.pk) === String(updated.id ?? updated.lot_id ?? updated.uuid ?? updated.pk) ? { ...l, ...updated } : l)));
          setEditingLot(null);
        }}
      />
    </div>
  );
}
