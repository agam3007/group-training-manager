/**
 * Request-scoped tenant context (D30).
 * Uses AsyncLocalStorage — safe for concurrent requests.
 * The auth middleware sets this from X-Tenant-Id header or the
 * user's default; db helpers read it via getTenantId().
 */
import { AsyncLocalStorage } from "node:async_hooks";

export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>();

export function setTenantId(tenantId: string) {
  // Called by middleware inside the AsyncLocalStorage.run() callback
  const store = tenantContext.getStore();
  if (store) {
    store.tenantId = tenantId;
  }
}

export function getTenantIdFromContext(): string | null {
  return tenantContext.getStore()?.tenantId ?? null;
}