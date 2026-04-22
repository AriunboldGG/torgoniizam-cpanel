"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn, ChevronLeft, ChevronRight, Clock, AlarmClock, Hourglass } from "lucide-react";
import { assetUrl } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Lot = Record<string, unknown>;
type AttrPair = { key: string; value: string };

// ── Car attribute key → Mongolian label map ───────────────────────────────────
const CAR_ATTR_LABELS: Record<string, string> = {
  condition:           "Нөхцөл",
  type:                "Төрөл",
  doors:               "Хаалга",
  steeringWheel:       "Жолооны байрлал",
  driveType:           "Хөтлөгч",
  yearOfManufacture:   "Үйлдвэрлэсэн он",
  yearOfImport:        "Орж ирсэн он",
  engine:              "Хөдөлгүүр",
  engineCapacity:      "Мотор багтаамж",
  gearbox:             "Хурдны хайрцаг",
  interiorColor:       "Дотор өнгө",
  mileage:             "Явсан км",
  color:               "Өнгө",
  chassis:             "Арлын дугаар",
};

function attrLabel(key: string): string {
  return CAR_ATTR_LABELS[key] ?? key;
}

// ── Field helpers ─────────────────────────────────────────────────────────────

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

// Extract the human-readable label from { key, value } objects or plain values
function displayVal(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if ("value" in obj) return String(obj.value ?? "");
  }
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
}

// Extract machine key from { key, value } — used for badge styling
function extractKey(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if ("key" in obj) return String(obj.key ?? "").toUpperCase();
  }
  if (typeof raw === "string") return raw.toUpperCase();
  return "";
}

// ── Specific extractors ───────────────────────────────────────────────────────

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
      .filter(Boolean)
      .map(assetUrl);
  }
  const single = getString(lot, "image", "image_url", "thumbnail", "photo");
  return single ? [assetUrl(single)] : [];
}

function getName(lot: Lot): string {
  return getString(lot, "name", "title", "lot_name", "product_name");
}

// Parse attributes/specs into AttrPair[] — handles both array and plain-object shapes
function getAttributes(lot: Lot): AttrPair[] {
  const raw = getField(lot, "attributes", "specs", "specifications", "features");
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .filter((item) => typeof item === "object" && item !== null)
      .map((item) => {
        const obj = item as Record<string, unknown>;
        const k = String(obj.key ?? obj.name ?? obj.label ?? "");
        const v = String(obj.value ?? obj.val ?? "");
        return { key: k, value: v };
      })
      .filter((a) => a.key);
  }

  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => ({ key: k, value: String(v) }));
  }

  return [];
}

// Parse address object into AttrPair[]
function getAddressFields(lot: Lot): AttrPair[] {
  const raw = getField(lot, "address", "location", "delivery_address", "shipping_address");
  if (!raw) return [];
  if (typeof raw === "string" && raw) return [{ key: "Хаяг", value: raw }];
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => ({ key: k, value: String(v) }));
  }
  return [];
}

// Compute end date from start_date string + duration in hours
function calcEndDate(startStr: string, durationHours: number): string {
  if (!startStr || !durationHours) return "";
  try {
    const d = new Date(startStr.replace(" ", "T"));
    if (isNaN(d.getTime())) return "";
    d.setHours(d.getHours() + durationHours);
    return (
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, "0")}-` +
      `${String(d.getDate()).padStart(2, "0")} ` +
      `${String(d.getHours()).padStart(2, "0")}:` +
      `${String(d.getMinutes()).padStart(2, "0")}`
    );
  } catch {
    return "";
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────

function statusStyle(key: string): { bg: string; text: string } {
  switch (key) {
    case "ACTIVE":
      return { bg: "bg-emerald-500", text: "text-white" };
    case "ENDED":
      return { bg: "bg-blue-600", text: "text-white" };
    case "PENDING":
      return { bg: "bg-yellow-400", text: "text-black" };
    default:
      return { bg: "bg-gray-400", text: "text-white" };
  }
}

function formatMNT(n: number) {
  return "₮" + n.toLocaleString("mn-MN");
}

// ── Reusable sub-components ───────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center px-4 py-2.5 gap-4 odd:bg-muted/20">
      <span className="text-muted-foreground text-sm shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <p className="font-semibold text-sm px-4 py-3 bg-muted/40 border-b">{title}</p>
      <div className="divide-y">{children}</div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface LotDetailModalProps {
  lot: Lot | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LotDetailModal({ lot, onClose }: LotDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [secretValue, setSecretValue] = useState<string | null>(null);
  const [secretLoading, setSecretLoading] = useState(false);
  type Buyer = {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    informal?: string;
  };
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [buyerLoading, setBuyerLoading] = useState(false);

  useEffect(() => {
    if (!lot) { setSecretValue(null); setBuyer(null); return; }
    const lotId = String(lot.id ?? lot.lot_id ?? lot.uuid ?? lot.pk ?? "");
    if (!lotId) { setSecretValue(null); setBuyer(null); return; }
    const token = localStorage.getItem("access_token");
    if (!token) { setSecretValue(null); setBuyer(null); return; }

    // Fetch secret_value
    setSecretLoading(true);
    fetch(`/api/v1/lot/detail/${lotId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        const sv = data?.secret_value ?? data?.data?.secret_value ?? null;
        setSecretValue(sv !== undefined && sv !== null ? String(sv) : null);
      })
      .catch(() => setSecretValue(null))
      .finally(() => setSecretLoading(false));

    // Fetch buyer info
    setBuyerLoading(true);
    fetch(`/api/v1/bid/won/${lotId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        const b = data?.buyer ?? data?.data?.buyer ?? null;
        setBuyer(b && typeof b === "object" ? (b as Buyer) : null);
      })
      .catch(() => setBuyer(null))
      .finally(() => setBuyerLoading(false));
  }, [lot]);

  function prevImage(images: string[]) {
    setActiveImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function nextImage(images: string[]) {
    setActiveImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setActiveImageIndex(0);
      setIsZoomed(false);
      setSecretValue(null);
      setBuyer(null);
      onClose();
    }
  }

  if (!lot) return null;

  // ── Derived values ──────────────────────────────────────────────────────
  const images  = getImages(lot);
  const name    = getName(lot);
  const refNo   = getString(lot, "reference_no", "ref_no", "lot_no");
  const desc    = getString(lot, "description", "body", "details");

  const rawStatus = getField(lot, "status", "state");
  const sKey      = extractKey(rawStatus);
  const sLabel    = displayVal(rawStatus) || sKey;
  const badge     = statusStyle(sKey);

  const category      = displayVal(getField(lot, "category", "lot_type", "type"));
  const seller        = displayVal(getField(lot, "seller", "owner", "user"));
  const startingPrice = getNumber(lot, "starting_price", "start_price", "yourPrice", "price");
  const currentBid    = getNumber(lot, "current_bid", "highest_bid", "highestBid", "max_bid");
  const bidIncrement  = getNumber(lot, "bid_increment", "increment", "step");
  const bidsCount     = getNumber(lot, "bids_count", "bid_count", "total_bids", "bids");

  const startDate  = getString(lot, "start_date", "start_time", "starts_at", "started_at", "begin_at");
  const duration   = getNumber(lot, "duration", "duration_hours", "auction_duration");
  const endsAt     =
    getString(lot, "ends_at", "end_date", "end_time", "ended_at", "finish_at", "expired_at") ||
    calcEndDate(startDate, duration);

  const attributes    = getAttributes(lot);
  const addressFields = getAddressFields(lot);

  return (
    <>
      <Dialog open={!!lot} onOpenChange={handleOpenChange}>
        <DialogContent className="!max-w-3xl w-full p-0 overflow-hidden overflow-y-auto max-h-[90vh]">
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="text-xl font-bold">
              Дуудлага худалдааны дэлгэрэнгүй
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-6 p-6 pt-4">
            {/* ── Left: Image gallery ── */}
            <div className="flex-shrink-0 w-full md:w-[300px] space-y-2">
              <div
                className="relative h-64 w-full bg-muted rounded-xl overflow-hidden group cursor-zoom-in"
                onClick={() =>
                  images[activeImageIndex] && setIsZoomed(true)
                }
              >
                {images[activeImageIndex] ? (
                  <Image
                    src={images[activeImageIndex]}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Зураг байхгүй
                  </div>
                )}

                {images[activeImageIndex] && (
                  <div className="absolute inset-0 flex items-start justify-end p-2 pointer-events-none">
                    <span className="bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <ZoomIn className="w-3 h-3" /> Томруулах
                    </span>
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(images); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(images); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      {activeImageIndex + 1}/{images.length}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === activeImageIndex
                          ? "border-blue-600"
                          : "border-transparent hover:border-gray-400"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${name} ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Details ── */}
            <div className="flex-1 space-y-4 min-w-0">

              {/* Status + reference_no badges */}
              <div className="flex flex-wrap items-center gap-2">
                {sLabel && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                    {sLabel}
                  </span>
                )}
                {refNo && (
                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                    {refNo}
                  </span>
                )}
              </div>

              {/* Name + description */}
              <div>
                <h2 className="text-2xl font-bold leading-tight">{name || "—"}</h2>
                {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
              </div>

              {/* ── Дуудлагын мэдээлэл ── */}
              <Section title="Дуудлагын мэдээлэл">
                <InfoRow label="Ангилал"          value={category} />
                <InfoRow label="Нийлүүлэгч"       value={seller} />
                <InfoRow label="Эхлэх үнэ"         value={startingPrice > 0 ? formatMNT(startingPrice) : ""} />
                <InfoRow
                  label="Одоогийн үнэ"
                  value={currentBid > 0 ? formatMNT(currentBid) : ""}
                  valueClass="text-emerald-600"
                />
                <InfoRow label="Нийт дуудлага"    value={bidsCount > 0 ? String(bidsCount) : ""} />
              </Section>
              {/* ── Бараа авах код ── */}
              <div className="rounded-xl border overflow-hidden">
                <p className="font-semibold text-sm px-4 py-3 bg-muted/40 border-b">Бараа авах код</p>
                <div className="px-4 py-3">
                  {secretLoading ? (
                    <span className="text-sm text-muted-foreground">Уншиж байна...</span>
                  ) : secretValue ? (
                    <span className="font-mono text-lg font-bold tracking-widest select-all">
                      {secretValue}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Код байхгүй</span>
                  )}
                </div>
              </div>

              {/* ── Хугацааны мэдээлэл ── */}
              {(startDate || endsAt || duration > 0) && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    {startDate && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3">
                        <p className="text-xs text-blue-500 font-medium mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Эхлэх огноо</p>
                        <p className="font-bold text-sm text-blue-700 dark:text-blue-300">{startDate}</p>
                      </div>
                    )}
                    {endsAt && (
                      <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900 p-3">
                        <p className="text-xs text-orange-500 font-medium mb-1 flex items-center gap-1"><AlarmClock className="w-3.5 h-3.5" /> Дуусах огноо</p>
                        <p className="font-bold text-sm text-orange-700 dark:text-orange-300">{endsAt}</p>
                      </div>
                    )}
                  </div>
                  {duration > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700 px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Hourglass className="w-4 h-4" /> Үргэлжлэх хугацаа</span>
                      <span className="font-bold text-sm">{duration} цаг</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Техникийн үзүүлэлтүүд (attributes) ── */}
              {attributes.length > 0 && (
                <Section title="Техникийн үзүүлэлтүүд">
                  {attributes.map((attr) => (
                    <InfoRow key={attr.key} label={attrLabel(attr.key)} value={attr.value} />
                  ))}
                </Section>
              )}

              {/* ── Хаягийн мэдээлэл ── */}
              {addressFields.length > 0 && (
                <Section title="Хаягийн мэдээлэл">
                  {addressFields.map((field) => (
                    <InfoRow key={field.key} label={field.key} value={field.value} />
                  ))}
                </Section>
              )}

              {/* ── Худалдан авагчийн мэдээлэл ── */}
              <div className="rounded-xl border overflow-hidden">
                <p className="font-semibold text-sm px-4 py-3 bg-muted/40 border-b">Худалдан авагчийн мэдээлэл</p>
                <div className="divide-y">
                  {buyerLoading ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">Уншиж байна...</div>
                  ) : buyer ? (
                    <>
                      {(buyer.first_name || buyer.last_name) && (
                        <InfoRow label="Нэр" value={[buyer.first_name, buyer.last_name].filter(Boolean).join(" ")} />
                      )}
                      {buyer.username && <InfoRow label="Хэрэглэгчийн нэр" value={buyer.username} />}
                      {buyer.informal && <InfoRow label="Дэлгэрэнгүй нэр" value={buyer.informal} />}
                      {buyer.email && <InfoRow label="И-мэйл" value={buyer.email} />}
                      {buyer.phone && <InfoRow label="Утас" value={buyer.phone} />}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground">Мэдээлэл байхгүй</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen zoom overlay */}
      {isZoomed && images[activeImageIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setIsZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setIsZoomed(false)}
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeImageIndex]}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                onClick={(e) => { e.stopPropagation(); prevImage(images); }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                onClick={(e) => { e.stopPropagation(); nextImage(images); }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                {activeImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
