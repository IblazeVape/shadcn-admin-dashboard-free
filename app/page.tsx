// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ReturnsPortalPage from "@/app/returns/page";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get("portal_session")?.value;

  // If they don't have a valid login session cookie, kick them to the login trigger
  if (!session) {
    redirect("/api/login");
  }

  // If they are logged in, render the returns interface directly on the root URL
  return <ReturnsPortalPage />;
}
