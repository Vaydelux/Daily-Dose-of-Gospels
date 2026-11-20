import type { Metadata } from "next";
import { AdminClient } from "@/components/site/admin-client";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Moderation dashboard.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const admin = await isAdmin();
  return <AdminClient initialAuthed={admin} />;
}
