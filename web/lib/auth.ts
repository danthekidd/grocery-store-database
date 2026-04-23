export const CUSTOMER_SESSION_COOKIE = "grocery_customer_session";

export function parseCustomerId(rawValue: string | undefined): number | null {
  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function getCustomerIdFromCookieHeader(cookieHeader: string | null): number | null {
  if (!cookieHeader) {
    return null;
  }

  const cookiePairs = cookieHeader.split(";");
  for (const pair of cookiePairs) {
    const [name, ...valueParts] = pair.trim().split("=");
    if (name !== CUSTOMER_SESSION_COOKIE) {
      continue;
    }

    return parseCustomerId(valueParts.join("="));
  }

  return null;
}
