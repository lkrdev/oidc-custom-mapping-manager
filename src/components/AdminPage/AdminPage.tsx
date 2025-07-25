
import React from 'react';
import { AdminProvider, useAdmin } from '../../contexts/AdminContext';
import Header from './Header';
import OidcConfigDetails from './OidcConfigDetails';
import MappingsTable from './MappingsTable';
import Pagination from './Pagination';
import AddEditForm from './AddEditForm';
import ConfirmationModal from './ConfirmationModal';
import ErrorModal from './ErrorModal';
import PermissionDenied from './PermissionDenied';

const AdminPageContent: React.FC = () => {
  const { admin } = useAdmin();

  if (!admin) {
    return <PermissionDenied />;
  }

  return (
    <>
      <Header />
      <div className="admin-page-layout">
        <div>
          <OidcConfigDetails />
        </div>
        <div>
          <div className="table-section">
            <MappingsTable />
            <Pagination />
          </div>
          <AddEditForm />
        </div>
      </div>
      <ConfirmationModal />
      <ErrorModal />
    </>
  );
};

const AdminPage: React.FC = () => {
  return (
    <AdminProvider>
      <AdminPageContent />
    </AdminProvider>
  );
};

export default AdminPage;
