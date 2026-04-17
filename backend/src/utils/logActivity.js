'use strict';
const ActivityLog = require('../models/activity-log.model');

/**
 * logActivity — fire-and-forget activity logger.
 *
 * @param {object} opts
 * @param {string}  opts.module      — e.g. 'Billing', 'General', 'Admissions', 'Hostel', 'Library'
 * @param {string}  opts.action      — snake_case key, e.g. 'order_created', 'member_deleted'
 * @param {string}  opts.label       — human-readable, e.g. 'Order Created'
 * @param {string}  [opts.entityId]  — ID of the record acted on
 * @param {string}  [opts.entityLabel] — name/label of the record
 * @param {string}  [opts.studentName]
 * @param {string}  [opts.usn]
 * @param {number}  [opts.amount]
 * @param {string}  [opts.details]   — extra detail string
 * @param {object}  [opts.meta]      — arbitrary extra data
 * @param {object}  [opts.req]       — Express request (provides tenantId, user, ip)
 */
const logActivity = ({
  module: mod,
  action,
  label,
  entityId,
  entityLabel,
  studentName,
  usn,
  amount,
  details,
  meta,
  req,
}) => {
  ActivityLog.create({
    module: mod,
    action,
    action_label: label,
    entity_id: entityId,
    entity_label: entityLabel,
    student_name: studentName,
    usn,
    amount,
    details,
    meta,
    performed_by: req?.user?.name || req?.user?.email || 'Admin',
    ip: req?.ip,
    tenantId: req?.tenantId || null,
  }).catch(() => {}); // fire-and-forget — never block the response
};

module.exports = logActivity;
