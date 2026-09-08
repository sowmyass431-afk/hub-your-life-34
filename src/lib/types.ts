export type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export const DAYS: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export type ClassSlot = {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  day: Day;
  start: string; // "09:00"
  end: string; // "10:00"
  completedOn?: string; // ISO date string (yyyy-mm-dd)
};

export type Subject = {
  id: string;
  name: string;
  total: number;
  attended: number;
};

export type Priority = "Low" | "Medium" | "High";
export type Status = "Pending" | "In Progress" | "Completed";

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  description: string;
  due: string; // yyyy-mm-dd
  priority: Priority;
  status: Status;
};

export type Exam = {
  id: string;
  subject: string;
  date: string; // yyyy-mm-dd
  time: string;
  room: string;
  syllabus: string;
};

export type Reminder = {
  id: string;
  title: string;
  date: string;
  time: string;
  done: boolean;
};

export type Note = {
  id: string;
  title: string;
  subject: string;
  body: string;
  updatedAt: string;
};

export type LinkItem = {
  id: string;
  label: string;
  url: string;
  category: string;
};

export type StudentData = {
  name: string;
  classes: ClassSlot[];
  subjects: Subject[];
  assignments: Assignment[];
  exams: Exam[];
  reminders: Reminder[];
  notes: Note[];
  links: LinkItem[];
  target: number;
};
