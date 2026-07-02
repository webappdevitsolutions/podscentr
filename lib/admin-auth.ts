import { cookies } from "next/headers";

export const adminSessionCookie = "podscentra-admin-session";

export async function isAdminRequest(request?: Request) {
  const cookieStore = await cookies();
  const cookieSession = cookieStore.get(adminSessionCookie)?.value;
  const headerSession = request?.headers.get("x-admin-session");

  return cookieSession === "active" || headerSession === "active";
}
