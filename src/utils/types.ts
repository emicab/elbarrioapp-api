export type UpdateProfileData = {
  bio?: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  email: string;
  avatarUrl?: string;
  city?: string;
  hometown?: string;
  dateOfBirth?: String;
  showInfo?: boolean;
  skills?: string[];
  jobSeeking?: string;
  cvUrl?: string;
}

type TicketTypeInput = {
  currency: string;
  name: string;
  priceInCents: number;
  quantity: number;
};

export type CreateEventData = {
  place: string;
  longitude: number;
  latitude: number;
  title: string;
  description: string;
  date: string;
  city: string;
  address: string;
  price?: number;
  organizerId: string;
  companyId: string;
  tickets?: TicketTypeInput[]
};

export type CreateCompanyData = {
  name: string;
  city: string;
  description?: string;
  adminId: string; // El ID del usuario que será el "dueño" de esta empresa en la app
};