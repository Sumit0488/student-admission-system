const { gql } = require('graphql-tag');

const typeDefs = gql`
  enum AdmissionStatus {
    APPLIED
    APPROVED
    REJECTED
    ENROLLED
  }

  type Student {
    id: ID!
    student_id: String!
    fullName: String!
    email: String!
    phone: String
    program: String
    department: String
    admissionStatus: AdmissionStatus!
    batch: String
    term: Int
    isDeleted: Boolean!
    remarks: String
    createdAt: String
    updatedAt: String
  }

  type StudentList {
    students: [Student!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  input CreateStudentInput {
    student_id: String
    fullName: String!
    email: String!
    phone: String
    program: String
    department: String
    admissionStatus: AdmissionStatus
    batch: String
    term: Int
    remarks: String
  }

  input UpdateStudentInput {
    fullName: String
    email: String
    phone: String
    program: String
    department: String
    admissionStatus: AdmissionStatus
    batch: String
    term: Int
    remarks: String
  }

  input StudentFilters {
    admissionStatus: AdmissionStatus
    program: String
    department: String
    batch: String
    search: String
    includeDeleted: Boolean
  }

  type Query {
    getStudent(id: ID!): Student
    getStudentByStudentId(student_id: String!): Student
    listStudents(page: Int, limit: Int, filters: StudentFilters): StudentList!
    countStudents(filters: StudentFilters): Int!
  }

  type Mutation {
    createStudent(input: CreateStudentInput!): Student!
    updateStudent(id: ID!, input: UpdateStudentInput!): Student!
    deleteStudent(id: ID!): Boolean!
    restoreStudent(id: ID!): Student!
    changeAdmissionStatus(student_id: String!, status: AdmissionStatus!): Student!
  }
`;

module.exports = typeDefs;
