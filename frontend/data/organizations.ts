export interface Organization {
  id: string;
  name: string;
  type: "NGO" | "Government" | "Community" | "International";
  locality: string;
  description: string;
  mission: string;
  trustScore: number; // 0-100
  totalDonations: number;
  activeFunds: number;
  completedProjects: number;
  beneficiaries: number;
  founded: string;
  logo: string;
  banner?: string;
  contactEmail: string;
  website: string;
  verified: boolean;
  reviews: Review[];
  registeredBy?: string;
  registeredAt?: string;
}

export interface Review {
  id: string;
  donor: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  donationAmount: number;
}

// Organizations are now fetched from backend API (Pinata IPFS)
// No local mock data needed
