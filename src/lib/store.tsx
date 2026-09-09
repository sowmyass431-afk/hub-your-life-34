import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
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
      completedOn: "",
    },
    {
      id: "c2",
      subject: "Operating Systems",
      teacher: "Prof. Iyer",
      room: "CS-104",
      day: "Monday",
      start: "10:15",
      end: "11:15",
      completedOn: "",
    },
    {
      id: "c3",
      subject: "DBMS",
      teacher: "Dr. Menon",
      room: "Lab-3",
      day: "Tuesday",
      start: "11:30",
      end: "13:00",
      completedOn: "",
    },
    {
      id: "c4",
      subject: "Computer Networks",
      teacher: "Prof. Shah",
      room: "CS-201",
      day: "Wednesday",
      start: "09:00",
      end: "10:00",
      completedOn: "",
    },
    {
      id: "c5",
      subject: "Data Structures",
      teacher: "Dr. Rao",
      room: "CS-201",
      day: "Thursday",
      start: "14:00",
      end: "15:00",
      completedOn: "",
    },
    {
      id: "c6",
      subject: "DBMS",
      teacher: "Dr. Menon",
      room: "Lab-3",
      day: "Friday",
      start: "10:15",
      end: "11:45",
      completedOn: "",
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

function withDefaults(d: Partial<StudentData> | null | undefined): StudentData {
  return { ...seed, ...(d ?? {}) };
}

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
  const userIdRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the signed-in user's data from the cloud; migrate any local data on
  // first sign-in.
  useEffect(() => {
    let active = true;

    const load = async (userId: string) => {
      const { data: row } = await supabase
        .from("user_data")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;

      const cloud = row?.data as Partial<StudentData> | null;
      if (cloud && Object.keys(cloud).length > 0) {
        setData(withDefaults(cloud));
      } else {
        // First sign-in on this account: carry over anything saved locally.
        let migrated = seed;
        try {
          const raw = localStorage.getItem(KEY);
          if (raw) migrated = withDefaults(JSON.parse(raw) as Partial<StudentData>);
        } catch {
          /* ignore corrupt storage */
        }
        setData(migrated);
        await supabase.from("user_data").upsert({
          user_id: userId,
          data: migrated as unknown as Json,
          updated_at: new Date().toISOString(),
        });
        localStorage.removeItem(KEY);
      }
      userIdRef.current = userId;
      setReady(true);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) void load(user.id);
      else setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) void load(session.user.id);
      if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        setData(seed);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Debounced save to the cloud on every change.
  useEffect(() => {
    const userId = userIdRef.current;
    if (!ready || !userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void supabase.from("user_data").upsert({
        user_id: userId,
        data: data as unknown as Json,
        updated_at: new Date().toISOString(),
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
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
