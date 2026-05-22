// app/dashboard/page.tsx
import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import ReturnsPortalPage from "./returns/page";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Returns & Claims | iBlaze",
    description: "Secure customer returns and order claims tracking portal.",
  });
}

export default function Page() {
  return (
    <>
      <ReturnsPortalPage />
    </>
  );
}
