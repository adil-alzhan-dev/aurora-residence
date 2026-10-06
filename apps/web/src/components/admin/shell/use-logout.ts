"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ADMIN_LOGIN } from "@/lib/admin/paths";
import { adminApi } from "@/lib/admin/session";

/** Signs out on the server, then drops the token and cached data whatever the answer was. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await adminApi.logout();
    } catch {
      // Even when the API cannot be reached, this tab forgets the token and leaves the admin.
    } finally {
      queryClient.clear();
      router.replace(ADMIN_LOGIN);
    }
  }

  return { logout, pending };
}
