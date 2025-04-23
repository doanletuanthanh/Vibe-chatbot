"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "./components/auth/navigation";
import { DocumentUpload } from "./components/rag/document-upload";
import { QueryInterface } from "./components/rag/query-interface";
import { ChatInterface } from "./components/chatbot/chat-interface";
import { BookOpen, MessageSquare, Database, Search, Upload, Bot, ArrowDown } from "lucide-react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [showRagTools, setShowRagTools] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <Database className="h-12 w-12 text-indigo-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chatbot Interface */}
        <div className="mb-10">
          <ChatInterface />
        </div>
        
        {/* RAG Tools Section (collapsible) */}
        <div className="mt-8">
          <button 
            onClick={() => setShowRagTools(!showRagTools)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-md text-gray-700 font-medium mb-4 mx-auto"
          >
            <Database className="h-4 w-4" />
            {showRagTools ? "Hide RAG Tools" : "Show RAG Tools"} 
            <ArrowDown className={`h-4 w-4 transition-transform ${showRagTools ? 'rotate-180' : ''}`} />
          </button>
          
          {showRagTools && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DocumentUpload />
              <QueryInterface />
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} AI Chat Assistant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
