export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Role = "CLIENTE" | "EMPRESA";
export type DeliveryStatus = "PENDENTE" | "ACEITO" | "EM_ROTA" | "ENTREGUE" | "CANCELADO";

export type ProductCategory = "LANCHE" | "PIZZA" | "MARMITA" | "DOCE" | "BEBIDA" | "SAUDAVEL" | "OUTROS";
export interface Media { id: number; url: string; type: "IMAGE" | "VIDEO" }
export interface Product {
  id: number; name: string; description: string | null; price: number; category: ProductCategory;
  imageUrl: string | null; media: Media[]; available: boolean; createdAt: string;
}

export interface User { id: number; name: string; email: string; role: Role; companyId: number | null; avatarUrl: string | null }
export interface AuthResponse { token: string; user: User }
export interface Company { id: number; tradeName: string; phone: string | null; address: string | null; description: string | null; logoUrl: string | null }
export interface Delivery {
  id: number; foodName: string; description: string | null; quantity: number;
  pickupAddress: string; deliveryAddress: string; imageUrl: string | null; status: DeliveryStatus;
  clientName: string; company: Company | null; createdAt: string; productId: number | null; reviewed: boolean;
}

export interface FeedItem { product: Product; company: Company; ratingAvg: number | null; ratingCount: number }
export interface Review {
  id: number; rating: number; comment: string | null; clientName: string; clientAvatarUrl: string | null;
  productId: number; productName: string; createdAt: string;
}
export interface ProductReviews { average: number | null; count: number; reviews: Review[] }
export interface Profile {
  name: string; email: string; role: Role; avatarUrl: string | null; phone: string | null; address: string | null;
  tradeName: string | null; cnpj: string | null; description: string | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

const TOKEN_KEY = "guaxi:token";
export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch {} },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch {} },
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Não consegui falar com o servidor. O back end está rodando?");
  }
  if (!res.ok) {
    let body: { message?: string; fields?: Record<string, string> } = {};
    try { body = await res.json(); } catch {}
    const fallback = res.status === 401 ? "Sessão expirada. Entre novamente." : res.status === 403 ? "Você não tem permissão para isso." : "Algo deu errado.";
    throw new ApiError(res.status, body.message ?? fallback, body.fields);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  registerClient: (b: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/api/auth/register/client", { method: "POST", body: JSON.stringify(b) }),
  registerCompany: (b: Record<string, string | undefined>) =>
    request<AuthResponse>("/api/auth/register/company", { method: "POST", body: JSON.stringify(b) }),
  me: () => request<User>("/api/auth/me"),
  companies: () => request<Company[]>("/api/companies"),
  myDeliveries: () => request<Delivery[]>("/api/deliveries/mine"),
  availableDeliveries: () => request<Delivery[]>("/api/deliveries/available"),
  createDelivery: (form: FormData) => request<Delivery>("/api/deliveries", { method: "POST", body: form }),
  feed: () => request<FeedItem[]>("/api/products/feed"),
  order: (b: { productId: number; quantity: number; deliveryAddress: string; description?: string }) =>
    request<Delivery>("/api/deliveries/order", { method: "POST", body: JSON.stringify(b) }),
  profile: () => request<Profile>("/api/profile"),
  updateProfile: (form: FormData) => request<Profile>("/api/profile", { method: "PUT", body: form }),
  createReview: (b: { deliveryId: number; rating: number; comment?: string }) =>
    request<Review>("/api/reviews", { method: "POST", body: JSON.stringify(b) }),
  productReviews: (id: number) => request<ProductReviews>(`/api/products/${id}/reviews`),
  companyReviews: () => request<Review[]>("/api/reviews/company"),
  myProducts: () => request<Product[]>("/api/products/mine"),
  createProduct: (form: FormData) => request<Product>("/api/products", { method: "POST", body: form }),
  updateProduct: (id: number, form: FormData) => request<Product>(`/api/products/${id}`, { method: "PUT", body: form }),
  setProductAvailable: (id: number, available: boolean) =>
    request<Product>(`/api/products/${id}/availability`, { method: "PATCH", body: JSON.stringify({ available }) }),
  deleteProduct: (id: number) => request<void>(`/api/products/${id}`, { method: "DELETE" }),
  updateStatus: (id: number, status: DeliveryStatus) =>
    request<Delivery>(`/api/deliveries/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

export const imageSrc = (d: Pick<Delivery, "imageUrl">) => (d.imageUrl ? `${API_URL}${d.imageUrl}` : "");

/** Lista de mídias do produto; cai na foto antiga (imageUrl) se o back end for de uma versão sem `media`. */
export const mediaOf = (p: { media?: Media[]; imageUrl: string | null; id: number }): Media[] =>
  p.media ?? (p.imageUrl ? [{ id: p.id, url: p.imageUrl, type: "IMAGE" }] : []);

export const productImage = (p: Pick<Product, "imageUrl">) => (p.imageUrl ? `${API_URL}${p.imageUrl}` : null);

export const uploadSrc = (url: string | null | undefined) => (url ? `${API_URL}${url}` : null);
