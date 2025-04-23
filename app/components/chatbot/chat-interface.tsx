"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageSquare, Bot, User, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import axios from "axios";

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface ConversationListResponse {
  conversations: Conversation[];
}

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface AvailableModelsResponse {
  models: Model[];
}

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [useRag, setUseRag] = useState(false);
  const [collectionName, setCollectionName] = useState("default_collection");
  const [collections, setCollections] = useState<string[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("deepseek-r1-distill-llama-70b");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    try {
      const response = await axios.get<ConversationListResponse>(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations`
      );
      setConversations(response.data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Failed to load conversations",
        description: "Could not retrieve your conversation history",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchAvailableModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const response = await axios.get<AvailableModelsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/available-models`
      );
      setAvailableModels(response.data.models);
      
      // Set default model if available
      if (response.data.models.length > 0) {
        // Find deepseek model or use first one
        const defaultModel = response.data.models.find(
          model => model.id === "deepseek-r1-distill-llama-70b"
        ) || response.data.models[0];
        setSelectedModel(defaultModel.id);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast({
        title: "Failed to load models",
        description: "Could not retrieve available models",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModels(false);
    }
  }, [toast]);

  const fetchCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/rag/collections`
      );
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
  }, [toast]);

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
    fetchAvailableModels();
  }, [fetchConversations, fetchAvailableModels]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation]);

  // Add this useEffect to fetch collections when RAG is enabled
  useEffect(() => {
    if (useRag && collections.length === 0) {
      fetchCollections();
    }
  }, [useRag, collections.length, fetchCollections]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async (id: string) => {
    try {
      const response = await axios.get<Conversation>(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/${id}`
      );
      setCurrentConversation(response.data);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast({
        title: "Failed to load conversation",
        description: "Could not retrieve the selected conversation",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/chat`,
        {
          message: message.trim(),
          conversation_id: currentConversation?.id,
          use_rag: useRag,
          collection_name: collectionName,
          model: selectedModel,
          api_key: apiKey.trim() === "" ? undefined : apiKey.trim(),
        }
      );

      // If it's a new conversation, fetch all conversations to update the list
      if (!currentConversation) {
        await fetchConversations();
      }

      // Fetch the updated conversation
      await fetchConversation(response.data.conversation_id);
      
      setMessage("");
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Message failed",
        description: axios.isAxiosError(error)
          ? error.response?.data?.detail || "Failed to send your message"
          : "Failed to send your message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering conversation selection
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/${id}`
      );
      
      // If the deleted conversation was selected, clear the selection
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
      
      // Refresh the conversations list
      await fetchConversations();
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the conversation",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Sidebar with conversations */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </h2>
          <button
            onClick={startNewConversation}
            className="mt-2 w-full py-2 px-4 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
          >
            New Conversation
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {conversations.map((conv) => (
                <li 
                  key={conv.id} 
                  onClick={() => selectConversation(conv)}
                  className={`p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-start ${
                    currentConversation?.id === conv.id ? "bg-indigo-50" : ""
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="font-medium text-gray-800 truncate">{conv.title}</p>
                    <p className="text-xs text-gray-500">{new Date(conv.updated_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Settings panel with model selection and API key */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div 
            className="p-3 flex justify-between items-center cursor-pointer"
            onClick={() => setShowSettings(!showSettings)}
          >
            <div className="flex items-center">
              <Settings className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Model Settings</span>
            </div>
            {showSettings ? 
              <ChevronUp className="h-4 w-4 text-gray-600" /> : 
              <ChevronDown className="h-4 w-4 text-gray-600" />
            }
          </div>
          
          {showSettings && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="mb-3">
                <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Model
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-gray-50 text-gray-900 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoadingModels}
                >
                  {isLoadingModels ? (
                    <option>Loading models...</option>
                  ) : (
                    availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom API Key (Optional)
                </label>
                <input
                  type="password"
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key for the selected model"
                  className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-gray-50 text-gray-900 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  If left empty, the system will use the default API key. Enter your own key for better rate limits or to use your account.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* RAG toggle and options */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="use-rag"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="use-rag" className="ml-2 block text-sm text-gray-700">
              Use Document Knowledge (RAG)
            </label>
          </div>
          
          {useRag && (
            <div className="flex items-center">
              <label htmlFor="collection-select" className="block text-sm text-gray-700 mr-2">
                Collection:
              </label>
              <select
                id="collection-select"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm py-1 px-2 bg-gray-50 text-gray-900 text-sm"
                disabled={isLoadingCollections}
              >
                {isLoadingCollections ? (
                  <option value="">Loading...</option>
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
          )}
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Bot className="h-16 w-16 text-indigo-200 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to the Chatbot</h3>
              <p className="text-gray-500 max-w-md">
                Start a new conversation by typing a message below. You can optionally enable RAG to query your document knowledge base.
              </p>
            </div>
          ) : (
            currentConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3/4 p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-indigo-100 text-gray-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {msg.role === "user" ? (
                      <User className="h-4 w-4 mr-1" />
                    ) : (
                      <Bot className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs text-gray-600">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-md border-gray-300 shadow-sm py-2 px-3 bg-gray-50 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isLoading ? "Sending..." : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}