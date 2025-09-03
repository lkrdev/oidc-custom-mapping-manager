

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { ExtensionContext, ExtensionContextData } from '@looker/extension-sdk-react';
import { LookerSDKError } from '@looker/sdk-rtl';
import { OidcConfig, GroupWithRoleId } from '../types';

// Define the shape of the context state
interface AdminContextState {
  oidcConfigData: OidcConfig | null;
  mappings: GroupWithRoleId[];
  admin: boolean;
  formData: Partial<GroupWithRoleId>;
  bulkInput: string;
  activeTab: 'single' | 'bulk';
  modalActionType: 'add' | 'update' | 'delete' | null;
  currentRowForAction: GroupWithRoleId | null;
  showConfirmBanner: boolean;
  addEditFormRef: React.RefObject<HTMLDivElement>;
  currentPage: number;
  rowsPerPage: number;
  apiError: string | null;
  oidcTestState: 'Running Test' | 'Test Failed' | 'Test Successfull' | 'Updating OIDC Config' | 'Finished' | null;
  
  // State setters and handlers
  setFormData: React.Dispatch<React.SetStateAction<Partial<GroupWithRoleId>>>;
  setBulkInput: React.Dispatch<React.SetStateAction<string>>;
  setActiveTab: React.Dispatch<React.SetStateAction<'single' | 'bulk'>>;
  setModalActionType: React.Dispatch<React.SetStateAction<'add' | 'update' | 'delete' | null>>;
  setCurrentRowForAction: React.Dispatch<React.SetStateAction<GroupWithRoleId | null>>;
  setShowConfirmBanner: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setRowsPerPage: React.Dispatch<React.SetStateAction<number>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Functions
  updateOidcConfigMappings: (updatedMappings: GroupWithRoleId[]) => Promise<void>;
  handleDeleteClick: (row: GroupWithRoleId) => void;
  handleEditClick: (row: GroupWithRoleId) => void;
  handleFormSubmit: () => void;
  confirmAction: () => Promise<void>;
  cancelAction: () => void;
  handleFormInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  parseBulkInput: (input: string) => GroupWithRoleId[];
  handleDownloadConfig: () => void;
}

// Create the context
const AdminContext = createContext<AdminContextState | undefined>(undefined);

// Create the provider component
export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { core40SDK } = useContext(ExtensionContext) as ExtensionContextData;

  const defaultOIDCConfig: OidcConfig = {
    alternate_email_login_allowed: false,
    audience: '',
    auth_requires_role: false,
    authorization_endpoint: '',
    default_new_user_groups: [],
    default_new_user_roles: [],
    enabled: false,
    groups: [],
    groups_attribute: '',
    identifier: '',
    issuer: '',
    modified_at: '',
    modified_by: '',
    new_user_migration_types: '',
    scopes: [],
    set_roles_from_groups: false,
    test_slug: '',
    token_endpoint: '',
    user_attribute_map_email: '',
    user_attribute_map_first_name: '',
    user_attribute_map_last_name: '',
    user_attributes: [],
    userinfo_endpoint: '',
    allow_normal_group_membership: false,
    allow_roles_from_normal_groups: false,
    allow_direct_roles: false,
    groups_with_role_ids: [],
    user_attributes_with_ids: [],
    url: '',
    can: {
        show: false,
        view_in_ui: false,
        test: false,
        update: false,
    },
  };

  const [oidcConfigData, setOidcConfigData] = useState<OidcConfig | null>(defaultOIDCConfig);
  const [mappings, setMappings] = useState<GroupWithRoleId[]>([]);
  const [admin, setAdmin] = useState(true);

  // Form and Modal State
  const [formData, setFormData] = useState<Partial<GroupWithRoleId>>({});
  const [bulkInput, setBulkInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // State to manage the action type (add, update, delete) and the row being acted upon
  const [modalActionType, setModalActionType] = useState<'add' | 'update' | 'delete' | null>(null);
  const [currentRowForAction, setCurrentRowForAction] = useState<GroupWithRoleId | null>(null);
  const [showConfirmBanner, setShowConfirmBanner] = useState<boolean>(false);
  const addEditFormRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Looker SDK Error State
  const [apiError, setApiError] = useState<string | null>(null);

  // OIDC test state
  const [oidcTestState, setOidcTestState] = useState<'Running Test' | 'Test Failed' | 'Test Successfull' | 'Updating OIDC Config' | 'Finished' | null>(null);

  // Function to fetch OIDC configuration
  const getOidcConfig = async (): Promise<OidcConfig> => {
    try {
      const oidcConfig = await core40SDK.ok(core40SDK.oidc_config());
      setAdmin(true);
      return oidcConfig as OidcConfig;
    } catch (error) {
      console.error("Error fetching OIDC config:", error);
      setAdmin(false);
      return {} as OidcConfig;
    }
  };

  // Effect to load data on component mount
  useEffect(() => {
    (async function fetchOidcConfig() {
      const config = await getOidcConfig();
      setOidcConfigData(config);
      if (config && Array.isArray(config.groups_with_role_ids)) {
        const mappingsWithIds = config.groups_with_role_ids.map((m, index) => ({
          ...m,
          id: m.id || '',
        }));
        setMappings(mappingsWithIds as GroupWithRoleId[]);
      } else {
        console.warn("groups_with_role_ids not found or is not an array in config.");
      }
    })();
  }, [core40SDK]);

  const updateOidcConfigMappings = useCallback(async (updatedMappings: GroupWithRoleId[]) => {
    try {
        const { groups_with_role_ids, ...newOidcConfigTest } = oidcConfigData!
        setOidcTestState('Running Test')
        await core40SDK.ok(core40SDK.create_oidc_test_config({ "groups_with_role_ids": updatedMappings, ...newOidcConfigTest }))
        setOidcTestState('Test Successfull')
        setTimeout(() => setOidcTestState('Updating OIDC Config'), 2000)
        await core40SDK.ok(core40SDK.update_oidc_config({ "groups_with_role_ids": updatedMappings }));
        setMappings(updatedMappings);
        setOidcTestState('Finished')
        console.log("OIDC config updated successfully!");
    } catch (error) {
        if (error instanceof LookerSDKError) {
            setOidcTestState('Test Failed')
            const formattedErrors = error.errors?.map(e => e.message).join('\n') || error.message;
            setApiError(formattedErrors);
            console.error("Looker SDK Error updating OIDC config:", error.errors);
        } else {
            console.error("An unexpected error occurred:", error);
            setApiError("An unexpected error occurred. Please check the console for more details.");
        }
    } finally {
        setShowConfirmBanner(false);
        setModalActionType(null);
        setCurrentRowForAction(null);
        setFormData({});
        setBulkInput('');
        setOidcTestState(null);
    }
  },[oidcConfigData]);

  const handleDeleteClick = (row: GroupWithRoleId) => {
    setModalActionType('delete');
    setCurrentRowForAction(row);
    setShowConfirmBanner(true);
  };

  const handleEditClick = (row: GroupWithRoleId) => {
    setModalActionType('update');
    setCurrentRowForAction(row);
    setFormData({
      ...row,
      role_ids: Array.isArray(row.role_ids) ? row.role_ids.join(', ') : '',
    });
    setActiveTab('single');
    addEditFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSubmit = () => {
    if (activeTab === 'single') {
      if (!formData.name) {
        console.warn("Name is required.");
        return;
      }
      setModalActionType(currentRowForAction ? 'update' : 'add');
    } else {
      if (!bulkInput.trim()) {
        console.warn("Bulk input cannot be empty.");
        return;
      }
      setModalActionType('add');
    }
    setShowConfirmBanner(true);
  };

  const confirmAction = async () => {
    let updatedMappings: GroupWithRoleId[] = [];

    switch (modalActionType) {
      case 'add':
        const newMappings = activeTab === 'single'
          ? [{
              ...formData,
              id: Date.now().toString() + "-" + formData.name,
              looker_group_name: formData.looker_group_name || formData.name,
              role_ids: typeof formData.role_ids === 'string' ? formData.role_ids.split(',').map(s => s.trim()).filter(Boolean) : [],
            } as GroupWithRoleId]
          : parseBulkInput(bulkInput);

        if (newMappings.length === 0) {
          console.warn("No valid mappings to add.");
          setShowConfirmBanner(false);
          return;
        }
        updatedMappings = [...mappings, ...newMappings];
        break;

      case 'update':
        if (!currentRowForAction) return;
        updatedMappings = mappings.map(m =>
          m.id === currentRowForAction.id ? { ...m, ...formData, role_ids: typeof formData.role_ids === 'string' ? formData.role_ids.split(',').map(s => s.trim()).filter(Boolean) : m.role_ids } as GroupWithRoleId : m
        );
        break;

      case 'delete':
        if (!currentRowForAction) return;
        updatedMappings = mappings.filter(m => m.id !== currentRowForAction.id);
        break;

      default:
        return;
    }

    await updateOidcConfigMappings(updatedMappings);
  };

  const cancelAction = () => {
    setShowConfirmBanner(false);
    setModalActionType(null);
    setCurrentRowForAction(null);
    setFormData({});
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const extractAndSortIds = (mappings: GroupWithRoleId[]): number[] => {
    return mappings
      .map(mapping => Number(mapping.id))
      .filter(value => !isNaN(value))
      .sort((a,b) => b - a)
  }

  const parseBulkInput = useCallback((input: string): GroupWithRoleId[] => {
    const lines = input.split('\n');
    const parsedMappings: GroupWithRoleId[] = [];

    lines.forEach((line,index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const parts = trimmedLine.split(',').map(part => part.trim());

      if (parts.length < 3 || !parts[2]) {
        console.warn(`Skipping malformed line: "${trimmedLine}". Name is required (third comma-separated value).`);
        return;
      }
      
      const newId = extractAndSortIds(mappings)[0] + (index+1);
      const lookerGroupId = parts[0] || '';
      const lookerGroupName = parts[1] || parts[2] || '';
      const name = parts[2];
      const roleIds = parts.slice(3).flatMap(r => r.split(',').map(s => s.trim()).filter(s => s));

      parsedMappings.push({
        id: newId.toString(),
        looker_group_id: lookerGroupId,
        looker_group_name: lookerGroupName,
        name: name,
        role_ids: roleIds,
      });
    });

    return parsedMappings;
  },[mappings]);

  const handleDownloadConfig = () => {
    if (!oidcConfigData) {
      console.error("Cannot download config: OIDC config data is not loaded.");
      return;
    }

    const fullConfigToDownload = {
      ...oidcConfigData,
      groups_with_role_ids: mappings,
    };

    const jsonString = JSON.stringify(fullConfigToDownload, null, 2);
    const blob = new Blob([jsonString], { type: 'text/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `oidc_config_backup_${timestamp}.json`;

    document.body.appendChild(link);
    link.href = url;
    link.setAttribute('download', filename);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const value = {
    oidcConfigData,
    mappings,
    admin,
    formData,
    bulkInput,
    activeTab,
    modalActionType,
    currentRowForAction,
    showConfirmBanner,
    addEditFormRef,
    currentPage,
    rowsPerPage,
    apiError,
    oidcTestState,
    setFormData,
    setBulkInput,
    setActiveTab,
    setModalActionType,
    setCurrentRowForAction,
    setShowConfirmBanner,
    setCurrentPage,
    setRowsPerPage,
    setApiError,
    updateOidcConfigMappings,
    handleDeleteClick,
    handleEditClick,
    handleFormSubmit,
    confirmAction,
    cancelAction,
    handleFormInputChange,
    parseBulkInput,
    handleDownloadConfig,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

// Custom hook to use the AdminContext
export const useAdmin = (): AdminContextState => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
