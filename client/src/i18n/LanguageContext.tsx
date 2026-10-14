/**
 * F0.4 — Language context: t(key), lang, dir, setLang.
 * Persists to localStorage. Sets <html dir> and <html lang> dynamically.
 * Wrap the app: <LanguageProvider><App /></LanguageProvider>
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Lang } from "./translations";
import { translations } from "./translations";

const LANG_KEY = "gtm_lang";

interface LangCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    return saved === "en" || saved === "he" ? saved : "he";
  });

  const dir = lang === "he" ? "rtl" : "ltr";

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "he" ? "en" : "he");
  }, [lang, setLang]);

  const t = useCallback((key: string): string => {
    return translations[lang][key] ?? translations.en[key] ?? key;
  }, [lang]);

  // Set <html dir> and <html lang> on every change
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  return (
    <Ctx.Provider value={{ lang, dir, t, setLang, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}