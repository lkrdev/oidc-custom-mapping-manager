
import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const Pagination: React.FC = () => {
  const { mappings, currentPage, rowsPerPage, setCurrentPage, setRowsPerPage } = useAdmin();

  const totalPages = Math.ceil(mappings.length / rowsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
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
  );
};

export default Pagination;
