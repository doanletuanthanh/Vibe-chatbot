"use client";

import { useState, useEffect } from "react";
import { Send, Search, Database, BookOpen } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import axios from "axios";

interface Source {
  content: string;
  metadata: any;
  score: number;
}

interface QueryResponse {
  answer: string;
  sources: Source[];
}

export function QueryInterface() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("default_collection");
  const [collections, setCollections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const { toast } = useToast();
  
  // Fetch available collections on component mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/rag/collections`);
        if (response.data.collections && Array.isArray(response.data.collections)) {
          setCollections(response.data.collections);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
        toast({
          title: "Error fetching collections",
          description: "Failed to load available collections",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCollections(false);
      }
    };

    fetchCollections();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a question to ask",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Updated endpoint to use the new /rag/query path
      const result = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/rag/query`, {
        query: query.trim(),
        collection_name: collection,
      });

      setResponse(result.data);
    } catch (error) {
      console.error("Query error:", error);
      toast({
        title: "Query failed",
        description: axios.isAxiosError(error)
          ? error.response?.data?.detail || "Failed to process your query"
          : "Failed to process your query",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Search className="h-5 w-5" />
        Direct RAG Query
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        This is for direct document queries without chatbot context. Use the chatbot with RAG enabled for conversation-based document queries.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="collection-select" className="block text-sm font-medium text-gray-700 mb-1">
            Collection to Query
          </label>
          <select
            id="collection-select"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-gray-50 text-gray-900 sm:text-sm"
            disabled={isLoadingCollections}
          >
            {isLoadingCollections ? (
              <option value="">Loading collections...</option>
            ) : (
              <>
                {collections.length > 0 ? (
                  collections.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))
                ) : (
                  <option value="default_collection">default_collection</option>
                )}
              </>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
            Your Question
          </label>
          <div className="relative">
            <input
              type="text"
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm py-2 pl-3 pr-10 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ask anything about your documents..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      {isLoading && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md animate-pulse">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
            <div className="h-4 w-48 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-300 rounded"></div>
            <div className="h-3 w-5/6 bg-gray-300 rounded"></div>
            <div className="h-3 w-4/6 bg-gray-300 rounded"></div>
          </div>
        </div>
      )}

      {response && !isLoading && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-indigo-50 rounded-md border border-indigo-100">
            <h3 className="font-medium text-indigo-900 mb-2">Answer</h3>
            <p className="text-gray-800 whitespace-pre-line">{response.answer}</p>
          </div>

          {response.sources && response.sources.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> 
                Sources
              </h3>
              <div className="space-y-3 mt-2">
                {response.sources.map((source, index) => (
                  <div key={index} className="p-3 bg-white rounded border border-gray-200">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-700">
                        Source {index + 1}
                        {source.metadata?.source && ` - ${source.metadata.source}`}
                      </h4>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        Score: {Math.round(source.score * 100) / 100}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{source.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!response && !isLoading && (
        <div className="mt-6 p-6 bg-gray-50 rounded-md border border-dashed border-gray-300 text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-600 font-medium mb-1">No Results Yet</h3>
          <p className="text-gray-500 text-sm">
            Ask a question to get answers from your documents
          </p>
        </div>
      )}
    </div>
  );
}