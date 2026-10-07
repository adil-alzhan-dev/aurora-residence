import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import type { AdminDictionary } from "@/content/en-admin";

import { LoginForm } from "./login-form";

export function LoginScreen({ t, next }: { t: AdminDictionary; next: string | null }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 py-28">
      <LocaleSwitcher
        locale={t.locale.lang}
        label={t.common.language}
        languages={t.common.languages}
        className="absolute top-4 right-4 sm:top-8 sm:right-8"
      />
      <main
        aria-labelledby="login-title"
        className="flex w-full max-w-[456px] flex-col items-start gap-6 rounded-base border border-border bg-card p-6 sm:p-12"
      >
        <Logo />
        <div className="flex flex-col gap-1">
          <p className="text-label text-muted-foreground">{t.common.salesAdmin}</p>
          <h1 id="login-title" className="text-admin-title text-foreground">
            {t.login.title}
          </h1>
          <p className="text-admin-body text-muted-foreground">{t.login.lead}</p>
        </div>
        <LoginForm t={t.login} next={next} />
        <p className="text-admin-caption text-muted-foreground">{t.login.forgot}</p>
      </main>
      <footer className="absolute inset-x-4 bottom-12 text-center text-admin-caption text-muted-foreground">
        {t.common.footer}
      </footer>
    </div>
  );
}
