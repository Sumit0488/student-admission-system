'use strict';

/**
 * Stub service — provides default no-op implementations so the server
 * starts even when full approval logic is not yet wired up.
 */
const CertificateApprovalService = {
  evaluateCertificate(certificateType, student) {
    return { approved: true, reason: null, requiresApproval: false };
  },
  getCertificateConfig(type) {
    return { requiresApproval: false, autoApprove: true };
  },
};

module.exports = CertificateApprovalService;
