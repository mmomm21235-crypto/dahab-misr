import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  providers: [
    Google({
      clientId: googleId || "",
      clientSecret: googleSecret || "",
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user?.email && process.env.ADMIN_EMAIL) {
        (token as any).isAdmin = user.email === process.env.ADMIN_EMAIL;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id: string }).id = token.sub;
      }
      if ((token as any).isAdmin !== undefined) {
        (session.user as any).isAdmin = (token as any).isAdmin;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

export async function getSession() {
  return getServerSession(authOptions);
}

export function validateAuthConfig() {
  if (!googleId || !googleSecret) {
    throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are required");
  }
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required");
  }
}
