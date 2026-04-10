import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ASSETS_BASE = "https://assets.torgoniizam.mn";

/** Prepend the CDN base to a relative image path from the backend.
 *  If the path is already an absolute URL it is returned unchanged. */
export function assetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ASSETS_BASE}/${path.replace(/^\//, "")}`;
}
