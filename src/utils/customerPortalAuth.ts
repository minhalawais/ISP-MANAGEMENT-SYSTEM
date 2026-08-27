const CUSTOMER_PORTAL_TOKEN_KEY = "customer_portal_token";
const CUSTOMER_PORTAL_PENDING_PW_KEY = "customer_portal_pending_pw";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getCustomerPortalToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CUSTOMER_PORTAL_TOKEN_KEY);
}

export function setCustomerPortalToken(token: string): void {
  sessionStorage.setItem(CUSTOMER_PORTAL_TOKEN_KEY, token);
}

export function removeCustomerPortalToken(): void {
  sessionStorage.removeItem(CUSTOMER_PORTAL_TOKEN_KEY);
  sessionStorage.removeItem(CUSTOMER_PORTAL_PENDING_PW_KEY);
}

export function setCustomerPortalPendingPassword(password: string): void {
  sessionStorage.setItem(CUSTOMER_PORTAL_PENDING_PW_KEY, password);
}

export function getCustomerPortalPendingPassword(): string | null {
  return sessionStorage.getItem(CUSTOMER_PORTAL_PENDING_PW_KEY);
}

export function clearCustomerPortalPendingPassword(): void {
  sessionStorage.removeItem(CUSTOMER_PORTAL_PENDING_PW_KEY);
}

export function getCustomerPortalMustChangePassword(): boolean {
  const token = getCustomerPortalToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  const claims = (payload?.must_change_password ?? payload?.mustChangePassword) as boolean | undefined;
  return Boolean(claims);
}

export function getCustomerPortalCustomerId(): string | null {
  const token = getCustomerPortalToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return (payload?.customer_id as string) ?? null;
}
