import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) {
  console.warn("ADMIN_EMAIL environment variable is not set. Admin access will be denied.");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!ADMIN_EMAIL || !session?.user || session.user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  return <>{children}</>;
}
