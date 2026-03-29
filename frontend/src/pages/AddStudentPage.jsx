import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentForm from '../components/StudentForm';
import { useCreateStudent } from '../hooks/useStudents';

export default function AddStudentPage() {
  const navigate = useNavigate();
  const { createStudent, loading } = useCreateStudent();

  const handleSubmit = async (data) => {
    // Remove null values from create payload
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
    );

    try {
      await createStudent(clean);
      navigate('/students');
    } catch (err) {
      const msg = err.graphQLErrors?.[0]?.message || err.message;
      alert(`Failed to create student: ${msg}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/students')} className="hover:text-blue-600 transition-colors">
          Students
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Add New Student</span>
      </nav>

      {/* Card */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Student</h2>
        <StudentForm
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Create Student"
        />
      </div>
    </div>
  );
}
