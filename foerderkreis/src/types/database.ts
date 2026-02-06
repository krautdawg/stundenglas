export type UserRole = "parent" | "admin" | "circle_lead";
export type JobUrgency = "low" | "normal" | "high" | "critical";
export type JobStatus =
  | "open"
  | "claimed"
  | "in_progress"
  | "completed"
  | "cancelled";
export type ClaimStatus = "claimed" | "completed" | "withdrawn";
export type KreisMemberRole = "member" | "lead";

export interface Family {
  id: string;
  name: string;
  monthly_hour_target: number;
  yearly_legal_minimum: number;
  hourly_compensation_rate: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  family_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  skill_tags: string[];
  role: UserRole;
  privacy_mode: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Kreis {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KreisMembership {
  user_id: string;
  kreis_id: string;
  role: KreisMemberRole;
  joined_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  kreis_id: string | null;
  posted_by: string;
  estimated_hours: number;
  urgency: JobUrgency;
  status: JobStatus;
  location: string | null;
  skills_needed: string[];
  due_date: string | null;
  max_claimants: number;
  created_at: string;
  updated_at: string;
}

export interface JobClaim {
  id: string;
  job_id: string;
  user_id: string;
  status: ClaimStatus;
  claimed_at: string;
  completed_at: string | null;
}

export interface VolunteerHours {
  id: string;
  user_id: string;
  family_id: string;
  kreis_id: string | null;
  job_id: string | null;
  hours: number;
  description: string;
  date_performed: string;
  flagged: boolean;
  created_at: string;
}

export interface EmailOutreachLog {
  id: string;
  family_id: string;
  email_type: string;
  subject: string;
  sent_at: string;
  metadata: Record<string, unknown> | null;
}

// Joined types for UI
export interface JobWithKreis extends Job {
  kreis: Pick<Kreis, "name" | "slug" | "color"> | null;
  posted_by_user: Pick<User, "first_name" | "last_name" | "avatar_url">;
  claim_count: number;
}

export interface VolunteerHoursWithDetails extends VolunteerHours {
  kreis: Pick<Kreis, "name" | "slug" | "color"> | null;
  user: Pick<User, "first_name" | "last_name">;
}

export interface FamilyWithStats extends Family {
  members: Pick<User, "id" | "first_name" | "last_name" | "avatar_url">[];
  total_hours_this_month: number;
  total_hours_this_year: number;
}

export interface LeaderboardEntry {
  family_id: string;
  family_name: string;
  total_hours: number;
  privacy_mode: boolean;
}
