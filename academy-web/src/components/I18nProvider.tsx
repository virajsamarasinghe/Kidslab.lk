"use client";

import { NextIntlClientProvider } from "next-intl";
import { useLocale } from "@/lib/locale-context";
import en from "@/messages/en.json";
import si from "@/messages/si.json";

const messages = { en, si };

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Asia/Colombo">
      {children}
    </NextIntlClientProvider>
  );
}
