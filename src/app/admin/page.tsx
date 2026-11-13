import type { Metadata } from "next";
import { AdminClient } from "@/components/site/admin-client";

export const metadata: Metadata = {
  title: "Admin",
  description: "Moderation dashboard.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
