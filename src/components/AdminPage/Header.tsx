
import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const Header: React.FC = () => {
  const { handleDownloadConfig } = useAdmin();

  return (
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
  );
};

export default Header;
