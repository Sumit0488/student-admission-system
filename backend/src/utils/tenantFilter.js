'use strict';

const mongoose = require('mongoose');

/**
 * getTenantFilter(tenantId)
 *
 * Returns a MongoDB query fragment that matches:
 *   1. Documents that belong to the given tenant (tenantId matches), AND
 *   2. Legacy documents that have no tenantId stored yet (null or absent field).
 *
 * IMPORTANT: tenantId is cast to ObjectId so this filter works correctly in
 * BOTH Mongoose find() (which would auto-cast) AND aggregate() pipelines
 * (which bypass Mongoose schema casting and compare types strictly).
 *
 * When tenantId is null/undefined (unauthenticated or pre-auth request),
 * returns {} so the caller sees ALL documents.
 *
 * Usage:
 *   const filter = { ...getTenantFilter(req.tenantId), isDeleted: { $ne: true } };
 */
function getTenantFilter(tenantId) {
  if (!tenantId) return {};
  const tid = mongoose.Types.ObjectId.isValid(tenantId)
    ? new mongoose.Types.ObjectId(String(tenantId))
    : tenantId;
  return { tenantId: { $in: [tid, null] } };
}

module.exports = { getTenantFilter };
