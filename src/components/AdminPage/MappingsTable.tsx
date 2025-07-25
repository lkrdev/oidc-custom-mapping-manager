
import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const MappingsTable: React.FC = () => {
  const { mappings, currentPage, rowsPerPage, handleEditClick, handleDeleteClick, modalActionType, currentRowForAction } = useAdmin();

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = mappings.slice(indexOfFirstRow, indexOfLastRow);

  return (
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
              <th>Actions</th>
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
                    <button
                      onClick={() => handleEditClick(mapping)}
                      className={`icon-button ${currentRowForAction?.id === mapping.id && modalActionType === 'update' ? 'active-edit' : ''}`}
                      aria-label="Edit Mapping"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(mapping)}
                      className={`icon-button ${currentRowForAction?.id === mapping.id && modalActionType === 'delete' ? 'active-delete' : ''}`}
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
    </div>
  );
};

export default MappingsTable;
