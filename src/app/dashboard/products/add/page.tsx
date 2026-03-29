"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { key: number | string; value: string };

const carFieldOptions = {
  condition: ["Шинэ", "Хуучин"],
  type: ["Sedan", "SUV", "Hatchback", "Crossover", "Pickup", "Van", "Coupe", "Minivan"],
  doors: ["2", "3", "4", "5"],
  steeringWheel: ["Зүүн", "Баруун"],
  driveType: ["FWD", "RWD", "AWD", "4WD"],
  yearOfManufacture: Array.from({ length: 36 }, (_, i) => String(2025 - i)),
  yearOfImport: Array.from({ length: 20 }, (_, i) => String(2025 - i)),
  engine: ["Бензин", "Дизель", "Цахилгаан", "Гибрид", "Байгалийн хий"],
  engineCapacity: ["1.0","1.2","1.3","1.4","1.5","1.6","1.8","2.0","2.2",
    "2.4","2.5","2.7","2.8","3.0","3.3","3.5","3.8","4.0","4.5","5.0","5.7","6.0+"],
  gearbox: ["Автомат", "Механик", "Робот", "Вариатор"],
  interiorColor: ["Хар", "Саарал", "Цагаан", "Бор", "Бежевый", "Улаан", "Цэнхэр"],
  color: ["Цагаан","Хар","Мөнгө","Саарал","Улаан","Цэнхэр","Ногоон","Шар","Хүрэн","Бор"],
};

const durations = ["1", "3", "6", "12", "24", "48", "72"];

function computeStartDateOptions() {
  const today = new Date();
  return [7, 14, 30].map((days) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    const formatted = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    const label =
      days === 7
        ? "7 хоногийн дараа"
        : days === 14
        ? "14 хоногийн дараа"
        : "30 хоногийн дараа";
    return { value: d.toISOString().split("T")[0], label: `${label} (${formatted})` };
  });
}

export default function AddProductPage() {
  const router = useRouter();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [childLoading, setChildLoading] = useState(false);
  const [subCategoryKey, setSubCategoryKey] = useState<number | string>("");
  const [imei, setImei] = useState("");
  const [imeiStatus, setImeiStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [carFields, setCarFields] = useState<Record<string, string>>({
    condition: "", type: "", doors: "", steeringWheel: "", driveType: "",
    yearOfManufacture: "", yearOfImport: "", engine: "", engineCapacity: "",
    gearbox: "", interiorColor: "", mileage: "", color: "", chassis: "",
  });

  const setCarField = (key: string, val: string) =>
    setCarFields((prev) => ({ ...prev, [key]: val }));

  // ── Dynamic categories from API ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  // ── Form fields ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bidIncrement, setBidIncrement] = useState("10000");
  const [duration, setDuration] = useState("");
  const [categoryKey, setCategoryKey] = useState<number | string>("");


  // ── Submission ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setCatsLoading(false); return; }
    fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const raw: { id?: unknown; key?: unknown; name?: unknown; value?: unknown }[] =
          Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.results) ? data.results
          : (Object.values(data ?? {}).find((v) => Array.isArray(v)) as typeof raw) ?? [];
        const list: Category[] = raw.map((item) => ({
          key: (item.key ?? item.id ?? "") as number | string,
          value: String(item.value ?? item.name ?? ""),
        }));
        setCategories(list);
      })
      .catch(() => {})
      .finally(() => setCatsLoading(false));
  }, []);

  // Fetch child categories whenever a parent category is selected
  useEffect(() => {
    if (!categoryKey) { setChildCategories([]); setSubCategory(""); setSubCategoryKey(""); return; }
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setChildLoading(true);
    setSubCategory("");
    setSubCategoryKey("");
    fetch(`/api/categories/${categoryKey}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        console.log("[child cats raw]", data);
        const raw: { id?: unknown; key?: unknown; name?: unknown; value?: unknown }[] =
          Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.results) ? data.results
          : (Object.values(data ?? {}).find((v) => Array.isArray(v)) as typeof raw) ?? [];
        const list: Category[] = raw.map((item) => {
          // mongolica {key, value} format: key=label, value=numeric ID
          // plain {id, name} format: id=numeric ID, name=label
          const hasKeyValue = item.key !== undefined && item.value !== undefined;
          return {
            key: hasKeyValue
              ? (item.value as number | string)   // use value as the ID to submit
              : (item.id ?? item.key ?? "") as number | string,
            value: hasKeyValue
              ? String(item.key)                   // use key as display name
              : String(item.name ?? item.value ?? ""),
          };
        });
        setChildCategories(list);
      })
      .catch(() => {})
      .finally(() => setChildLoading(false));
  }, [categoryKey]);

  const catUpper = category.toUpperCase();
  const isCar = catUpper.includes("АВТО") || catUpper.includes("CAR") || catUpper.includes("МАШИН");
  const isPhone = catUpper.includes("УТАС") || catUpper.includes("PHONE");
  const showImei = isPhone && (subCategory.toLowerCase().includes("iphone") || subCategory.toLowerCase().includes("ipad"));

  async function checkImei() {
    if (imei.length < 15) return;
    setImeiStatus("checking");
    // Redirect user to imei.info for the check — no CORS-safe public API available
    window.open(`https://www.imei.info/?imei=${encodeURIComponent(imei)}`, "_blank", "noopener,noreferrer");
    setImeiStatus("idle");
  }
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0") + ":00"
  );

  const priceNum = Number(price.replace(/[^0-9]/g, "")) || 0;
  const systemFee = Math.round(priceNum * 0.1);
  const auctionStartingPrice = priceNum + systemFee;
  const startDateOptions = computeStartDateOptions();

  const addImageUrl = () => {
    const url = urlInput.trim();
    if (!url || imageUrls.includes(url)) return;
    setImageUrls((prev) => [...prev, url]);
    setUrlInput("");
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  async function handleSubmit() {
    setSubmitError("");
    if (!name.trim()) { setSubmitError("Бүтээгдэхүүний нэр оруулна уу."); return; }
    if (!categoryKey) { setSubmitError("Ангилал сонгоно уу."); return; }
    if (!price) { setSubmitError("Үнэ оруулна уу."); return; }
    if (!duration) { setSubmitError("Үргэлжлэх хугацаа сонгоно уу."); return; }
    if (!startDate || !startTime) { setSubmitError("Эхлэх огноо болон цаг сонгоно уу."); return; }
    const token = localStorage.getItem("access_token");
    if (!token) { setSubmitError("Нэвтрэх шаардлагатай."); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("description", description.trim());
      fd.append("category", String(categoryKey));
      fd.append("starting_price", String(auctionStartingPrice));
      fd.append("bid_increment", bidIncrement || "10000");
      fd.append("duration", String(Number(duration)));         // numeric
      fd.append("start_date", `${startDate} ${startTime}:00`); // space separator
      fd.append("use_user_address", "true");
      if (subCategoryKey) {
        fd.append("sub_category", String(subCategoryKey));
        fd.append("subcategory", String(subCategoryKey)); // send both just in case
      }
      if (imei) fd.append("imei", imei);

      // attributes as plain object { label: value }
      const attrsObj: Record<string, string> = {};
      if (isCar) {
        Object.entries(carFields).forEach(([k, v]) => { if (v) attrsObj[k] = v; });
      }
      fd.append("attributes", JSON.stringify(attrsObj));

      // thumbnail = first URL; images = all URLs
      if (imageUrls.length > 0) {
        fd.append("thumbnail", imageUrls[0]);
        imageUrls.forEach((url) => fd.append("images", url));
      }
      const res = await fetch("/api/lots", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      // Backend uses envelope: { module, status_code: "ng"|"ok", msg, data }
      const isError = !res.ok || data?.status_code === "ng";
      if (isError) {
        let msg = "";
        if (typeof data?.msg === "string") {
          msg = data.msg;
          // Append field-level errors from data.data
          const inner = data?.data;
          if (inner && typeof inner === "object") {
            const flatVal = (v: unknown): string => {
              if (typeof v === "string") return v;
              if (Array.isArray(v)) return v.map(flatVal).join(", ");
              if (v && typeof v === "object") {
                const o = v as Record<string, unknown>;
                return o.message ? String(o.message) : o.detail ? String(o.detail) : JSON.stringify(o);
              }
              return String(v);
            };
            const fields = Object.entries(inner)
              .map(([k, v]) => `${k}: ${flatVal(v)}`)
              .join(" | ");
            if (fields) msg += " — " + fields;
          }
        } else if (typeof data?.detail === "string") msg = data.detail;
        else if (typeof data?.error === "string") msg = data.error;
        else msg = JSON.stringify(data);
        setSubmitError(msg || "Алдаа гарлаа.");
        return;
      }
      setSubmitSuccess(true);
      setTimeout(() => router.push("/dashboard/products"), 1500);
    } catch {
      setSubmitError("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Бүтээгдэхүүн нэмэх</h1>

      {/* Section 1: General Info */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <h2 className="font-bold text-lg">Ерөнхий мэдээлэл</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>
                Бүтээгдэхүүний нэр <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g., TOYOTA LAND CRUISER 250"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>
                Ангилал <span className="text-red-500">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  const found = categories.find((c) => c.value === v);
                  setCategory(v ?? "");
                  setCategoryKey(found?.key ?? "");
                  setSubCategory("");
                  setSubCategoryKey("");
                  setChildCategories([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={catsLoading ? "Ачааллаж байна..." : "Ангилал сонгоно уу"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={String(c.key)} value={c.value}>
                      {c.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subcategory from API child categories */}
          {childLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Дэд ангилал ачааллаж байна...
            </div>
          )}
          {!childLoading && childCategories.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                Дэд ангилал <span className="text-red-500">*</span>
              </Label>
              <Select
                value={String(subCategoryKey || "")}
                onValueChange={(v) => {
                  const found = childCategories.find((c) => String(c.key) === v);
                  setSubCategoryKey(v ?? "");
                  setSubCategory(found?.value ?? "");
                  setImei("");
                  setImeiStatus("idle");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Дэд ангилал сонгоно уу" />
                </SelectTrigger>
                <SelectContent>
                  {childCategories.map((c) => (
                    <SelectItem key={String(c.key)} value={String(c.key)}>
                      {c.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* IMEI field for iPhone / iPad */}
          {showImei && (
            <div className="space-y-1.5">
              <Label>
                IMEI дугаар <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 356938035643809"
                  value={imei}
                  maxLength={17}
                  onChange={(e) => { setImei(e.target.value.replace(/[^0-9]/g, "")); setImeiStatus("idle"); }}
                  className="flex-1 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  disabled={imei.length < 15 || imeiStatus === "checking"}
                  onClick={checkImei}
                >
                  {imeiStatus === "checking" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  IMEI шалгаах
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {imeiStatus === "valid" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {imeiStatus === "invalid" && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                IMEI шалгахад талбар дараах товч оорулна уу. Шалгахад{" "}
                <a href="https://www.imei.info" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  imei.info
                </a>
                {" "}пратформ ашигладаг байна.
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label>
              Тайлбар оруулна уу <span className="text-red-500">*</span>
            </Label>
            <textarea
              rows={4}
              placeholder="Барааны дэлгэрэнгүй танилцуулга оруулна уу..."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <Label>
                Үнэ (Price) <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g., 12000000"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                Үнийн дүнг бүх тагтай нь оруулна уу. Жишээ нь: 12 сайн
                12000000 гэж оруулна уу.
              </p>
            </div>

            {priceNum > 0 && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                <p className="font-semibold">Auction Starting Price (MNT)</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Price:</span>
                    <span>{priceNum.toLocaleString()} MNT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">System Fee (10%):</span>
                    <span className="text-orange-500">+{systemFee.toLocaleString()} MNT</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-bold">
                    <span>Auction Starting Price:</span>
                    <span>{auctionStartingPrice.toLocaleString()} MNT</span>
                  </div>
                </div>
                <p className="text-xs text-blue-500">
                  The auction will start at 110% of your price (includes 10% system fee)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section: Vehicle Information — shown only for АВТОМАШИН */}
      {isCar && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-bold text-lg">Автомашины мэдээлэл (Vehicle Information)</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Нөхцөл */}
              <div className="space-y-1.5">
                <Label>Нөхцөл (Condition) <span className="text-red-500">*</span></Label>
                <Select value={carFields.condition} onValueChange={(v) => setCarField("condition", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {carFieldOptions.condition.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Төрөл */}
              <div className="space-y-1.5">
                <Label>Төрөл (Type) <span className="text-red-500">*</span></Label>
                <Select value={carFields.type} onValueChange={(v) => setCarField("type", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {carFieldOptions.type.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Хаалга */}
              <div className="space-y-1.5">
                <Label>Хаалга (Door) <span className="text-red-500">*</span></Label>
                <Select value={carFields.doors} onValueChange={(v) => setCarField("doors", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {carFieldOptions.doors.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Хурд / Steering Wheel */}
              <div className="space-y-1.5">
                <Label>Хурд (Steering Wheel) <span className="text-red-500">*</span></Label>
                <Select value={carFields.steeringWheel} onValueChange={(v) => setCarField("steeringWheel", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {carFieldOptions.steeringWheel.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Хөтлөгч */}
              <div className="space-y-1.5">
                <Label>Хөтлөгч (Drive Type) <span className="text-red-500">*</span></Label>
                <Select value={carFields.driveType} onValueChange={(v) => setCarField("driveType", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {carFieldOptions.driveType.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Үйлдвэрлэсэн он */}
              <div className="space-y-1.5">
                <Label>Үйлдвэрлэсэн он (Year of Manufacture) <span className="text-red-500">*</span></Label>
                <Select value={carFields.yearOfManufacture} onValueChange={(v) => setCarField("yearOfManufacture", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {carFieldOptions.yearOfManufacture.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Орж ирсэн он */}
              <div className="space-y-1.5">
                <Label>Орж ирсэн он (Year of Import) <span className="text-red-500">*</span></Label>
                <Select value={carFields.yearOfImport} onValueChange={(v) => setCarField("yearOfImport", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {carFieldOptions.yearOfImport.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Хөдөлгүүр */}
              <div className="space-y-1.5">
                <Label>Хөдөлгүүр (Engine) <span className="text-red-500">*</span></Label>
                <Select value={carFields.engine} onValueChange={(v) => setCarField("engine", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {carFieldOptions.engine.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Мотор багтаамж */}
              <div className="space-y-1.5">
                <Label>Мотор багтаамж (Engine Capacity) <span className="text-red-500">*</span></Label>
                <Select value={carFields.engineCapacity} onValueChange={(v) => setCarField("engineCapacity", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {carFieldOptions.engineCapacity.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Хурдны хайрцаг */}
              <div className="space-y-1.5">
                <Label>Хурдны хайрцаг (Gearbox) <span className="text-red-500">*</span></Label>
                <Select value={carFields.gearbox} onValueChange={(v) => setCarField("gearbox", v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {carFieldOptions.gearbox.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Дотор өнгө */}
              <div className="space-y-1.5">
                <Label>Дотор өнгө (Interior Color) <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g., Хар, Саарал..."
                  value={carFields.interiorColor}
                  onChange={(e) => setCarField("interiorColor", e.target.value)}
                />
              </div>

              {/* Явсан / Mileage */}
              <div className="space-y-1.5">
                <Label>Явсан (Mileage) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    placeholder="e.g., 8000"
                    value={carFields.mileage}
                    onChange={(e) => setCarField("mileage", e.target.value.replace(/[^0-9]/g, ""))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">KM</span>
                </div>
              </div>

              {/* Өнгө / Color */}
              <div className="space-y-1.5">
                <Label>Өнгө (Color) <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g., Цагаан, Хар..."
                  value={carFields.color}
                  onChange={(e) => setCarField("color", e.target.value)}
                />
              </div>

              {/* Арлын дугаар / Chassis */}
              <div className="space-y-1.5">
                <Label>Арлын дугаар (Chassis Number/VIN)</Label>
                <Input
                  placeholder="e.g., JT1234567890123456"
                  value={carFields.chassis}
                  onChange={(e) => setCarField("chassis", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2: Auction Settings */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="font-bold text-lg">Дуудлагын тохиргоо</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Дуудлагын алхам (₮) <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g., 10000"
                value={bidIncrement}
                onChange={(e) => setBidIncrement(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Дуудлага худалдаа үргэлжлэх хугацаа (Цаг)</Label>
              <Select value={duration} onValueChange={(v) => setDuration(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} цаг
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Дуудлага худалдаа эхлэх огноо</Label>
              <Select value={startDate} onValueChange={(v) => { setStartDate(v ?? ""); setStartTime(""); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {startDateOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {startDate && (
                <div className="space-y-1.5 pt-1">
                  <Label>Эхлэх цаг</Label>
                  <Select value={startTime} onValueChange={(v) => setStartTime(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {hourOptions.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Image Upload */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="font-bold text-lg">Бүтээгдэхүүний зураг</h2>

          <div>
            <Label>
              Зураг оруулах <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-blue-500 mt-0.5">
              Зургийн URL хаяг оруулна уу
            </p>
          </div>

          {/* URL input row */}
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }}
            />
            <Button type="button" variant="outline" onClick={addImageUrl} disabled={!urlInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Preview grid */}
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imageUrls.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-blue-600 text-white py-0.5">
                      Голлогч
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {imageUrls.length}/10 зураг нэмэгдсэн. Анхны зураг голлогч зураг болно.
          </p>
        </CardContent>
      </Card>

      {/* Footer Buttons */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Амжилттай нэмэгдлээ. Шилжиж байна...
        </div>
      )}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/products")}>
          Цуцлах
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 gap-2"
          onClick={handleSubmit}
          disabled={submitting || submitSuccess}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Бүтээгдэхүүн нэмэх
        </Button>
      </div>
    </div>
  );
}
