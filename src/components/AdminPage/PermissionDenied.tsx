
import React from 'react';

const PermissionDenied: React.FC = () => {
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
  );
};

export default PermissionDenied;
