/**
 * Interim auth transport (F0.2 + D30): attaches the Supabase access
 * token + selected tenant to every request going to our API host.
 * Replaced by the typed client (React Query + apiFetch) in F0.3.
 */
import { supabase } from "./authClient";
import { env } from "../env/env";

const TENANT_KEY = "gtm_selected_tenant";

export function getSelectedTenant(): string | null {
  return localStorage.getItem(TENANT_KEY);
}

export function setSelectedTenant(tenantId: string) {
  localStorage.setItem(TENANT_KEY, tenantId);
}

const originalFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  if (env.supabaseUrl && url.startsWith(env.apiUrl)) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const tenantId = getSelectedTenant();
    if (token) {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${token}`);
      if (tenantId) {
        headers.set("X-Tenant-Id", tenantId);
      }
      init = { ...init, headers };
    }
  }

  return originalFetch(input, init);
};