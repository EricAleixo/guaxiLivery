import type { CompanyLink, Delivery } from "./api";

const ON_RIDE = ["ACEITO", "EM_ROTA"];

/** Corrida em andamento de um motoboy (ignorando, se informado, o próprio pedido em questão). */
export const rideOf = (deliveries: Delivery[] | null, courierId: string, except?: string) =>
  deliveries?.find((d) => d.courier?.id === courierId && ON_RIDE.includes(d.status) && d.id !== except);

/** Motoboys ativos, com os livres primeiro (depois por nome). */
export function activeCouriers(links: CompanyLink[] | null, deliveries: Delivery[] | null, except?: string) {
  return (links ?? [])
    .filter((l) => l.status === "ATIVO")
    .map((l) => ({ link: l, courier: l.courier, ride: rideOf(deliveries, l.courier.id, except) }))
    .sort((a, b) => Number(!!a.ride) - Number(!!b.ride) || a.courier.name.localeCompare(b.courier.name, "pt-BR"));
}

export const busyWarning = (name: string, ride: Delivery) =>
  `Atenção: ${name} já está em uma corrida (${ride.quantity}× ${ride.foodName}).\n\nAtribuir este pedido mesmo assim?`;
