import React, { useContext, useEffect, useState } from 'react';
import { ExtensionContext, ExtensionContextData } from '@looker/extension-sdk-react';

// Define the interface for individual group mappings with role IDs
interface GroupWithRoleId {
  id: string;
  looker_group_id?: string; // Made optional
  looker_group_name: string;
  name: string;
  role_ids: string[];
}

// Define a more comprehensive interface for the full OIDC Config object
interface OidcConfig {
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

/**
 * A simple Admin Page component displaying OIDC configuration metadata
 * and a table of group mappings with pagination and add functionality.
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
  const { extensionSDK, tileHostData, core40SDK, lookerHostData } = useContext(ExtensionContext) as ExtensionContextData;
  const [admin, setAdmin] = useState(true);
  const [oidcConfigData, setOidcConfigData] = useState<OidcConfig | null>(defaultOIDCConfig);
  const [mappings, setMappings] = useState<GroupWithRoleId[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [newRowData, setNewRowData] = useState<Partial<GroupWithRoleId>>({
    id: '',
    looker_group_id: '',
    looker_group_name: '',
    name: '',
    role_ids: [],
  });

  const [showConfirmBanner, setShowConfirmBanner] = useState<boolean>(false);
  const [proposedNewMapping, setProposedNewMapping] = useState<GroupWithRoleId | null>(null);

  // Function to fetch OIDC configuration
  const getOidcConfig = async (): Promise<OidcConfig> => {
    try {
      const oidcConfig = await core40SDK.ok(core40SDK.oidc_config());
      setAdmin(true)
      return oidcConfig as OidcConfig;
    } catch (error) {
      console.error("Error fetching OIDC config:", error);
      setAdmin(false)
      return {};
    }
  };

  // Effect to load data on component mount
  useEffect(() => {
    (async function fetchOidcConfig() {
      const config = await getOidcConfig();
      setOidcConfigData(config); // Store the full config
      if (config && Array.isArray(config.groups_with_role_ids)) {
        setMappings(config.groups_with_role_ids as GroupWithRoleId[]);
      } else {
        console.warn("groups_with_role_ids not found or is not an array in config.");
      }
    })();
  }, [core40SDK]);

  // Pagination Logic
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

  const handleNewRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRowData(prev => ({
      ...prev,
      [name]: name === 'role_ids' ? value.split(',').map(s => s.trim()) : value,
    }));
  };

  const handleAddRow = () => {
    if (newRowData.name) { // Only 'name' is strictly required now
      const newId = Date.now().toString(); // Simple unique ID
      const newMapping: GroupWithRoleId = {
        id: newId,
        looker_group_id: newRowData.looker_group_id || '', // Optional
        looker_group_name: newRowData.looker_group_name || newRowData.name || '',
        name: newRowData.name,
        role_ids: newRowData.role_ids || [],
      };
      setProposedNewMapping(newMapping);
      setShowConfirmBanner(true);
    } else {
      console.warn("Name is required to add a new row.");
    }
  };

//   const loadTest = () => {
//     const data = []
//     for(let i = 302; i <= 500; i++) {
//         data.push({
//             id: i,
//             looker_group_name: `Test ${i}`,
//             name: `Test ${i}`,
//             role_ids: ["2"],
//         })
//     }
//     return data
//   }

  const confirmAddRow = async () => {
    if (proposedNewMapping) {
      const updateMappings = [...mappings, proposedNewMapping]
      setMappings(updateMappings);
    //   const load = loadTest()
      // Clear form
      setNewRowData({ id: '', looker_group_id: '', looker_group_name: '', name: '', role_ids: [] });
      await core40SDK.ok(core40SDK.update_oidc_config({"groups_with_role_ids": updateMappings}))
    }
    setShowConfirmBanner(false);
    setProposedNewMapping(null);
  };

  const cancelAddRow = () => {
    setShowConfirmBanner(false);
    setProposedNewMapping(null);
  };

  if(!admin) {
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

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>OIDC Admin Page</h1>
        <p>Manage your OIDC configuration and group-to-role mappings here.</p>
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
            {/* Add more metadata fields as desired */}
            </div>
        )}
        </div>
        <div>
            <h1>Custom OIDC Group to Looker Group Mapping</h1>
            <p>Manage your OIDC configuration and group-to-role mappings here.</p>
            <div className="table-section">
                <div className="table-wrapper-scroll">
                <table className="data-table">
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Looker Group ID</th>
                    <th>Looker Group Name</th>
                    <th>Name</th>
                    <th>Role IDs</th>
                    </tr>
                </thead>
                <tbody>
                    {currentRows.length > 0 ? (
                    currentRows.map((mapping, index) => (
                        <tr key={mapping.id || index}> {/* Use mapping.id if available, fallback to index */}
                        <td data-label="ID">{mapping.id}</td>
                        <td data-label="Looker Group ID">{mapping.looker_group_id || 'N/A'}</td>
                        <td data-label="Looker Group Name">{mapping.looker_group_name}</td>
                        <td data-label="Name">{mapping.name}</td>
                        <td data-label="Role IDs">{mapping.role_ids.join(', ')}</td>
                        </tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No data available.</td>
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

            <div className="add-row-form">
                <h2>Add New Mapping</h2>
                <div className="form-group">
                <label htmlFor="looker_group_id">Looker Group ID (Optional):</label>
                <input
                    type="text"
                    id="looker_group_id"
                    name="looker_group_id"
                    value={newRowData.looker_group_id || ''}
                    onChange={handleNewRowChange}
                    placeholder="e.g., 6"
                />
                </div>
                <div className="form-group">
                <label htmlFor="looker_group_name">Looker Group Name (Optional):</label>
                <input
                    type="text"
                    id="looker_group_name"
                    name="looker_group_name"
                    value={newRowData.looker_group_name || ''}
                    onChange={handleNewRowChange}
                    placeholder="e.g., Test Group Name"
                />
                </div>
                <div className="form-group">
                <label htmlFor="name">Name:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={newRowData.name || ''}
                    onChange={handleNewRowChange}
                    placeholder="e.g., Custom Name"
                />
                </div>
                <div className="form-group">
                <label htmlFor="role_ids">Role IDs (comma-separated):</label>
                <input
                    type="text"
                    id="role_ids"
                    name="role_ids"
                    value={newRowData.role_ids ? newRowData.role_ids.join(', ') : ''}
                    onChange={handleNewRowChange}
                    placeholder="e.g., 2, 5"
                />
                </div>
                <button onClick={handleAddRow}>Add Row</button>
            </div>
        </div>
      </div>

      {showConfirmBanner && (
        <>
          <div className="overlay"></div>
          <div className="confirmation-banner">
            <h3>Confirm Data Modification</h3>
            <p>
              You are about to add a new row to the table.
              <br />
              Current number of rows: <strong>{mappings.length}</strong>
              <br />
              Proposed new total: <strong>{mappings.length + 1}</strong>
            </p>
            <p>Do you want to confirm this change?</p>
            <div className="confirmation-buttons">
              <button className="confirm-button" onClick={confirmAddRow}>Confirm</button>
              <button className="cancel-button" onClick={cancelAddRow}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPage;