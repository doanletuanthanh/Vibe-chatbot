import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

// This is a simplified auth implementation - in a real-world scenario,
// you would likely integrate with a proper backend authentication system
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is a mock authentication - in a real app, validate against your backend
        if (credentials?.email === "user@example.com" && credentials?.password === "password") {
          return {
            id: "1",
            name: "Demo User",
            email: "user@example.com",
          };
        }
        return null;
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  // Sử dụng biến môi trường cho secret hoặc dùng một giá trị mặc định cho môi trường phát triển
  secret: process.env.NEXTAUTH_SECRET || "YOUR_DEVELOPMENT_SECRET_DO_NOT_USE_IN_PRODUCTION",
};