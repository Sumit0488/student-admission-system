import { gql } from '@apollo/client';

// ─── Fragments ───────────────────────────────────────────────────────────────

export const STUDENT_FIELDS = gql`
  fragment StudentFields on Student {
    id
    student_id
    fullName
    email
    phone
    program
    department
    admissionStatus
    batch
    term
    isDeleted
    remarks
    createdAt
    updatedAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

export const LIST_STUDENTS = gql`
  ${STUDENT_FIELDS}
  query ListStudents($page: Int, $limit: Int, $filters: StudentFilters) {
    listStudents(page: $page, limit: $limit, filters: $filters) {
      students {
        ...StudentFields
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_STUDENT = gql`
  ${STUDENT_FIELDS}
  query GetStudent($id: ID!) {
    getStudent(id: $id) {
      ...StudentFields
    }
  }
`;

export const COUNT_STUDENTS = gql`
  query CountStudents($filters: StudentFilters) {
    countStudents(filters: $filters)
  }
`;

// ─── Mutations ───────────────────────────────────────────────────────────────

export const CREATE_STUDENT = gql`
  ${STUDENT_FIELDS}
  mutation CreateStudent($input: CreateStudentInput!) {
    createStudent(input: $input) {
      ...StudentFields
    }
  }
`;

export const UPDATE_STUDENT = gql`
  ${STUDENT_FIELDS}
  mutation UpdateStudent($id: ID!, $input: UpdateStudentInput!) {
    updateStudent(id: $id, input: $input) {
      ...StudentFields
    }
  }
`;

export const DELETE_STUDENT = gql`
  mutation DeleteStudent($id: ID!) {
    deleteStudent(id: $id)
  }
`;

export const RESTORE_STUDENT = gql`
  ${STUDENT_FIELDS}
  mutation RestoreStudent($id: ID!) {
    restoreStudent(id: $id) {
      ...StudentFields
    }
  }
`;

export const CHANGE_ADMISSION_STATUS = gql`
  ${STUDENT_FIELDS}
  mutation ChangeAdmissionStatus($student_id: String!, $status: AdmissionStatus!) {
    changeAdmissionStatus(student_id: $student_id, status: $status) {
      ...StudentFields
    }
  }
`;
