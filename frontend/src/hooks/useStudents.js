import { useQuery, useMutation } from '@apollo/client';
import {
  LIST_STUDENTS,
  GET_STUDENT,
  CREATE_STUDENT,
  UPDATE_STUDENT,
  DELETE_STUDENT,
  RESTORE_STUDENT,
  CHANGE_ADMISSION_STATUS,
} from '../services/studentService';

// ─── List hook ────────────────────────────────────────────────────────────────

export const useStudentList = ({ page = 1, limit = 10, filters = {} } = {}) => {
  const { data, loading, error, refetch } = useQuery(LIST_STUDENTS, {
    variables: { page, limit, filters },
    notifyOnNetworkStatusChange: true,
  });

  return {
    data: data?.listStudents,
    students: data?.listStudents?.students ?? [],
    total: data?.listStudents?.total ?? 0,
    totalPages: data?.listStudents?.totalPages ?? 0,
    loading,
    error,
    refetch,
  };
};

// ─── Single student hook ──────────────────────────────────────────────────────

export const useStudent = (id) => {
  const { data, loading, error } = useQuery(GET_STUDENT, {
    variables: { id },
    skip: !id,
  });

  return { student: data?.getStudent, loading, error };
};

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export const useCreateStudent = () => {
  const [createStudent, { loading, error }] = useMutation(CREATE_STUDENT, {
    refetchQueries: [LIST_STUDENTS],
  });

  return {
    createStudent: (input) => createStudent({ variables: { input } }),
    loading,
    error,
  };
};

export const useUpdateStudent = () => {
  const [updateStudent, { loading, error }] = useMutation(UPDATE_STUDENT, {
    refetchQueries: [LIST_STUDENTS],
  });

  return {
    updateStudent: (id, input) => updateStudent({ variables: { id, input } }),
    loading,
    error,
  };
};

export const useDeleteStudent = () => {
  const [deleteStudent, { loading }] = useMutation(DELETE_STUDENT, {
    refetchQueries: [LIST_STUDENTS],
  });

  return {
    deleteStudent: (id) => deleteStudent({ variables: { id } }),
    loading,
  };
};

export const useRestoreStudent = () => {
  const [restoreStudent, { loading }] = useMutation(RESTORE_STUDENT, {
    refetchQueries: [LIST_STUDENTS],
  });

  return {
    restoreStudent: (id) => restoreStudent({ variables: { id } }),
    loading,
  };
};

export const useChangeAdmissionStatus = () => {
  const [changeStatus, { loading }] = useMutation(CHANGE_ADMISSION_STATUS, {
    refetchQueries: [LIST_STUDENTS],
  });

  return {
    changeAdmissionStatus: (student_id, status) =>
      changeStatus({ variables: { student_id, status } }),
    loading,
  };
};
