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

/**
 * Defines the structure for individual group mappings within an OIDC configuration,
 * including a role ID.
 *
 * @property {string} id - A unique identifier for the group mapping.
 * @property {string} [looker_group_id] - An optional ID corresponding to a Looker group.
 * @property {string} looker_group_name - The name of the Looker group.
 * @property {string} name - The name of the group.
 * @property {string[]} role_ids - An array of role IDs associated with this group.
 */
export interface GroupWithRoleId {
  id: string;
  looker_group_id?: string; // Made optional
  looker_group_name: string;
  name: string;
  role_ids: string[];
}

/**
 * Defines a comprehensive interface for the OpenID Connect (OIDC) configuration object.
 * This type encompasses various settings and properties related to OIDC authentication
 * and user provisioning within a system.
 *
 * @property {boolean} [alternate_email_login_allowed] - Indicates if logging in with an alternate email is allowed.
 * @property {string} [audience] - The audience for the OIDC client.
 * @property {boolean} [auth_requires_role] - Specifies if authentication requires a role to be present.
 * @property {string} [authorization_endpoint] - The OIDC authorization endpoint URL.
 * @property {any[]} [default_new_user_groups] - An array of groups to which new users are added by default.
 * @property {any[]} [default_new_user_roles] - An array of roles assigned to new users by default.
 * @property {boolean} [enabled] - Indicates if the OIDC configuration is enabled.
 * @property {any[]} [groups] - An array of groups configured for OIDC (primarily superseded by `groups_with_role_ids`).
 * @property {string} [groups_attribute] - The attribute in the OIDC response that contains group information.
 * @property {string} [identifier] - The client identifier for the OIDC application.
 * @property {string} [issuer] - The OIDC issuer URL.
 * @property {string} [modified_at] - Timestamp of the last modification.
 * @property {string} [modified_by] - The user who last modified the configuration.
 * @property {string} [new_user_migration_types] - Specifies migration types for new users.
 * @property {string[]} [scopes] - An array of OIDC scopes requested.
 * @property {boolean} [set_roles_from_groups] - Indicates if user roles should be set based on OIDC groups.
 * @property {string} [test_slug] - A slug used for testing the OIDC configuration.
 * @property {string} [token_endpoint] - The OIDC token endpoint URL.
 * @property {string} [user_attribute_map_email] - The user attribute map for email.
 * @property {string} [user_attribute_map_first_name] - The user attribute map for first name.
 * @property {string} [user_attribute_map_last_name] - The user attribute map for last name.
 * @property {any[]} [user_attributes] - An array of user attributes configured for OIDC.
 * @property {string} [userinfo_endpoint] - The OIDC user info endpoint URL.
 * @property {boolean} [allow_normal_group_membership] - Indicates if normal group membership is allowed.
 * @property {boolean} [allow_roles_from_normal_groups] - Indicates if roles can be derived from normal groups.
 * @property {boolean} [allow_direct_roles] - Indicates if direct roles can be assigned.
 * @property {GroupWithRoleId[]} [groups_with_role_ids] - An array of group mappings, each including role IDs.
 * @property {any[]} [user_attributes_with_ids] - An array of user attributes with associated IDs.
 * @property {string} [url] - The URL associated with the OIDC configuration.
 * @property {object} [can] - An object defining user permissions related to this configuration.
 * @property {boolean} [can.show] - Permission to show the configuration.
 * @property {boolean} [can.view_in_ui] - Permission to view the configuration in the UI.
 * @property {boolean} [can.test] - Permission to test the configuration.
 * @property {boolean} [can.update] - Permission to update the configuration.
 */
export interface OidcConfig {
  alternate_email_login_allowed?: boolean;
  audience?: string;
  auth_requires_role?: boolean;
  authorization_endpoint?: string;
  default_new_user_groups?: any[]; // Using any[] for simplicity, could be more specific
  default_new_user_roles?: any[]; // Using any[] for simplicity
  enabled?: boolean;
  groups?: any[]; // Using any[] for simplicity, as only groups_with_role_ids is primarily used
  groups_attribute?: string;
  identifier?: string;
  issuer?: string;
  modified_at?: string;
  modified_by?: string;
  new_user_migration_types?: string;
  scopes?: string[];
  set_roles_from_groups?: boolean;
  test_slug?: string;
  token_endpoint?: string;
  user_attribute_map_email?: string;
  user_attribute_map_first_name?: string;
  user_attribute_map_last_name?: string;
  user_attributes?: any[]; // Using any[] for simplicity
  userinfo_endpoint?: string;
  allow_normal_group_membership?: boolean;
  allow_roles_from_normal_groups?: boolean;
  allow_direct_roles?: boolean;
  groups_with_role_ids?: GroupWithRoleId[];
  user_attributes_with_ids?: any[]; // Using any[] for simplicity
  url?: string;
  can?: {
    show?: boolean;
    view_in_ui?: boolean;
    test?: boolean;
    update?: boolean;
  };
}