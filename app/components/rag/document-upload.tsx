"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Plus } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import axios from "axios";

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [collection, setCollection] = useState("default_collection");
  const [collections, setCollections] = useState<string[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "create_new") {
      setIsCreatingNew(true);
      setNewCollectionName("");
    } else {
      setIsCreatingNew(false);
      setCollection(value);
    }
  };

  const handleNewCollectionSubmit = () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Empty collection name",
        description: "Please enter a name for the new collection",
        variant: "destructive",
      });
      return;
    }
    
    // Check if collection name already exists
    if (collections.includes(newCollectionName.trim())) {
      toast({
        title: "Collection already exists",
        description: "Please use a different name for your collection",
        variant: "destructive",
      });
      return;
    }
    
    setCollection(newCollectionName.trim());
    setCollections(prev => [...prev, newCollectionName.trim()]);
    setIsCreatingNew(false);
    
    toast({
      title: "Collection created",
      description: `New collection "${newCollectionName.trim()}" will be created when you upload a document`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("collection_name", collection);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/rag/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Upload successful",
        description: `Processed ${response.data.details.chunks} chunks from ${response.data.details.filename}`,
      });
      
      setFile(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: axios.isAxiosError(error) 
          ? error.response?.data?.detail || "Failed to upload document" 
          : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Upload Documents for RAG
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="collection-select" className="block text-sm font-medium text-gray-700 mb-1">
            Collection
          </label>
          
          {isCreatingNew ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="flex-1 block rounded-md border-gray-300 shadow-sm py-2 px-3 bg-gray-50 text-gray-900 sm:text-sm"
                  placeholder="Enter new collection name"
                />
                <button
                  type="button"
                  onClick={handleNewCollectionSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <select
              id="collection-select"
              value={collection}
              onChange={handleCollectionChange}
              className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-gray-50 text-gray-900 sm:text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
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
                  <option value="create_new">+ Create new collection</option>
                </>
              )}
            </select>
          )}
          
          <p className="mt-1 text-sm text-gray-500">
            Group related documents in collections for better organization
          </p>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, DOCX, TXT, MD up to 10MB</p>
              {file && (
                <p className="text-sm text-indigo-600 mt-2">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={!file || isUploading || isCreatingNew}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </form>
    </div>
  );
}