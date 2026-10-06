// PracticumOS Universal Personas & Auth Role Catalog

export type DemoPersonaKey = "admin" | "student" | "field" | "faculty";

export interface DemoPersona {
  key: DemoPersonaKey;
  name: string;
  email: string;
  role: "COORDINATOR" | "STUDENT" | "FIELD_SUPERVISOR" | "ACADEMIC_SUPERVISOR";
  roleLabel: string;
  title: string;
  department: string;
  institution: string;
  tenantSlug: string;
  defaultPath: string;
  avatarInitials: string;
  badgeColor: string;
}

export const DEMO_PERSONAS: Record<DemoPersonaKey, DemoPersona> = {
  admin: {
    key: "admin",
    name: "Dr. Adebayo Ogunlesi",
    email: "a.ogunlesi@unilag.edu.ng",
    role: "COORDINATOR",
    roleLabel: "Practicum Coordinator",
    title: "Field Education Director & Institution Admin",
    department: "Department of Social Work",
    institution: "University of Lagos",
    tenantSlug: "unilag",
    defaultPath: "/unilag/admin",
    avatarInitials: "AO",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  student: {
    key: "student",
    name: "Chukwuemeka Eze",
    email: "c.eze@student.unilag.edu.ng",
    role: "STUDENT",
    roleLabel: "Student Trainee",
    title: "400L Trainee (Clinical Social Work)",
    department: "Department of Social Work",
    institution: "University of Lagos",
    tenantSlug: "unilag",
    defaultPath: "/unilag/student",
    avatarInitials: "CE",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  },
  field: {
    key: "field",
    name: "Mrs. Ngozi Okonkwo",
    email: "ngozi.okonkwo@lagossocial.gov.ng",
    role: "FIELD_SUPERVISOR",
    roleLabel: "Field Supervisor",
    title: "Clinical Practice Instructor",
    department: "Lagos State Ministry of Youth & Social Development",
    institution: "General Hospital Lagos Field Unit",
    tenantSlug: "unilag",
    defaultPath: "/unilag/field",
    avatarInitials: "NO",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
  },
  faculty: {
    key: "faculty",
    name: "Dr. Folashade Adeleke",
    email: "f.adeleke@unilag.edu.ng",
    role: "ACADEMIC_SUPERVISOR",
    roleLabel: "Academic Supervisor",
    title: "Senior Lecturer & Practicum Advisor",
    department: "Department of Social Work",
    institution: "University of Lagos",
    tenantSlug: "unilag",
    defaultPath: "/unilag/faculty",
    avatarInitials: "FA",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
};

export const DEFAULT_DEMO_PERSONA: DemoPersonaKey = "admin";
