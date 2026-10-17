import type {
  ContactMethodId,
  GoalId,
  ProjectTypeId,
  TimelineId,
} from "@/content/start-form";

export type FormState = {
  projectTypes: ProjectTypeId[];
  otherProjectNote: string;
  goals: GoalId[];
  otherGoalNote: string;
  websiteFeatures: string[];
  webappFeatures: string[];
  mobileFeatures: string[];
  hostingFeatures: string[];
  timeline: TimelineId | "";
  details: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  contactMethod: ContactMethodId | "";
  privacy: boolean;
};

export const initialFormState: FormState = {
  projectTypes: [],
  otherProjectNote: "",
  goals: [],
  otherGoalNote: "",
  websiteFeatures: [],
  webappFeatures: [],
  mobileFeatures: [],
  hostingFeatures: [],
  timeline: "",
  details: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  contactMethod: "",
  privacy: false,
};

export const STORAGE_KEY = "tool2day-start-form-v1";

export function loadFormState(): FormState {
  if (typeof window === "undefined") return initialFormState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialFormState;
    return { ...initialFormState, ...JSON.parse(raw) };
  } catch {
    return initialFormState;
  }
}

export function saveFormState(state: FormState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearFormState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function toggleInList<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
