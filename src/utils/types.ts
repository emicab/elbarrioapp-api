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

export type CreateEventData = {
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
};

export type CreateCompanyData = {
  name: string;
  city: string;
  description?: string;
  adminId: string; // El ID del usuario que será el "dueño" de esta empresa en la app
};