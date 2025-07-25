
import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const ConfirmationModal: React.FC = () => {
  const { showConfirmBanner, oidcTestState, modalActionType, activeTab, bulkInput, parseBulkInput, currentRowForAction, confirmAction, cancelAction } = useAdmin();

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

  if (!showConfirmBanner) {
    return null;
  }

  // Determine if the action is in progress
  const isProcessing = oidcTestState !== 'Finished' && oidcTestState === null ? false : true;

  return (
    <>
      <div className="overlay"></div>
      <div className="confirmation-banner">
        {oidcTestState && <span>{oidcTestState}</span>}
        <h3>{confirmationContent.title}</h3>
        <p>{confirmationContent.message}</p>
        <div className="confirmation-buttons">
          <button className="confirm-button" onClick={confirmAction} disabled={isProcessing}>Confirm</button>
          <button className="cancel-button" onClick={cancelAction}>Cancel</button>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;
