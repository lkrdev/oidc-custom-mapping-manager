import React, { useContext, useEffect, useState } from 'react';
import { ExtensionContext, ExtensionContextData } from '@looker/extension-sdk-react';
import { GroupWithRoleId, OidcConfig } from '../types';

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
  const [proposedNewMapping, setProposedNewMapping] = useState<GroupWithRoleId[] | null>(null);

  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [bulkInput, setBulkInput] = useState<string>('');

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

  const handleAddRow = () => {
    let mappingsToPropose: GroupWithRoleId[] = [];

    if (activeTab === 'single') {
      if (!newRowData.name) {
        console.warn("Name is required to add a new row.");
        return;
      }
      const newId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
      const singleMapping: GroupWithRoleId = {
        id: newId,
        looker_group_id: newRowData.looker_group_id || '', // Optional
        looker_group_name: newRowData.looker_group_name || newRowData.name || '',
        name: newRowData.name,
        role_ids: newRowData.role_ids || [],
      };
      mappingsToPropose = [singleMapping];
    } else { // activeTab === 'bulk'
      if (!bulkInput.trim()) {
        console.warn("Bulk input cannot be empty.");
        return;
      }
      try {
        mappingsToPropose = parseBulkInput(bulkInput);
        if (mappingsToPropose.length === 0) {
          console.warn("No valid mappings parsed from bulk input. Please check the format.");
          return;
        }
      } catch (error) {
        console.error("Error parsing bulk input:", error);
        console.warn("An error occurred while parsing bulk input. Please check the format.");
        return;
      }
    }

    setProposedNewMapping(mappingsToPropose);
    setShowConfirmBanner(true);
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
      const updatedMappings = [...mappings, ...proposedNewMapping];
      setMappings(updatedMappings);

      // Clear forms after successful addition
      setNewRowData({ id: '', looker_group_id: '', looker_group_name: '', name: '', role_ids: [] });
      setBulkInput('');

      // Persist changes to Looker's OIDC config
      try {
        await core40SDK.ok(core40SDK.update_oidc_config({ "groups_with_role_ids": updatedMappings }));
        console.log("OIDC config updated successfully!");
      } catch (error) {
        console.error("Error updating OIDC config:", error);
        // Optionally, revert mappings or show an error message to the user
      }
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
        <div className="tab-buttons">
          <button
            className={activeTab === 'single' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('single')}
          >
            Add Single Row
          </button>
          <button
            className={activeTab === 'bulk' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk Add Multiple Rows
          </button>
        </div>

        {activeTab === 'single' && (
          <div className="single-row-form-content">
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
          </div>
        )}

        {activeTab === 'bulk' && (
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

        <button onClick={handleAddRow}>Add Row</button>
      </div>
      </div>

     {showConfirmBanner && proposedNewMapping && (
        <>
          <div className="overlay"></div>
          <div className="confirmation-banner">
            <h3>Confirm Data Modification</h3>
            <p>
              You are about to add <strong>{proposedNewMapping.length}</strong> new row(s) to the table.
              <br />
              Current number of rows: <strong>{mappings.length}</strong>
              <br />
              Proposed new total: <strong>{mappings.length + proposedNewMapping.length}</strong>
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
    </div>
  );
};

export default AdminPage;