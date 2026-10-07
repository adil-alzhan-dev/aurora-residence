"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AlertIcon } from "@/components/admin/admin-icons";
import { useAdminFormat } from "@/components/admin/admin-locale";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";
import type { AdminFormat } from "@/lib/admin/admin-format";
import { signIn, type LoginResult } from "@/lib/admin/login";
import { safeNextPath } from "@/lib/admin/paths";
import { adminApi } from "@/lib/admin/session";
import { fillTemplate } from "@/lib/format";

import { LoginField } from "./login-field";

const ERROR_ID = "login-error";

const loginSchema = (t: AdminDictionary["login"]) =>
  z.object({
    email: z.string().trim().pipe(z.email(t.emailInvalid)),
    password: z.string().min(1, t.passwordRequired),
  });

type Problem = Exclude<LoginResult, { kind: "signed-in" }>;

function problemText(problem: Problem, t: AdminDictionary["login"], format: AdminFormat) {
  switch (problem.kind) {
    case "wrong-credentials":
      return fillTemplate(t.wrongCredentials, { attempts: format.count(problem.attemptsLeft, t.attempts) });
    case "paused": {
      const minutes = Math.ceil(problem.retryAfterSeconds / 60);
      return fillTemplate(t.paused, { minutes: format.count(minutes, t.minutes) });
    }
    default:
      return t.failed;
  }
}

export function LoginForm({ t, next }: { t: AdminDictionary["login"]; next: string | null }) {
  const format = useAdminFormat();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pauseSeconds, setPauseSeconds] = useState<number | null>(null);

  const schema = useMemo(() => loginSchema(t), [t]);
  const { register, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (pauseSeconds === null) return;
    const timer = window.setTimeout(() => {
      setPauseSeconds(null);
      setProblem(null);
    }, pauseSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [pauseSeconds]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setProblem(null);
    const result = await signIn(email, password);
    if (result.kind === "signed-in") {
      adminApi.setAccessToken(result.accessToken);
      queryClient.clear();
      router.replace(safeNextPath(next));
      return;
    }
    if (result.kind === "invalid") {
      if (result.fields.email) setError("email", { message: t.emailInvalid });
      if (result.fields.password) setError("password", { message: t.passwordRequired });
      return;
    }
    if (result.kind === "paused") setPauseSeconds(result.retryAfterSeconds);
    setProblem(result);
  });

  const { errors, isSubmitting } = formState;
  const wrongCredentials = problem?.kind === "wrong-credentials";
  const message = errors.email?.message ?? errors.password?.message ?? (problem && problemText(problem, t, format));
  const paused = pauseSeconds !== null;

  return (
    <form noValidate onSubmit={onSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <LoginField
          id="login-email"
          label={t.email}
          type="email"
          autoComplete="username"
          inputMode="email"
          invalid={Boolean(errors.email)}
          describedBy={errors.email ? ERROR_ID : undefined}
          {...register("email")}
        />
        <LoginField
          id="login-password"
          label={t.password}
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors.password) || wrongCredentials}
          describedBy={errors.password || wrongCredentials ? ERROR_ID : undefined}
          {...register("password")}
        />
        {message && (
          <p id={ERROR_ID} role="alert" className="flex gap-2 text-admin-caption text-destructive">
            <AlertIcon className="mt-0.5 shrink-0" />
            {message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting || paused} aria-busy={isSubmitting}>
        {isSubmitting ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
