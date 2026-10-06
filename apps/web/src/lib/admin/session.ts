import { createAdminApi } from "./api-client";
import { loginHref } from "./paths";

function currentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/** One client per browser tab: the access token is kept in memory and is gone after a reload. */
export const adminApi = createAdminApi({
  onSessionExpired: () => window.location.replace(loginHref(currentPath())),
});
