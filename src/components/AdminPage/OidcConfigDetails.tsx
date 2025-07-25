import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const OidcConfigDetails: React.FC = () => {
  const { oidcConfigData } = useAdmin();

  if (!oidcConfigData) {
    return null;
  }

  return (
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
  );
};

export default OidcConfigDetails;
