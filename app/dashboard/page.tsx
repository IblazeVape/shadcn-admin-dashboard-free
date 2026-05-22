// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ReturnsPortalPage from "./dashboard/returns/page";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get("portal_session")?.value;

  // Enforce server-side bounce if the cookie drops or isn't matching
  if (!session) {
    redirect("/api/login");
  }

  return <ReturnsPortalPage />;
}
