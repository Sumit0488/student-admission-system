import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ConfirmDialog from './ConfirmDialog';
import { useDeleteStudent } from '../hooks/useStudents';

export default function StudentTable({ students, loading }) {
  const navigate = useNavigate();
  const { deleteStudent, loading: deleting } = useDeleteStudent();
  const [confirmDelete, setConfirmDelete] = useState(null); // stores student to delete

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteStudent(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading students...
        </div>
      </div>
    );
  }

  if (!loading && students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm font-medium">No students found</p>
        <p className="text-xs mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Student ID', 'Full Name', 'Email', 'Program', 'Department', 'Status', 'Batch', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {students.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                  {student.student_id}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{student.fullName}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{student.email}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{student.program || '—'}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{student.department || '—'}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={student.admissionStatus} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{student.batch || '—'}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/students/${student.id}/edit`)}
                      className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(student)}
                      className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${confirmDelete?.fullName}"? This action can be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </>
  );
}
