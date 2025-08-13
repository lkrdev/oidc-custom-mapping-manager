import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const AddEditForm: React.FC = () => {
  const {
    addEditFormRef,
    currentRowForAction,
    activeTab,
    setActiveTab,
    setModalActionType,
    formData,
    handleFormInputChange,
    bulkInput,
    setBulkInput,
    handleFormSubmit,
    cancelAction
  } = useAdmin();

  return (
    <div className="add-row-form" ref={addEditFormRef}>
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
          {currentRowForAction && (
            <div className="form-group">
              <label htmlFor="id">Mapping ID:</label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id || ''}
                disabled
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="name">OpenID Connect Group Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleFormInputChange}
              placeholder="e.g., OpenID Connect Group Name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role_ids">Role IDs (comma-separated):</label>
            <input
              type="text"
              id="role_ids"
              name="role_ids"
              value={formData.role_ids || ''}
              onChange={handleFormInputChange}
              placeholder="e.g., 2, 5"
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
              <strong>Format:</strong> <code>looker_group_id</code> (optional), <code>looker_group_name</code> (optional), <code>openid_connection_group_name</code> (required), <code>role_ids</code> (comma-separated, optional)
              <br />
              Example: <code>6,Test Group,My Custom Name,2,5</code>
              <br />
              Example (optional fields empty): <code>,,Another Group,1</code>
            </p>
          </div>
        </div>
      )}

      <button onClick={handleFormSubmit}>
        {currentRowForAction ? 'Update Row' : 'Add Row'}
      </button>
      {currentRowForAction && (
        <button onClick={cancelAction} className="cancel-edit-button">
          Cancel Edit
        </button>
      )}
    </div>
  );
};

export default AddEditForm;
