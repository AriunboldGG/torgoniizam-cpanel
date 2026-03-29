"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Status = "ACTIVE" | "ENDED" | "PENDING";

interface Product {
  id: string;
  auctionId: string;
  name: string;
  description: string;
  images: string[];
  status: Status;
  yourPrice: number;
  highestBid: number;
  bids: number;
  category: string;
  created: string;
  auctionEnds: string;
  seller: string;
}

const products: Product[] = [
  {
    id: "1",
    auctionId: "AU-20240115-103045",
    name: "Gold Ring",
    description: "Beautiful 18k gold ring with diamond",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
      "https://images.unsplash.com/photo-1573408301185-9519f94815b3?w=600&q=80",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
    ],
    status: "ACTIVE",
    yourPrice: 2500000,
    highestBid: 2800000,
    bids: 12,
    category: "ҮНЭТ ЭДЛЭЛ",
    created: "January 15, 2024 at 08:00 AM",
    auctionEnds: "February 15, 2024 at 06:00 PM",
    seller: "Алтан Шармал Дэлгүүр",
  },
  {
    id: "2",
    auctionId: "AU-20240110-142218",
    name: "iPhone 15 Pro",
    description: "Latest iPhone with advanced features",
    images: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80",
    ],
    status: "ENDED",
    yourPrice: 1500000,
    highestBid: 1800000,
    bids: 8,
    category: "ГАР УТАС & ТАБЛЕТ",
    created: "January 10, 2024 at 02:22 PM",
    auctionEnds: "February 10, 2024 at 06:00 PM",
    seller: "Техно Дэлгүүр",
  },
  {
    id: "3",
    auctionId: "AU-20240120-091533",
    name: "MacBook Pro",
    description: "High-performance laptop for professionals",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
    ],
    status: "ACTIVE",
    yourPrice: 800000,
    highestBid: 950000,
    bids: 5,
    category: "КОМПЬЮТЕР",
    created: "January 20, 2024 at 09:15 AM",
    auctionEnds: "February 20, 2024 at 06:00 PM",
    seller: "Компьютер Маркет",
  },
  {
    id: "4",
    auctionId: "AU-20240118-073011",
    name: "Vintage Watch",
    description: "Rare vintage Swiss timepiece",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80",
      "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&q=80",
    ],
    status: "PENDING",
    yourPrice: 3200000,
    highestBid: 3200000,
    bids: 0,
    category: "ҮНЭТ ЭДЛЭЛ",
    created: "January 18, 2024 at 07:30 AM",
    auctionEnds: "February 18, 2024 at 06:00 PM",
    seller: "Классик Дэлгүүр",
  },
  {
    id: "5",
    auctionId: "AU-20240122-110455",
    name: "Sony 4K TV",
    description: "65-inch 4K OLED Smart Television",
    images: [
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80",
    ],
    status: "ENDED",
    yourPrice: 1200000,
    highestBid: 1450000,
    bids: 15,
    category: "ЦАХИЛГААН БАРАА",
    created: "January 22, 2024 at 11:04 AM",
    auctionEnds: "February 22, 2024 at 06:00 PM",
    seller: "Электро Дэлгүүр",
  },
  {
    id: "6",
    auctionId: "AU-20240125-084322",
    name: "Diamond Necklace",
    description: "Elegant diamond necklace with earrings set",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80",
    ],
    status: "ACTIVE",
    yourPrice: 5500000,
    highestBid: 6200000,
    bids: 21,
    category: "ҮНЭТ ЭДЛЭЛ",
    created: "January 25, 2024 at 08:43 AM",
    auctionEnds: "February 25, 2024 at 06:00 PM",
    seller: "Алмаз Дэлгүүр",
  },
];

const statusStyles: Record<Status, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-emerald-500", text: "text-white" },
  ENDED: { bg: "bg-blue-600", text: "text-white" },
  PENDING: { bg: "bg-yellow-400", text: "text-black" },
};

const categories = [
  { value: "All Categories", label: "All Categories" },
  { value: "АВТОМАШИН", label: "АВТОМАШИН (Car)" },
  { value: "ГАР УТАС & ТАБЛЕТ", label: "ГАР УТАС & ТАБЛЕТ (Mobile Phone & Tablet)" },
  { value: "КОМПЬЮТЕР", label: "КОМПЬЮТЕР (Computer)" },
  { value: "ҮНЭТ ЭДЛЭЛ", label: "ҮНЭТ ЭДЛЭЛ (Jewelry)" },
  { value: "ЦАХИЛГААН БАРАА", label: "ЦАХИЛГААН БАРАА (Electronics)" },
];

function formatMNT(n: number) {
  return "MNT " + n.toLocaleString("mn-MN");
}

export default function ProductListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("All Categories");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.auctionId.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "all" || p.status === status;
    const matchCat = category === "All Categories" || p.category === category;
    return matchSearch && matchStatus && matchCat;
  });

  function openModal(product: Product) {
    setSelectedProduct(product);
    setActiveImageIndex(0);
  }

  function closeModal() {
    setSelectedProduct(null);
  }

  function prevImage() {
    if (!selectedProduct) return;
    setActiveImageIndex((i) =>
      i === 0 ? selectedProduct.images.length - 1 : i - 1
    );
  }

  function nextImage() {
    if (!selectedProduct) return;
    setActiveImageIndex((i) =>
      i === selectedProduct.images.length - 1 ? 0 : i + 1
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Product List</h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium mb-1.5">Search Products</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or description..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">Status</p>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ENDED">Ended</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">Category</p>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "All Categories")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
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
        </CardContent>
      </Card>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No products found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => {
            const badge = statusStyles[product.status];
            return (
              <Card key={product.id} className="overflow-hidden p-0">
                {/* Image */}
                <div className="relative h-60 w-full bg-muted">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span
                    className={`absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                  >
                    {product.status}
                  </span>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-orange-500 mb-1">
                      {product.auctionId}
                    </p>
                    <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                    <p className="text-sm text-blue-500 mt-0.5">{product.description}</p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Price:</span>
                      <span className="font-medium">{formatMNT(product.yourPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Highest Bid:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatMNT(product.highestBid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bids:</span>
                      <span className="font-medium">{product.bids}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium text-right">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">{product.created}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => openModal(product)}
                  >
                    Дэлгэрэнгүй үзэх
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="!max-w-3xl w-full p-0 overflow-hidden overflow-y-auto max-h-[90vh]">
          {selectedProduct && (() => {
            const badge = statusStyles[selectedProduct.status];
            return (
              <>
                <DialogHeader className="px-6 pt-5 pb-0">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-bold">
                      Дуудлага худалдааны дэлгэрэнгүй
                    </DialogTitle>
                  </div>
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-6 p-6 pt-4">
                  {/* Left: Image gallery */}
                  <div className="flex-shrink-0 w-full md:w-[320px] space-y-2">
                    {/* Main image */}
                    <div
                      className="relative h-64 w-full bg-muted rounded-lg overflow-hidden group cursor-zoom-in"
                      onClick={() => setZoomedImage(selectedProduct.images[activeImageIndex])}
                    >
                      <Image
                        src={selectedProduct.images[activeImageIndex]}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        unoptimized
                      />
                      {/* Click to zoom overlay */}
                      <div className="absolute inset-0 flex items-start justify-end p-2 pointer-events-none">
                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          <ZoomIn className="w-3 h-3" />
                          Click to zoom
                        </span>
                      </div>
                      {/* Prev/Next arrows */}
                      {selectedProduct.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {/* Counter */}
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                        {activeImageIndex + 1}/{selectedProduct.images.length}
                      </div>
                    </div>

                    {/* Thumbnails */}
                    {selectedProduct.images.length > 1 && (
                      <div className="flex gap-2 flex-wrap">
                        {selectedProduct.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative w-14 h-14 rounded overflow-hidden border-2 transition-colors ${
                              idx === activeImageIndex
                                ? "border-blue-600"
                                : "border-transparent hover:border-gray-400"
                            }`}
                          >
                            <Image
                              src={img}
                              alt={`${selectedProduct.name} ${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 space-y-4 min-w-0">
                    {/* Status badge */}
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}
                    >
                      {selectedProduct.status}
                    </span>

                    {/* Name & description */}
                    <div>
                      <h2 className="text-2xl font-bold leading-tight">
                        {selectedProduct.name}
                      </h2>
                      <p className="text-sm text-blue-500 mt-1">
                        {selectedProduct.description}
                      </p>
                    </div>

                    {/* Auction Information box */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <p className="font-semibold text-sm">Auction Information</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Starting Price</p>
                          <p className="font-bold text-base">{formatMNT(selectedProduct.yourPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Current Bid</p>
                          <p className="font-bold text-base text-emerald-600">
                            {formatMNT(selectedProduct.highestBid)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Total Bids</p>
                          <p className="font-bold text-base">{selectedProduct.bids}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Category</p>
                          <p className="font-bold text-base">{selectedProduct.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Seller & Dates */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seller</span>
                        <span className="font-medium">{selectedProduct.seller}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">{selectedProduct.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auction Ends</span>
                        <span className="font-medium">{selectedProduct.auctionEnds}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Fullscreen zoom overlay */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
