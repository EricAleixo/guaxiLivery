import { Bike, Car, Footprints, Motorbike, Scooter, type LucideIcon } from "lucide-react";
import type { VehicleType } from "@/lib/api";

const ICONS: Record<VehicleType, LucideIcon> = {
  BICICLETA: Bike, MOTO: Motorbike, CARRO: Car, A_PE: Footprints, OUTRO: Scooter,
};

/** Ícone do tipo de veículo (em vez do emoji de VEHICLES). */
export function VehicleIcon({ type, size = 16, className }: { type: VehicleType; size?: number; className?: string }) {
  const Icon = ICONS[type];
  return <Icon size={size} className={className} aria-hidden />;
}
