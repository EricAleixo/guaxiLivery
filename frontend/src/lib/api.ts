export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Role = "CLIENTE" | "EMPRESA" | "ENTREGADOR";
export type DeliveryStatus = "PENDENTE" | "ACEITO" | "EM_ROTA" | "ENTREGUE" | "CANCELADO";

export type ProductCategory = "LANCHE" | "PIZZA" | "MARMITA" | "DOCE" | "BEBIDA" | "SAUDAVEL" | "OUTROS";
export interface Media { id: string; url: string; type: "IMAGE" | "VIDEO" }
export interface Product {
  id: string; name: string; description: string | null; price: number; category: ProductCategory;
  imageUrl: string | null; media: Media[]; available: boolean; createdAt: string;
}

export interface User { id: string; name: string; email: string; role: Role; companyId: string | null; avatarUrl: string | null }
export interface AuthResponse { token: string; user: User }
export interface Company { id: string; tradeName: string; phone: string | null; address: string | null; description: string | null; logoUrl: string | null }
export interface Delivery {
  id: string; foodName: string; description: string | null; quantity: number;
  pickupAddress: string; deliveryAddress: string; imageUrl: string | null; status: DeliveryStatus;
  clientName: string; company: Company | null; createdAt: string; productId: string | null; reviewed: boolean;
  courier: CourierBrief | null;
}

export interface FeedItem { product: Product; company: Company; ratingAvg: number | null; ratingCount: number }
export interface Review {
  id: string; rating: number; comment: string | null; clientName: string; clientAvatarUrl: string | null;
  productId: string; productName: string; createdAt: string;
}
export interface ProductReviews { average: number | null; count: number; reviews: Review[] }
export interface Profile {
  name: string; email: string; role: Role; avatarUrl: string | null; phone: string | null; address: string | null;
  tradeName: string | null; cnpj: string | null; description: string | null;
}


// ---------------- Financeiro ----------------
export type ExpenseGroup = "INGREDIENTES" | "EMBALAGENS" | "FUNCIONARIOS" | "ESTABELECIMENTO" | "DELIVERY" | "MARKETING" | "IMPOSTOS" | "TECNOLOGIA" | "EQUIPAMENTOS" | "OUTROS";
export type PaymentMethod = "DINHEIRO" | "PIX" | "CARTAO_DEBITO" | "CARTAO_CREDITO" | "BOLETO" | "TRANSFERENCIA" | "OUTRO";
export type ExpenseType = "FIXA" | "VARIAVEL";
export type ExpenseStatus = "PAGO" | "PENDENTE";
export type ExpenseRecurrence = "NENHUMA" | "SEMANAL" | "MENSAL" | "ANUAL";
export interface RevenueSummary {
  orders: number; ordersWithoutValue: number; itemsSold: number; canceledOrders: number;
  itemsSubtotal: number; deliveryFees: number; gross: number; discounts: number; salesFees: number; net: number; averageTicket: number | null;
}
export interface DailyPoint { date: string; gross: number; net: number; orders: number }
export interface ProductSales { name: string; productId: string | null; quantity: number; orders: number; gross: number }
export interface FinancialOrder {
  id: string; foodName: string; quantity: number; clientName: string; finalizedAt: string;
  unitPrice: number | null; itemsSubtotal: number | null; deliveryFee: number | null; discount: number | null; paymentFee: number | null;
  gross: number | null; net: number | null; hasValue: boolean; adjusted: boolean;
}
export interface RevenueResponse { from: string; to: string; summary: RevenueSummary; daily: DailyPoint[]; products: ProductSales[]; orders: FinancialOrder[] }
export interface OrderAdjustmentRequest { itemsSubtotal?: number | null; deliveryFee: number; discount: number; paymentFee: number; reason?: string }
export interface OrderAdjustment {
  id: string; changedBy: string; createdAt: string; reason: string | null;
  previousItemsSubtotal: number | null; newItemsSubtotal: number | null; previousDeliveryFee: number | null; newDeliveryFee: number | null;
  previousDiscount: number | null; newDiscount: number | null; previousPaymentFee: number | null; newPaymentFee: number | null;
}
export interface ExpenseRequest {
  description: string; group: ExpenseGroup; subcategory: string; amount: number; expenseDate: string; dueDate?: string | null;
  paidAt?: string | null; paymentMethod: PaymentMethod; supplier?: string | null; notes?: string | null;
  type: ExpenseType; status: ExpenseStatus; recurrence: ExpenseRecurrence;
}
export interface Expense extends Omit<ExpenseRequest, "dueDate" | "paidAt" | "supplier" | "notes"> {
  id: string; groupLabel: string; dueDate: string | null; paidAt: string | null; supplier: string | null; notes: string | null;
  recurrenceParentId: string | null; overdue: boolean;
}
export interface ExpenseCategory { group: ExpenseGroup; label: string; stock: boolean; subcategories: string[] }
export interface SubcategoryTotal { subcategory: string; total: number }
export interface GroupTotal { group: ExpenseGroup; label: string; total: number; paid: number; pending: number; subcategories: SubcategoryTotal[] }
export interface ExpenseSummary { count: number; total: number; paid: number; pending: number; overdue: number; fixed: number; variable: number; byGroup: GroupTotal[] }
export interface ResultSummary { netRevenue: number; costOfGoods: number; costOfGoodsMethod: string; operatingExpenses: number; profit: number; marginPercent: number | null }
export interface CashFlow { inflow: number; outflow: number; balance: number; pendingCommitments: number }
export interface Overview { from: string; to: string; revenue: RevenueSummary; expenses: ExpenseSummary; result: ResultSummary; cashFlow: CashFlow }
export interface MonthPoint { month: string; gross: number; net: number; orders: number; expenses: number; paidExpenses: number; pendingExpenses: number; profit: number; marginPercent: number | null }
export interface Reports { from: string; to: string; months: MonthPoint[]; daily: DailyPoint[]; byGroup: GroupTotal[] }

export interface Range { from?: string; to?: string }
const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : "";
};


// ---------------- Entregadores ----------------
export type VehicleType = "BICICLETA" | "MOTO" | "CARRO" | "A_PE" | "OUTRO";
export type CourierLinkStatus = "CANDIDATURA" | "CONVITE" | "ATIVO" | "RECUSADO" | "ENCERRADO";
export interface CourierBrief { id: string; name: string; phone: string | null; vehicleType: VehicleType; vehiclePlate: string | null; vehicleModel: string | null; vehicleColor: string | null; avatarUrl: string | null }
export interface CourierInfo {
  id: string; name: string; email: string; phone: string | null; cpf: string; vehicleType: VehicleType;
  vehiclePlate: string | null; vehicleModel: string | null; vehicleColor: string | null; cnh: string | null; avatarUrl: string | null;
}
export interface CourierProfileRequest {
  name: string; phone: string; cpf: string; vehicleType: VehicleType; vehiclePlate?: string; vehicleModel?: string; vehicleColor?: string; cnh?: string;
}
export interface CourierRegisterRequest extends CourierProfileRequest { email: string; password: string; companyIds?: string[] }
export interface CompanyCourierRequest extends Partial<CourierProfileRequest> { email: string; password?: string }
export interface CompanyLink { id: string; status: CourierLinkStatus; updatedAt: string; courier: CourierInfo }
export interface CourierCompany { company: Company; linkId: string | null; status: CourierLinkStatus | null }

export const VEHICLES: Record<VehicleType, { label: string; emoji: string; motorized: boolean }> = {
  BICICLETA: { label: "Bicicleta", emoji: "🚲", motorized: false },
  MOTO: { label: "Moto", emoji: "🏍️", motorized: true },
  CARRO: { label: "Carro", emoji: "🚗", motorized: true },
  A_PE: { label: "A pé", emoji: "🚶", motorized: false },
  OUTRO: { label: "Outro", emoji: "🛵", motorized: false },
};

export type ChatChannel = "EMPRESA" | "ENTREGADOR";
export interface ChatMessage {
  id: string; deliveryId: string; channel: ChatChannel; senderId: string; recipientId: string; senderName: string;
  content: string; createdAt: string; read: boolean; foodName: string; quantity: number;
}
export interface ChatParty { userId: string; name: string; avatarUrl: string | null; role: string; canSend: boolean }
export interface ChatThread { party: ChatParty; messages: ChatMessage[] }
/** Uma conversa por pessoa/empresa (reúne todos os pedidos entre elas). */
export interface Conversation {
  otherId: string; channel: ChatChannel; foodName: string; quantity: number; status: DeliveryStatus; orders: number;
  other: ChatParty; last: ChatMessage | null; unread: number; updatedAt: string;
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
  order: (b: { productId: string; quantity: number; deliveryAddress: string; description?: string }) =>
    request<Delivery>("/api/deliveries/order", { method: "POST", body: JSON.stringify(b) }),
  profile: () => request<Profile>("/api/profile"),
  updateProfile: (form: FormData) => request<Profile>("/api/profile", { method: "PUT", body: form }),
  createReview: (b: { deliveryId: string; rating: number; comment?: string }) =>
    request<Review>("/api/reviews", { method: "POST", body: JSON.stringify(b) }),
  productReviews: (id: string) => request<ProductReviews>(`/api/products/${id}/reviews`),
  companyReviews: () => request<Review[]>("/api/reviews/company"),
  myProducts: () => request<Product[]>("/api/products/mine"),
  createProduct: (form: FormData) => request<Product>("/api/products", { method: "POST", body: form }),
  updateProduct: (id: string, form: FormData) => request<Product>(`/api/products/${id}`, { method: "PUT", body: form }),
  setProductAvailable: (id: string, available: boolean) =>
    request<Product>(`/api/products/${id}/availability`, { method: "PATCH", body: JSON.stringify({ available }) }),
  deleteProduct: (id: string) => request<void>(`/api/products/${id}`, { method: "DELETE" }),
  financeOverview: (r: Range) => request<Overview>(`/api/finance/overview${qs({ ...r })}`),
  financeRevenue: (r: Range) => request<RevenueResponse>(`/api/finance/revenue${qs({ ...r })}`),
  financeReports: (r: Range) => request<Reports>(`/api/finance/reports${qs({ ...r })}`),
  adjustOrder: (id: string, b: OrderAdjustmentRequest) =>
    request<FinancialOrder>(`/api/finance/orders/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
  orderAdjustments: (id: string) => request<OrderAdjustment[]>(`/api/finance/orders/${id}/adjustments`),
  expenseCategories: () => request<ExpenseCategory[]>("/api/finance/expenses/categories"),
  expenses: (r: Range & { group?: string; status?: string }) => request<Expense[]>(`/api/finance/expenses${qs({ ...r })}`),
  createExpense: (b: ExpenseRequest) => request<Expense>("/api/finance/expenses", { method: "POST", body: JSON.stringify(b) }),
  updateExpense: (id: string, b: ExpenseRequest) => request<Expense>(`/api/finance/expenses/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  setExpenseStatus: (id: string, status: ExpenseStatus, paidAt?: string) =>
    request<Expense>(`/api/finance/expenses/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, paidAt }) }),
  deleteExpense: (id: string) => request<void>(`/api/finance/expenses/${id}`, { method: "DELETE" }),
  registerCourier: (b: CourierRegisterRequest) =>
    request<AuthResponse>("/api/auth/register/courier", { method: "POST", body: JSON.stringify(b) }),
  courierProfile: () => request<CourierInfo>("/api/courier/profile"),
  updateCourierProfile: (b: CourierProfileRequest) => request<CourierInfo>("/api/courier/profile", { method: "PUT", body: JSON.stringify(b) }),
  courierCompanies: () => request<CourierCompany[]>("/api/courier/companies"),
  courierApply: (companyId: string) => request<CourierCompany>(`/api/courier/companies/${companyId}/apply`, { method: "POST" }),
  courierAnswerInvite: (linkId: string, accept: boolean) => request<CourierCompany>(`/api/courier/links/${linkId}/${accept ? "accept" : "decline"}`, { method: "POST" }),
  courierLeave: (linkId: string) => request<CourierCompany>(`/api/courier/links/${linkId}`, { method: "DELETE" }),
  courierAvailable: () => request<Delivery[]>("/api/courier/deliveries/available"),
  courierMine: () => request<Delivery[]>("/api/courier/deliveries/mine"),
  courierClaim: (id: string) => request<Delivery>(`/api/courier/deliveries/${id}/claim`, { method: "POST" }),
  courierRelease: (id: string) => request<Delivery>(`/api/courier/deliveries/${id}/release`, { method: "POST" }),
  courierStatus: (id: string, status: DeliveryStatus) =>
    request<Delivery>(`/api/courier/deliveries/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  chats: () => request<Conversation[]>("/api/chats"),
  chatByDelivery: (d: string, c: ChatChannel) => request<ChatParty>(`/api/chats/by-delivery/${d}/${c}`),
  chatThread: (other: string, c: ChatChannel) => request<ChatThread>(`/api/chats/with/${other}/${c}`),
  chatSend: (other: string, c: ChatChannel, content: string) =>
    request<ChatMessage>(`/api/chats/with/${other}/${c}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
  chatRead: (other: string, c: ChatChannel) => request<void>(`/api/chats/with/${other}/${c}/read`, { method: "POST" }),
  companyCouriers: () => request<CompanyLink[]>("/api/company/couriers"),
  companyAddCourier: (b: CompanyCourierRequest) => request<CompanyLink>("/api/company/couriers", { method: "POST", body: JSON.stringify(b) }),
  companyDecideCourier: (linkId: string, approve: boolean) => request<CompanyLink>(`/api/company/couriers/${linkId}/${approve ? "approve" : "reject"}`, { method: "POST" }),
  companyEndCourier: (linkId: string) => request<CompanyLink>(`/api/company/couriers/${linkId}`, { method: "DELETE" }),
  assignCourier: (deliveryId: string, courierId: string | null) =>
    request<Delivery>(`/api/company/deliveries/${deliveryId}/courier`, { method: "PUT", body: JSON.stringify({ courierId }) }),
  updateStatus: (id: string, status: DeliveryStatus) =>
    request<Delivery>(`/api/deliveries/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

export const imageSrc = (d: Pick<Delivery, "imageUrl">) => (d.imageUrl ? `${API_URL}${d.imageUrl}` : "");

/** Lista de mídias do produto; cai na foto antiga (imageUrl) se o back end for de uma versão sem `media`. */
export const mediaOf = (p: { media?: Media[]; imageUrl: string | null; id: string }): Media[] =>
  p.media ?? (p.imageUrl ? [{ id: p.id, url: p.imageUrl, type: "IMAGE" }] : []);

export const productImage = (p: Pick<Product, "imageUrl">) => (p.imageUrl ? `${API_URL}${p.imageUrl}` : null);

export const uploadSrc = (url: string | null | undefined) => (url ? `${API_URL}${url}` : null);
