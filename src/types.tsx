// --- Message Types ---

/**
 * Represents a user message in the chat.
 * @typedef {Object} UserMessage
 * @property {'user'} role - The role of the sender, always 'user'.
 * @property {string} content - The actual text content of the user's message.
 */
export type UserMessage = {
  role: 'user';
  content: string;
};

/**
 * Represents an assistant message in the chat.
 * @typedef {Object} AssistantMessage
 * @property {'assistant'} role - The role of the sender, always 'assistant'.
 * @property {string} content - The actual text content of the assistant's message.
 */
export type AssistantMessage = {
  role: 'assistant';
  content: string;
};

/**
 * A union type representing any single message in the chat,
 * which can be either a UserMessage or an AssistantMessage.
 * This allows for clear distinction between sender roles.
 * @typedef {UserMessage | AssistantMessage} Message
 */
export type Message = UserMessage | AssistantMessage;

// --- Chat History Type ---

/**
 * Represents the entire chat history as an ordered array of messages.
 * The order of messages in this array signifies the chronological flow of the conversation.
 * @typedef {Message[]} ChatHistory
 */
export type ChatHistory = Message[];

/**
 * Example usage (for demonstration, not part of the exported types):
 *
 * const sampleChatHistory: ChatHistory = [
 * { role: 'user', content: 'Hello, how are you?' },
 * { role: 'assistant', content: 'I am an AI, so I do not have feelings, but I am ready to assist you!' },
 * { role: 'user', content: 'Tell me a joke.' },
 * { role: 'assistant', content: 'Why don\'t scientists trust atoms? Because they make up everything!' },
 * ];
 */

// --- Chat Context Type ---

/**
 * Defines the shape of the context provider for the chat application.
 * This includes state variables and their respective setter functions for
 * managing the current prompt, chat history, and data fetching status.
 * @typedef {Object} ChatContextType
 * @property {string} currentPrompt - The current text input in the chat box.
 * @property {(prompt: string) => void} setCurrentPrompt - Function to update the current prompt.
 * @property {ChatHistory} chatHistory - The array of messages representing the conversation.
 * @property {(history: ChatHistory) => void} setChatHistory - Function to update the entire chat history.
 * @property {boolean} isFetchingData - A boolean indicating if data (e.g., assistant response) is currently being fetched.
 * @property {(fetching: boolean) => void} setIsFetchingData - Function to set the data fetching status.
 * @property {string | null} latestAssistantResponseContent - The content of the most recently fetched assistant response, or null if none.
 * @property {(content: string | null) => void} setLatestAssistantResponseContent - Function to set the content of the latest assistant response.
 */
export type ChatContextType = {
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  chatHistory: ChatHistory;
  setChatHistory: (history: ChatHistory) => void;
  isFetchingData: boolean;
  setIsFetchingData: (fetching: boolean) => void;
  latestAssistantResponseContent: string | null;
  setLatestAssistantResponseContent: (content: string | null) => void;
};


/**
 * Defines the structure of the data object returned from the NLQ (Natural Language Query) API.
 * This type includes various fields that represent the different components
 * of a natural language query's response, such as visualization data,
 * a summary, the main data results, and information from a code interpreter.
 *
 * @property {Record<string, any>} vis - An object intended to hold visualization-related properties.
 * It is typically an empty object if no visualization is generated,
 * but can contain various key-value pairs when visualization data is present.
 * @property {string} summary - A string containing a summary or natural language explanation of the query result.
 * This is typically an empty string if no summary is provided.
 * @property {any[]} data - An array containing the primary data results from the query.
 * The structure of elements within this array can vary depending on the query.
 * @property {any[]} code_interpreter - An array containing information related to code interpretation or execution,
 * potentially including code snippets, execution results, or errors.
 */
export interface CaApiResponse {
  vis: Record<string, any>;
  summary: string;
  data: any[];
  code_interpreter: any[];
}