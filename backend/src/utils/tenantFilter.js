'use strict';

/**
 * getTenantFilter(tenantId)
 *
 * Returns a MongoDB query fragment that matches:
 *   1. Documents that belong to the given tenant (tenantId matches), AND
 *   2. Legacy documents that have no tenantId stored yet (null or absent field).
 *
 * Uses { tenantId: { $in: [tenantId, null] } } — MongoDB's $in with null
 * matches both explicit null values and fields that don't exist, so old
 * records without tenantId are always included.
 *
 * This avoids $or at the top level, so the returned fragment can be safely
 * spread into a filter that already uses $or for search queries.
 *
 * When tenantId is null/undefined (unauthenticated or pre-auth request),
 * returns {} so the caller sees ALL documents.
 *
 * Usage:
 *   const filter = { ...getTenantFilter(req.tenantId), isDeleted: { $ne: true } };
 */
function getTenantFilter(tenantId) {
  if (!tenantId) return {};
  return { tenantId: { $in: [tenantId, null] } };
}

module.exports = { getTenantFilter };
