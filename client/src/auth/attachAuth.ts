/**
 * Interim auth transport (F0.2): attaches the Supabase access token to
 * every request going to our API host. Single file — replaced by the
 * typed client (React Query + apiFetch) in F0.3.
 */
import { supabase } from "./authClient";
import { env } from "../env/env";

const originalFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  if (env.supabaseUrl && url.startsWith(env.apiUrl)) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${token}`);
      init = { ...init, headers };
    }
  }

  return originalFetch(input, init);
};