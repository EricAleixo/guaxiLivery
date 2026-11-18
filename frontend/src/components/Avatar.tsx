import { uploadSrc } from "@/lib/api";
import { Raccoon } from "./Logo";

export function Avatar({ url, name, className = "h-10 w-10" }: { url?: string | null; name?: string; className?: string }) {
  const src = uploadSrc(url);
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt={name ? `Foto de ${name}` : ""} className={`${className} shrink-0 rounded-full object-cover`} />;
  return <Raccoon className={`${className} shrink-0 rounded-full`} />;
}
