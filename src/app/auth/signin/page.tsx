import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LogOut, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/initiate-signin");
    return null;
  }

  return (
    <div className="gold-card p-6 text-center space-y-4 max-w-sm mx-auto mt-8">
      <div className="w-16 h-16 rounded-full bg-gold-gradient mx-auto flex items-center justify-center">
        {session.user.image ? (
          <img src={session.user.image} alt="" className="w-16 h-16 rounded-full" />
        ) : (
          <User className="w-8 h-8 text-white" />
        )}
      </div>
      <div>
        <p className="font-bold text-lg">{session.user.name}</p>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
      </div>
      <form action="/api/initiate-signout" method="POST">
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-colors"
        >
          <span className="flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </span>
        </button>
      </form>
    </div>
  );
}
