"use client";

import { createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  localizedPath,
  stripLocale,
  type Locale,
} from "@/config/locales";

export type { Locale };

/**
 * The active language, taken from the URL rather than from browser storage.
 *
 * It used to be `localStorage` state, which meant both languages shared one
 * URL: a crawler (and anyone opening a shared link) only ever saw English,
 * and the Sinhala copy was effectively unpublished. The route now decides —
 * `/` is English, `/si` is Sinhala — so switching language is a navigation,
 * and every rendering of the page has an address that reproduces it.
 */
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  /* Same signature the language switcher always called, so the Navbar didn't
     have to learn about routing — it just navigates now instead of swapping
     text in place. `scroll: false` keeps the reader where they were. */
  const setLocale = (next: Locale) => {
    if (next === locale) return;
    router.push(localizedPath(stripLocale(pathname).path, next), { scroll: false });
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
