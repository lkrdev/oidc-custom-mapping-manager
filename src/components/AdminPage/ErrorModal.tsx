
import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const ErrorModal: React.FC = () => {
  const { apiError, setApiError } = useAdmin();

  if (!apiError) {
    return null;
  }

  return (
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
  );
};

export default ErrorModal;
