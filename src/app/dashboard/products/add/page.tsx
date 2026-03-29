"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

const categories = [
  { value: "АВТОМАШИН", label: "АВТОМАШИН (Car)" },
  { value: "ГАР УТАС & ТАБЛЕТ", label: "ГАР УТАС & ТАБЛЕТ (Mobile Phone & Tablet)" },
  { value: "КОМПЬЮТЕР", label: "КОМПЬЮТЕР (Computer)" },
  { value: "ҮНЭТ ЭДЛЭЛ", label: "ҮНЭТ ЭДЛЭЛ (Jewelry)" },
  { value: "ЦАХИЛГААН БАРАА", label: "ЦАХИЛГААН БАРАА (Electronics)" },
];

const carBrands = [
  "Toyota","Lexus","Mercedes-Benz","Nissan","Subaru","Ford","Mitsubishi",
  "Hyundai","Land Rover","BMW","Jeep","Honda","Mazda","BYD","Volkswagen",
  "Suzuki","Kia","Geely","Audi","Porsche","Бусад","Chevrolet","Renault",
  "Changan","MG","SsangYong","Dodge","Dongfeng","Jetour","Tesla",
  "GWM Tank","Infiniti","Daihatsu","Hummer","MINI","Foton","Haval",
  "Baic","Huawei","Isuzu","Lincoln","Wuling","Acura","Bentley",
  "Cadillac","Chery","Fiat","GMC","Jaguar","Kaiyi","Lada","Li Auto",
  "Samsung","UAZ","Volvo",
];

const phoneBrands = [
  "iPhone","Samsung","Xiaomi","Huawei","iPad","Oppo","Vivo","OnePlus",
  "Realme","Nokia","Motorola","Sony","Google Pixel","Asus","Lenovo",
  "Бусад",
];

const computerBrands = [
  "Суурин компьютер",
  "Notebook",
  "PS, XBox, Nintendo",
  "Принтер, хувилагч, сканнер, ламинатор",
  "Сэлбэг",
  "iPad, tablet, kindle",
  "Принтер, хувилагчийн хор",
  "Чихэвч, 3D шил",
  "Дагалдах хэрэгсэл",
];

const jewelryBrands = [
  "Алт",
  "Мөнгө",
  "Цагаан алт",
  "Хүрэл",
  "Эрдэнийн чулуу",
  "Алтан эдлэл",
  "Бусад",
];

const electronicsBrands = [
  "Фото, видео камер",
  "TV, Audio + Video",
  "Гал тогооны цахилгаан бараа",
  "Тэнь, халаагуур",
  "Угаалгын машин",
  "Тоос сорогч, хивс угаагч, индүү",
  "Агааржуулагч, сэнс",
  "Оёдлын машин",
  "Хөргөгч, хөлдөөгч",
  "Цахилгаан барааны дагалдах хэрэгсэл",
  "Бусад",
];

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [imei, setImei] = useState("");
  const [imeiStatus, setImeiStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [carFields, setCarFields] = useState<Record<string, string>>({
    condition: "", type: "", doors: "", steeringWheel: "", driveType: "",
    yearOfManufacture: "", yearOfImport: "", engine: "", engineCapacity: "",
    gearbox: "", interiorColor: "", mileage: "", color: "", chassis: "",
  });

  const setCarField = (key: string, val: string) =>
    setCarFields((prev) => ({ ...prev, [key]: val }));

  const isPhone = category === "ГАР УТАС & ТАБЛЕТ";
  const isCar = category === "АВТОМАШИН";
  const isComputer = category === "КОМПЬЮТЕР";
  const isJewelry = category === "ҮНЭТ ЭДЛЭЛ";
  const isElectronics = category === "ЦАХИЛГААН БАРАА";
  const showImei = isPhone && (subCategory === "iPhone" || subCategory === "iPad");

  const activeBrands = isCar ? carBrands
    : isPhone ? phoneBrands
    : isComputer ? computerBrands
    : isJewelry ? jewelryBrands
    : isElectronics ? electronicsBrands
    : [];
  const filteredBrands = activeBrands.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

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

  const handleFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files).slice(0, 10 - previews.length);
    const urls = incoming.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

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
              <Input placeholder="e.g., TOYOTA LAND CRUISER 250" />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>
                Ангилал <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => { setCategory(v ?? ""); setSubCategory(""); setBrandSearch(""); setBrandOpen(false); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subcategory brand picker for Car, Phone/Tablet, or Computer */}
          {(isCar || isPhone || isComputer || isJewelry || isElectronics) && (
            <div className="space-y-1.5">
              <Label>
                Дэд ангилал <span className="text-red-500">*</span>
              </Label>
              <div className="relative border rounded-md" onKeyDown={(e) => e.key === "Escape" && setBrandOpen(false)}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-sm"
                  onClick={() => setBrandOpen((o) => !o)}
                >
                  <span className={subCategory ? "" : "text-muted-foreground"}>
                    {subCategory || "Select brand or subcategory"}
                  </span>
                  <svg className={`w-4 h-4 text-muted-foreground transition-transform ${brandOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {brandOpen && (
                  <div className="border-t">
                    <div className="p-2">
                      <input
                        autoFocus
                        className="w-full text-sm px-2 py-1.5 rounded border border-input bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Search brands..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredBrands.map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors ${
                            subCategory === b ? "bg-accent font-medium" : ""
                          }`}
                          onClick={() => { setSubCategory(b); setBrandSearch(""); setBrandOpen(false); setImei(""); setImeiStatus("idle"); }}
                        >
                          {b}
                        </button>
                      ))}
                      {filteredBrands.length === 0 && (
                        <p className="px-4 py-3 text-sm text-muted-foreground">Олдсон байхгүй</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Дуудлага худалдаа үргэлжлэх хугацаа (Цаг)</Label>
              <Select>
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
              Компьютерээс зураг сонгоно уу (JPG, PNG, GIF - хамгийн ихдээ 5MB)
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            multiple
            className="hidden"
            onChange={onFileChange}
          />

          {/* Thumbnail grid + add button */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`rounded-lg border-2 border-dashed transition-colors p-3 ${
              dragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            {previews.length === 0 ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-40 cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-muted-foreground">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Зураг нэмэх</p>
                <p className="text-xs text-muted-foreground">Эсвэл зургийг энд чирээд тавина уу</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0">
                    <Image src={src} alt={`preview-${idx}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-blue-600 text-white py-0.5">
                        Голлогч зураг
                      </span>
                    )}
                  </div>
                ))}
                {previews.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:bg-muted/40 transition-colors flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Нэмэх</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Дээж {previews.length}/10 зураг нэмэгдсэн. Анхны зураг голлогч зураг болно.
          </p>
        </CardContent>
      </Card>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/products")}>
          Cancel
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
          Бүтээгдэхүүн нэмэх
        </Button>
      </div>
    </div>
  );
}
