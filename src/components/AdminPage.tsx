import React, { useContext, useEffect, useState, useRef } from 'react'; // NEW: Added useRef
import { ExtensionContext, ExtensionContextData } from '@looker/extension-sdk-react';
import { LookerSDKError } from '@looker/sdk-rtl';
import { GroupWithRoleId, OidcConfig } from '../types';

/**
 * A simple Admin Page component displaying OIDC configuration metadata
 * and a table of group mappings with CRUD functionality.
 */
const AdminPage: React.FC = () => {
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
    const { core40SDK } = useContext(ExtensionContext) as ExtensionContextData;

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
    const addEditFormRef = useRef<HTMLDivElement>(null); // NEW: Ref for scrolling to the form

    // Pagination State
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);

    // Looker SDK Error State
    const [apiError, setApiError] = useState<string | null>(null);

    // OIDC test state
    const [oidcTestState, setOidcTestState] = useState<'Running Test' | 'Test Failed' | 'Test Successfull' | 'Updating OIDC Config' | null>(null)

    // Function to fetch OIDC configuration
    const getOidcConfig = async (): Promise<OidcConfig> => {
        try {
            const oidcConfig = await core40SDK.ok(core40SDK.oidc_config());
            setAdmin(true);
            return oidcConfig as OidcConfig;
        } catch (error) {
            console.error("Error fetching OIDC config:", error);
            setAdmin(false);
            return {};
        }
    };

    // Effect to load data on component mount
    useEffect(() => {
        (async function fetchOidcConfig() {
            const config = await getOidcConfig();
            setOidcConfigData(config);
            if (config && Array.isArray(config.groups_with_role_ids)) {
                // Ensure each mapping has a unique, stable ID for React keys
                const mappingsWithIds = config.groups_with_role_ids.map((m, index) => ({
                    ...m,
                    // Use existing ID or create one if it's missing
                    id: m.id || `${Date.now()}-${index}`,
                }));
                setMappings(mappingsWithIds as GroupWithRoleId[]);
            } else {
                console.warn("groups_with_role_ids not found or is not an array in config.");
            }
        })();
    }, [core40SDK]);

    // --- Utility and Handler Functions ---

    /**
     * A single, optimized function to update the OIDC config on the backend.
     */
    const updateOidcConfigMappings = async (updatedMappings: GroupWithRoleId[]) => {
        try {
            const { groups_with_role_ids, ...newOidcConfigTest } = oidcConfigData
            // Run Test
            setOidcTestState('Running Test')
            await core40SDK.ok(core40SDK.create_oidc_test_config({ "groups_with_role_ids": updatedMappings, ...newOidcConfigTest }))
            // Continue with update if test passes
            setOidcTestState('Test Successfull')
            setTimeout(() => setOidcTestState('Updating OIDC Config'), 2000)
            await core40SDK.ok(core40SDK.update_oidc_config({ "groups_with_role_ids": updatedMappings }));
            setMappings(updatedMappings); // Update local state on success
            console.log("OIDC config updated successfully!");
        } catch (error) {
            if (error instanceof LookerSDKError) {
                setOidcTestState('Test Failed')
                // Format the specific error messages from the Looker SDK
                const formattedErrors = error.errors?.map(e => e.message).join('\n') || error.message;
                setApiError(formattedErrors);
                console.error("Looker SDK Error updating OIDC config:", error.errors);
            } else {
                // Handle generic JavaScript errors
                console.error("An unexpected error occurred:", error);
                setApiError("An unexpected error occurred. Please check the console for more details.");
            }
        } finally {
            // Reset all action-related state
            setShowConfirmBanner(false);
            setModalActionType(null);
            setCurrentRowForAction(null);
            setFormData({});
            setBulkInput('');
        }
    };


    // --- Action Handlers ---

    // Handler to initiate deleting a row
    const handleDeleteClick = (row: GroupWithRoleId) => {
        setModalActionType('delete');
        setCurrentRowForAction(row);
        setShowConfirmBanner(true);
    };

    // Handler to initiate editing a row
    const handleEditClick = (row: GroupWithRoleId) => {
        setModalActionType('update');
        setCurrentRowForAction(row);
        setFormData({
            ...row,
            role_ids: Array.isArray(row.role_ids) ? row.role_ids : [],
        });
        setActiveTab('single'); // Switch to the single row form for editing
        addEditFormRef.current?.scrollIntoView({ behavior: 'smooth' }); // Scroll to form
    };

    
    const handleFormSubmit = () => {
        if (activeTab === 'single') {
            if (!formData.name) {
                console.warn("Name is required.");
                return;
            }
            // If currentRowForAction exists, we are in "update" mode.
            // Otherwise, it's a new "add" action.
            setModalActionType(currentRowForAction ? 'update' : 'add');
        } else { // bulk add
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
                        id: Date.now().toString() + "-" + formData.name, // Ensure a unique ID
                        looker_group_name: formData.looker_group_name || formData.name,
                        role_ids: formData.role_ids || [],
                    } as GroupWithRoleId]
                    : parseBulkInput(bulkInput);

                if (newMappings.length === 0) {
                    console.warn("No valid mappings to add.");
                    setShowConfirmBanner(false); // Close banner if no action is taken
                    return;
                }
                updatedMappings = [...mappings, ...newMappings];
                break;

            case 'update':
                if (!currentRowForAction) return;
                updatedMappings = mappings.map(m =>
                    m.id === currentRowForAction.id ? { ...m, ...formData } as GroupWithRoleId : m
                );
                break;

            case 'delete':
                if (!currentRowForAction) return;
                updatedMappings = mappings.filter(m => m.id !== currentRowForAction.id);
                break;

            default:
                return; // Do nothing if action type is null
        }

        await updateOidcConfigMappings(updatedMappings);
    };

    // MODIFIED: Generic cancel handler
    const cancelAction = () => {
        setShowConfirmBanner(false);
        setModalActionType(null);
        setCurrentRowForAction(null);
        setFormData({}); // Clear form data on cancel
    };

    const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'role_ids' ? value.split(',').map(s => s.trim()).filter(Boolean) : value,
        }));
    };

    // Helper function to parse bulk input
    const parseBulkInput = (input: string): GroupWithRoleId[] => {
        const lines = input.split('\n');
        const parsedMappings: GroupWithRoleId[] = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return; // Skip empty lines

            // Expected format: looker_group_id (optional), looker_group_name (optional), name (required), role_ids (comma-separated, optional)
            const parts = trimmedLine.split(',').map(part => part.trim());

            // Basic validation: ensure 'name' part (index 2) is present
            if (parts.length < 3 || !parts[2]) {
                console.warn(`Skipping malformed line: "${trimmedLine}". Name is required (third comma-separated value).`);
                return;
            }

            // Generate a more unique ID for each bulk-added row
            const newId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
            const lookerGroupId = parts[0] || '';
            // Default looker_group_name to 'name' if not provided
            const lookerGroupName = parts[1] || parts[2] || '';
            const name = parts[2];
            // Role IDs: handle cases where it might be empty or contain multiple comma-separated IDs in the last part
            const roleIds = parts.slice(3).flatMap(r => r.split(',').map(s => s.trim()).filter(s => s));

            parsedMappings.push({
                id: newId,
                looker_group_id: lookerGroupId,
                looker_group_name: lookerGroupName,
                name: name,
                role_ids: roleIds,
            });
        });

        return parsedMappings;
    };

    // Pagination Logic (remains the same)
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = mappings.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(mappings.length / rowsPerPage);
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when rows per page changes
    };

    // --- Render Logic ---

    if (!admin) {
        return (
            <div className="container">
                <div className="card">
                    <h2 className="title">
                        Permission Denied
                    </h2>
                    <p className="message">
                        You do not have the appropriate permissions to edit the OIDC configuration.
                        Please contact your Looker administrator for assistance.
                    </p>
                    <div className="icon-container">
                        {/* Optional: Add a subtle icon or illustration */}
                        <svg
                            className="icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>
        )
    }
    // NEW: Helper to generate dynamic content for the confirmation modal
    const renderConfirmationContent = () => {
        switch (modalActionType) {
            case 'add':
                const count = activeTab === 'single' ? 1 : parseBulkInput(bulkInput).length;
                return {
                    title: 'Confirm New Mappings',
                    message: `You are about to add ${count} new mapping(s).`,
                };
            case 'update':
                return {
                    title: 'Confirm Update',
                    message: `You are about to update the mapping for "${currentRowForAction?.name}".`,
                };
            case 'delete':
                return {
                    title: 'Confirm Deletion',
                    message: `Are you sure you want to delete the mapping for "${currentRowForAction?.name}"? This action cannot be undone.`,
                };
            default:
                return { title: '', message: '' };
        }
    };

    const confirmationContent = renderConfirmationContent();

    // Add this new handler function inside your AdminPage component

    const handleDownloadConfig = () => {
        if (!oidcConfigData) {
            console.error("Cannot download config: OIDC config data is not loaded.");
            // Optionally set an error state to show a message to the user
            return;
        }

        // 1. Assemble the most current configuration object.
        // This combines the base config with the latest 'mappings' from the state,
        // ensuring the downloaded file reflects exactly what the user sees.
        const fullConfigToDownload = {
            ...oidcConfigData,
            groups_with_role_ids: mappings, // Overwrite with the current, possibly unsaved, mappings
        };

        console.log(fullConfigToDownload)

        // 2. Convert the object to a nicely formatted JSON string.
        // The 'null, 2' argument adds indentation for readability.
        const jsonString = JSON.stringify(fullConfigToDownload, null, 2);

        // 3. Create a 'Blob' which is a file-like object of immutable, raw data.
        const blob = new Blob([jsonString], { type: 'text/json' });

        // 4. Create a temporary URL pointing to the Blob in the browser's memory.
        const url = window.URL.createObjectURL(blob);

        // 5. Create a temporary anchor (<a>) element to trigger the download.
        const link = document.createElement('a');

        // Set the filename for the download.
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `oidc_config_backup_${timestamp}.json`;

        // 6. Programmatically click the link to start the download, then clean up.
        document.body.appendChild(link);
        link.href = url
        link.setAttribute('download',filename)
        link.click();

        // 7. Remove the temporary link and revoke the object URL to free up memory.
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="admin-page-container">
                <h1>OIDC Admin Page</h1>
                <p>Manage your OIDC configuration and group-to-role mappings here.</p>
                <button onClick={handleDownloadConfig} className="download-config-button" aria-label="Copy and Download Configuration">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                </svg>
                Copy & Download Config
            </button>
            </div>
            <div className="admin-page-layout">
                <div>
                    {oidcConfigData && (
                        <div className="metadata-section">
                            <h2>Current OIDC Configuration Details</h2>
                            <div className="metadata-item">
                                <strong>Enabled:</strong> <span>{oidcConfigData.enabled ? 'Yes' : 'No'}</span>
                                <p className="description">Indicates if OIDC authentication is currently enabled.</p>
                            </div>
                            <div className="metadata-item">
                                <strong>Audience:</strong> <span>{oidcConfigData.audience || 'N/A'}</span>
                                <p className="description">The expected audience (client ID) for tokens.</p>
                            </div>
                            <div className="metadata-item">
                                <strong>Issuer:</strong> <span>{oidcConfigData.issuer || 'N/A'}</span>
                                <p className="description">The identifier of the identity provider.</p>
                            </div>
                            <div className="metadata-item">
                                <strong>Authorization Endpoint:</strong> <span>{oidcConfigData.authorization_endpoint || 'N/A'}</span>
                                <p className="description">URL for initiating authentication requests.</p>
                            </div>
                            <div className="metadata-item">
                                <strong>Token Endpoint:</strong> <span>{oidcConfigData.token_endpoint || 'N/A'}</span>
                                <p className="description">URL for exchanging authorization codes for tokens.</p>
                            </div>
                            <div className="metadata-item">
                                <strong>User Info Endpoint:</strong> <span>{oidcConfigData.userinfo_endpoint || 'N/A'}</span>
                                <p className="description">URL for retrieving user profile information.</p>
                            </div>
                            <div className="metadata-item">
                                <strong>Scopes:</strong>
                                {oidcConfigData.scopes && oidcConfigData.scopes.length > 0 ? (
                                    <ul>
                                        {oidcConfigData.scopes.map((scope, i) => (
                                            <li key={i}>{scope}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span>N/A</span>
                                )}
                                <p className="description">Permissions requested from the identity provider.</p>
                            </div>
                            <div className="metadata-item">
                                <strong>Groups Attribute:</strong> <span>{oidcConfigData.groups_attribute || 'N/A'}</span>
                                <p className="description">The user attribute used to map groups.</p>
                            </div>
                            <div className="metadata-item">
                                <strong>Set Roles from Groups:</strong> <span>{oidcConfigData.set_roles_from_groups ? 'Yes' : 'No'}</span>
                                <p className="description">If enabled, roles are assigned based on group memberships.</p>
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <div className="table-section">
                        <h1>Custom OIDC Group to Looker Group Mapping</h1>
                        <div className="table-wrapper-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Looker Group ID</th>
                                        <th>Looker Group Name</th>
                                        <th>Name</th>
                                        <th>Role IDs</th>
                                        <th>Actions</th> {/* New column for actions */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRows.length > 0 ? (
                                        currentRows.map((mapping, index) => (
                                            <tr key={mapping.id || index}>
                                                <td data-label="ID">{mapping.id}</td>
                                                <td data-label="Looker Group ID">{mapping.looker_group_id || 'N/A'}</td>
                                                <td data-label="Looker Group Name">{mapping.looker_group_name}</td>
                                                <td data-label="Name">{mapping.name}</td>
                                                <td data-label="Role IDs">{Array.isArray(mapping.role_ids) ? mapping.role_ids.join(', ') : ''}</td>
                                                <td data-label="Actions" className="action-cell">
                                                    {/* Edit Icon */}
                                                    <button
                                                        onClick={() => handleEditClick(mapping)}
                                                        className={`icon-button ${currentRowForAction?.id === mapping.id && modalActionType === 'update' ? 'active-edit' : ''
                                                            }`}
                                                        aria-label="Edit Mapping"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z" />
                                                        </svg>
                                                    </button>

                                                    {/* Delete Icon */}
                                                    <button
                                                        onClick={() => handleDeleteClick(mapping)}
                                                        className={`icon-button ${currentRowForAction?.id === mapping.id && modalActionType === 'delete' ? 'active-delete' : ''
                                                            }`}
                                                        aria-label="Delete Mapping"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No data available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="pagination-controls">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                Previous
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                Next
                            </button>
                            <div className="rows-per-page">
                                Rows per page:
                                <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="add-row-form" ref={addEditFormRef}>
                        {/* MODIFIED: Dynamic title and button text */}
                        <h2>{currentRowForAction ? 'Edit Mapping' : 'Add New Mapping'}</h2>

                        <div className="tab-buttons">
                            <button
                                className={activeTab === 'single' ? 'tab-button active' : 'tab-button'}
                                onClick={() => setActiveTab('single')}
                            >
                                Add Single Row
                            </button>
                            <button
                                className={activeTab === 'bulk' ? 'tab-button active' : 'tab-button'}
                                onClick={() => { setModalActionType('add'); setActiveTab('bulk') }}
                            >
                                Bulk Add Multiple Rows
                            </button>
                        </div>


                        {activeTab === 'single' && (
                            <div className="single-row-form-content">
                                {/* The database ID is only shown for existing rows and is not editable */}
                                {currentRowForAction && (
                                    <div className="form-group">
                                        <label htmlFor="id">Mapping ID:</label>
                                        <input
                                            type="text"
                                            id="id"
                                            name="id"
                                            value={formData.id || ''}
                                            disabled // This ID is never user-editable
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label htmlFor="looker_group_id">Looker Group ID (Optional):</label>
                                    <input
                                        type="text"
                                        id="looker_group_id"
                                        name="looker_group_id"
                                        value={formData.looker_group_id || ''}
                                        onChange={handleFormInputChange}
                                        placeholder="e.g., 6"
                                        // The link to the Looker Group should not change after creation.
                                        // It is enabled only when adding a new row.
                                        disabled={!!currentRowForAction}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="looker_group_name">Looker Group Name (Optional):</label>
                                    <input
                                        type="text"
                                        id="looker_group_name"
                                        name="looker_group_name"
                                        value={formData.looker_group_name || ''}
                                        onChange={handleFormInputChange}
                                        placeholder="e.g., Test Group Name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="name">Name:</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleFormInputChange}
                                        placeholder="e.g., Custom Name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="role_ids">Role IDs (comma-separated):</label>
                                    <input
                                        type="text"
                                        id="role_ids"
                                        name="role_ids"
                                        value={Array.isArray(formData.role_ids) ? formData.role_ids.join(', ') : ''}
                                        onChange={handleFormInputChange}
                                        placeholder="e.g., 2, 5"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'bulk' && ( // Bulk tab only for ADD
                            <div className="bulk-add-form-content">
                                <div className="form-group">
                                    <label htmlFor="bulk_mappings">Bulk Mappings:</label>
                                    <textarea
                                        id="bulk_mappings"
                                        name="bulk_mappings"
                                        rows={10}
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        placeholder={`Enter each mapping on a new line. For each line, provide comma-separated values in this order:\nlooker_group_id (optional), looker_group_name (optional), name (required), role_ids (comma-separated, optional)\n\nExample:\n6,Test Group,My Custom Name,2,5\n,,Another Group,1`}
                                    ></textarea>
                                    <p className="helper-text">
                                        <strong>Format:</strong> <code>looker_group_id</code> (optional), <code>looker_group_name</code> (optional), <code>name</code> (required), <code>role_ids</code> (comma-separated, optional)
                                        <br />
                                        Example: <code>6,Test Group,My Custom Name,2,5</code>
                                        <br />
                                        Example (optional fields empty): <code>,,Another Group,1</code>
                                    </p>
                                </div>
                            </div>
                        )}

                        <button onClick={handleFormSubmit}>
                            {/* MODIFIED: Dynamic button text */}
                            {currentRowForAction ? 'Update Row' : 'Add Row'}
                        </button>
                        {currentRowForAction && (
                            <button onClick={cancelAction} className="cancel-edit-button">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </div>
                {/* MODIFIED: Confirmation banner is now dynamic */}
                {showConfirmBanner && (
                    <>
                        <div className="overlay"></div>
                        <div className="confirmation-banner">
                            {oidcTestState && <span>{oidcTestState}</span>}
                            <h3>{confirmationContent.title}</h3>
                            <p>{confirmationContent.message}</p>
                            <div className="confirmation-buttons">
                                <button className="confirm-button" onClick={confirmAction}>Confirm</button>
                                <button className="cancel-button" onClick={cancelAction}>Cancel</button>
                            </div>
                        </div>
                    </>
                )}
                {apiError && (
                    <>
                        <div className="overlay"></div>
                        <div className="error-modal">
                            <h3>⚠️ Action Failed</h3>
                            <p className="error-message">
                                The operation could not be completed due to the following error(s):
                            </p>
                            <pre className="error-details">{apiError}</pre>
                            <button className="confirm-button" onClick={() => setApiError(null)}>
                                Close
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default AdminPage;