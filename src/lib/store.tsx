import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Assignment,
  ClassSlot,
  Exam,
  LinkItem,
  Note,
  Reminder,
  StudentData,
  Subject,
} from "./types";

const KEY = "student-hub-v1";

const seed: StudentData = {
  name: "Student",
  target: 80,
  classes: [
    {
      id: "c1",
      subject: "Data Structures",
      teacher: "Dr. Rao",
      room: "CS-201",
      day: "Monday",
      start: "09:00",
      end: "10:00",
    },
    {
      id: "c2",
      subject: "Operating Systems",
      teacher: "Prof. Iyer",
      room: "CS-104",
      day: "Monday",
      start: "10:15",
      end: "11:15",
    },
    {
      id: "c3",
      subject: "DBMS",
      teacher: "Dr. Menon",
      room: "Lab-3",
      day: "Tuesday",
      start: "11:30",
      end: "13:00",
    },
    {
      id: "c4",
      subject: "Computer Networks",
      teacher: "Prof. Shah",
      room: "CS-201",
      day: "Wednesday",
      start: "09:00",
      end: "10:00",
    },
    {
      id: "c5",
      subject: "Data Structures",
      teacher: "Dr. Rao",
      room: "CS-201",
      day: "Thursday",
      start: "14:00",
      end: "15:00",
    },
    {
      id: "c6",
      subject: "DBMS",
      teacher: "Dr. Menon",
      room: "Lab-3",
      day: "Friday",
      start: "10:15",
      end: "11:45",
    },
  ],
  subjects: [
    { id: "s1", name: "Data Structures", total: 40, attended: 34 },
    { id: "s2", name: "Operating Systems", total: 36, attended: 26 },
    { id: "s3", name: "DBMS", total: 30, attended: 23 },
    { id: "s4", name: "Computer Networks", total: 32, attended: 30 },
  ],
  assignments: [],
  exams: [],
  reminders: [],
  notes: [],
  links: [
    { id: "l1", label: "College Portal", url: "https://example.edu", category: "Academics" },
    {
      id: "l2",
      label: "GeeksforGeeks DSA",
      url: "https://www.geeksforgeeks.org/data-structures/",
      category: "Study",
    },
  ],
};

type Ctx = {
  data: StudentData;
  ready: boolean;
  update: (fn: (d: StudentData) => StudentData) => void;
  reset: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StudentData>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData({ ...seed, ...(JSON.parse(raw) as StudentData) });
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, ready]);

  const update = useCallback((fn: (d: StudentData) => StudentData) => {
    setData((d) => fn(d));
  }, []);

  const reset = useCallback(() => setData(seed), []);

  const value = useMemo(() => ({ data, ready, update, reset }), [data, ready, update, reset]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Generic list helpers */
export function useCollections() {
  const { data, update } = useStore();

  const make = <K extends keyof StudentData>(key: K) => ({
    add: (item: unknown) =>
      update((d) => ({ ...d, [key]: [...(d[key] as unknown[]), item] }) as StudentData),
    edit: (id: string, patch: Record<string, unknown>) =>
      update(
        (d) =>
          ({
            ...d,
            [key]: (d[key] as { id: string }[]).map((x) =>
              x.id === id ? { ...x, ...patch } : x,
            ),
          }) as StudentData,
      ),
    remove: (id: string) =>
      update(
        (d) =>
          ({
            ...d,
            [key]: (d[key] as { id: string }[]).filter((x) => x.id !== id),
          }) as StudentData,
      ),
  });

  return {
    data,
    update,
    classes: make("classes") as {
      add: (i: ClassSlot) => void;
      edit: (id: string, p: Partial<ClassSlot>) => void;
      remove: (id: string) => void;
    },
    subjects: make("subjects") as {
      add: (i: Subject) => void;
      edit: (id: string, p: Partial<Subject>) => void;
      remove: (id: string) => void;
    },
    assignments: make("assignments") as {
      add: (i: Assignment) => void;
      edit: (id: string, p: Partial<Assignment>) => void;
      remove: (id: string) => void;
    },
    exams: make("exams") as {
      add: (i: Exam) => void;
      edit: (id: string, p: Partial<Exam>) => void;
      remove: (id: string) => void;
    },
    reminders: make("reminders") as {
      add: (i: Reminder) => void;
      edit: (id: string, p: Partial<Reminder>) => void;
      remove: (id: string) => void;
    },
    notes: make("notes") as {
      add: (i: Note) => void;
      edit: (id: string, p: Partial<Note>) => void;
      remove: (id: string) => void;
    },
    links: make("links") as {
      add: (i: LinkItem) => void;
      edit: (id: string, p: Partial<LinkItem>) => void;
      remove: (id: string) => void;
    },
  };
}
