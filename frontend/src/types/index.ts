export interface User {
  id: number;
  name: string | null;
  phone: string;
  role: "client" | "barber" | "admin";
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration: number;
}

export interface Barber {
  id: number;
  name: string | null;
  phone: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface Appointment {
  id: number;
  dateTime: string;
  status: AppointmentStatus;
  createdAt: string;
  user: Pick<User, "id" | "name" | "phone">;
  barber: Pick<Barber, "id" | "name">;
  service: Pick<Service, "id" | "name" | "price" | "duration">;
}

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Stats {
  today: { appointments: number };
  week: { revenue: number; appointments: number };
  month: { revenue: number; appointments: number };
  topService: string | null;
  totalClients: number;
  barberLoad: { barberId: number; name: string; appointments: number }[];
}
