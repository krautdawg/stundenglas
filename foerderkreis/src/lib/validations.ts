import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gueltige E-Mail-Adresse ein"),
});

export const profileSchema = z.object({
  first_name: z
    .string()
    .min(1, "Vorname ist erforderlich")
    .max(50, "Maximal 50 Zeichen"),
  last_name: z
    .string()
    .min(1, "Nachname ist erforderlich")
    .max(50, "Maximal 50 Zeichen"),
  bio: z.string().max(500, "Maximal 500 Zeichen").optional(),
  skill_tags: z.array(z.string()).max(10, "Maximal 10 Skills"),
});

export const familyCreateSchema = z.object({
  name: z
    .string()
    .min(2, "Familienname muss mindestens 2 Zeichen haben")
    .max(100, "Maximal 100 Zeichen"),
});

export const familyJoinSchema = z.object({
  invite_code: z
    .string()
    .min(6, "Einladungscode muss mindestens 6 Zeichen haben"),
});

export const logHoursSchema = z.object({
  date_performed: z.string().min(1, "Datum ist erforderlich"),
  hours: z
    .number()
    .min(0.25, "Mindestens 0,25 Stunden")
    .max(24, "Maximal 24 Stunden pro Eintrag")
    .multipleOf(0.25, "Stunden muessen in 0,25er Schritten sein"),
  description: z
    .string()
    .min(3, "Beschreibung muss mindestens 3 Zeichen haben")
    .max(500, "Maximal 500 Zeichen"),
  kreis_id: z.string().uuid().optional().nullable(),
});

export const jobSchema = z.object({
  title: z
    .string()
    .min(3, "Titel muss mindestens 3 Zeichen haben")
    .max(200, "Maximal 200 Zeichen"),
  description: z.string().max(2000, "Maximal 2000 Zeichen").optional(),
  kreis_id: z.string().uuid().optional().nullable(),
  estimated_hours: z
    .number()
    .min(0.25, "Mindestens 0,25 Stunden")
    .max(100, "Maximal 100 Stunden"),
  urgency: z.enum(["low", "normal", "high", "critical"]),
  location: z.string().max(200).optional(),
  skills_needed: z.array(z.string()).max(10).optional(),
  due_date: z.string().optional().nullable(),
  max_claimants: z.number().int().min(1).max(50).default(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type FamilyCreateInput = z.infer<typeof familyCreateSchema>;
export type FamilyJoinInput = z.infer<typeof familyJoinSchema>;
export type LogHoursInput = z.infer<typeof logHoursSchema>;
export type JobInput = z.infer<typeof jobSchema>;
