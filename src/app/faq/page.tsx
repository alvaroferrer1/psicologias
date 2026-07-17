"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  HelpCircle,
  Lock,
  Video,
  FileText,
  Users,
  Bell,
  CalendarDays,
  Search,
  ShieldCheck,
  Smartphone,
  Settings,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/useT";

type QA = {
  qKey: string;
  aKey: string;
  category: string;
  icon: React.ReactNode;
};

export default function FaqPage() {
  const { t } = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const CATEGORIES = [
    { id: "all", labelKey: "faq.category.all", icon: <HelpCircle className="h-4 w-4" /> },
    { id: "account", labelKey: "faq.category.account", icon: <Lock className="h-4 w-4" /> },
    { id: "video", labelKey: "faq.category.video", icon: <Video className="h-4 w-4" /> },
    { id: "reports", labelKey: "faq.category.reports", icon: <FileText className="h-4 w-4" /> },
    { id: "appointments", labelKey: "faq.category.appointments", icon: <Bell className="h-4 w-4" /> },
    { id: "security", labelKey: "faq.category.security", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  const FAQS: QA[] = [
    { qKey: "faq.q1", aKey: "faq.q1a", category: "account", icon: <Lock className="h-5 w-5" /> },
    { qKey: "faq.q2", aKey: "faq.q2a", category: "account", icon: <Lock className="h-5 w-5" /> },
    { qKey: "faq.q3", aKey: "faq.q3a", category: "account", icon: <Users className="h-5 w-5" /> },
    { qKey: "faq.q4", aKey: "faq.q4a", category: "video", icon: <Video className="h-5 w-5" /> },
    { qKey: "faq.q5", aKey: "faq.q5a", category: "video", icon: <Lock className="h-5 w-5" /> },
    { qKey: "faq.q6", aKey: "faq.q6a", category: "reports", icon: <FileText className="h-5 w-5" /> },
    { qKey: "faq.q7", aKey: "faq.q7a", category: "reports", icon: <FileText className="h-5 w-5" /> },
    { qKey: "faq.q8", aKey: "faq.q8a", category: "appointments", icon: <Bell className="h-5 w-5" /> },
    { qKey: "faq.q9", aKey: "faq.q9a", category: "appointments", icon: <CalendarDays className="h-5 w-5" /> },
    { qKey: "faq.q10", aKey: "faq.q10a", category: "appointments", icon: <Smartphone className="h-5 w-5" /> },
    { qKey: "faq.q11", aKey: "faq.q11a", category: "security", icon: <ShieldCheck className="h-5 w-5" /> },
    { qKey: "faq.q12", aKey: "faq.q12a", category: "security", icon: <Settings className="h-5 w-5" /> },
    { qKey: "faq.q13", aKey: "faq.q13a", category: "account", icon: <Users className="h-5 w-5" /> },
    { qKey: "faq.q14", aKey: "faq.q14a", category: "security", icon: <Sparkles className="h-5 w-5" /> },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((item) => {
      const matchesCat = active === "all" || item.category === active;
      const matchesQuery =
        !q ||
        t(item.qKey).toLowerCase().includes(q) ||
        t(item.aKey).toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [active, query, t]);

  return (
    <div className="min-h-screen bg-secondary-bg bg-gradient-to-br from-[#0b1220] via-[#0b1426] to-[#0e1a2e] px-4 py-12 text-secondary-text dark:from-[#070d18] dark:via-[#0b1426] dark:to-[#0a1424] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/settings"
          className="mb-8 inline-flex items-center gap-2 font-bold text-primary transition-colors hover:underline"
        >
          <ChevronDown className="h-4 w-4 rotate-90" /> {t("settings.back")}
        </Link>

        <div className="mb-10 text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("faq.help")}
          </span>
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl shadow-primary/25">
            <span className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl" />
            <HelpCircle className="relative h-10 w-10" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-secondary-text">{t("faq.title")}</h1>
          <p className="mx-auto mt-3 max-w-xl font-medium text-slate-500 dark:text-[var(--color-secondary-muted)]">
            {t("faq.subtitle")}
          </p>
        </div>

        <div className="group mb-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10 dark:border-slate-200 dark:bg-white dark:focus-within:border-primary dark:focus-within:shadow-primary/20">
          <Search className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("faq.search")}
            className="w-full bg-transparent text-sm font-medium text-secondary-text outline-none placeholder:text-slate-400 dark:placeholder:text-[var(--color-secondary-muted)]"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(cat.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition-all ${
                active === cat.id
                  ? "border-primary bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary hover:shadow-sm dark:border-slate-200 dark:bg-white dark:text-slate-600 dark:hover:border-primary/40 dark:hover:text-primary"
              }`}
            >
              {cat.icon}
              {t(cat.labelKey)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
           <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm dark:border-slate-200 dark:bg-white dark:text-slate-500">
            <HelpCircle className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-[var(--color-secondary-border)]" />
            {t("faq.noResults")}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                 <div
                   key={item.qKey}
                   className={`overflow-hidden rounded-2xl border bg-white transition-all duration-200 dark:border-slate-200 dark:bg-white ${
                     isOpen
                       ? "border-primary/40 shadow-lg shadow-primary/10 dark:shadow-primary/10"
                       : "border-slate-200 hover:border-primary/40 hover:shadow-md dark:border-slate-200 dark:hover:border-primary/40"
                   }`}
                 >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                     className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-100"
                   >
                     <span className="flex items-center gap-3 font-bold text-secondary-text dark:text-slate-800">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors dark:bg-primary/15">
                        {item.icon}
                      </span>
                      {t(item.qKey)}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-colors ${
                          isOpen
                            ? "text-primary"
                            : "text-slate-400 dark:text-[var(--color-secondary-muted)]"
                        }`}
                      />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                         <p className="border-t border-slate-100 bg-slate-50 px-5 pb-5 pl-[4.25rem] pt-4 text-[15px] leading-relaxed text-slate-600 dark:border-slate-100 dark:bg-slate-50 dark:text-slate-700">
                           {t(item.aKey)}
                         </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 overflow-hidden rounded-3xl border border-primary/20 bg-primary-light p-8 text-center shadow-lg shadow-primary/5 dark:border-slate-200 dark:bg-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 dark:bg-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="font-extrabold text-secondary-text dark:text-slate-800">{t("faq.stillDoubts")}</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-500">
            {t("faq.stillDoubtsDesc")}
          </p>
          <Link
            href="/dashboard/settings"
            className="btn btn-primary mt-5 shadow-md shadow-primary/20"
          >
            {t("faq.goSettings")}
          </Link>
        </div>
      </div>
    </div>
  );
}
