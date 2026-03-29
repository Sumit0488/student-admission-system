import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentList } from '../hooks/useStudents';
import StudentTable from '../components/StudentTable';
import Pagination from '../components/Pagination';

const STATUSES = ['ALL', 'APPLIED', 'APPROVED', 'REJECTED', 'ENROLLED'];
const PAGE_SIZE = 10;

export default function StudentListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filters = {
    ...(search ? { search } : {}),
    ...(statusFilter !== 'ALL' ? { admissionStatus: statusFilter } : {}),
  };

  const { students, total, totalPages, loading, error } = useStudentList({
    page,
    limit: PAGE_SIZE,
    filters,
  });

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      setSearch(searchInput.trim());
      setPage(1);
    },
    [searchInput]
  );

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage student admission records
          </p>
        </div>
        <button
          onClick={() => navigate('/students/new')}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                className="input pl-9 pr-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, program..."
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap">
              Search
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters summary */}
        {(search || statusFilter !== 'ALL') && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>Showing results for:</span>
            {search && (
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                "{search}"
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                {statusFilter}
              </span>
            )}
            <button
              onClick={() => { handleClearSearch(); setStatusFilter('ALL'); }}
              className="text-red-500 hover:text-red-700 underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 text-sm font-medium">Error loading students</p>
            <p className="text-gray-500 text-xs mt-1">{error.message}</p>
          </div>
        ) : (
          <>
            <StudentTable students={students} loading={loading} />
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Stats summary */}
      {!loading && total > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {total} student{total !== 1 ? 's' : ''} total
        </p>
      )}
    </div>
  );
}
