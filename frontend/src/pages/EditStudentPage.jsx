import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentForm from '../components/StudentForm';
import StatusBadge from '../components/StatusBadge';
import { useStudent, useUpdateStudent } from '../hooks/useStudents';

export default function EditStudentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { student, loading: fetching, error } = useStudent(id);
  const { updateStudent, loading: saving } = useUpdateStudent();

  const handleSubmit = async (data) => {
    try {
      await updateStudent(id, data);
      navigate('/students');
    } catch (err) {
      const msg = err.graphQLErrors?.[0]?.message || err.message;
      alert(`Failed to update student: ${msg}`);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading student...
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 text-center">
          <p className="text-red-600 font-medium">Student not found</p>
          <p className="text-gray-500 text-sm mt-1">{error?.message}</p>
          <button
            onClick={() => navigate('/students')}
            className="btn-primary mt-4"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/students')} className="hover:text-blue-600 transition-colors">
          Students
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">{student.fullName}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </nav>

      {/* Student meta info */}
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 font-semibold text-sm">
                {student.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{student.fullName}</p>
              <p className="text-xs text-gray-500 font-mono">{student.student_id}</p>
            </div>
          </div>
          <StatusBadge status={student.admissionStatus} />
        </div>
      </div>

      {/* Form Card */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Student</h2>
        <StudentForm
          initialValues={student}
          onSubmit={handleSubmit}
          loading={saving}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
