"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, Database, User } from "lucide-react";

export function Navigation() {
  const { data: session, status } = useSession();
  
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Database className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="font-bold text-lg text-gray-900">RAG Knowledge Assistant</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {status === "authenticated" && session?.user && (
              <>
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="ml-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Logout</span>
                </button>
              </>
            )}
            
            {status === "unauthenticated" && (
              <Link
                href="/login"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}