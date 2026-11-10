import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId: Types.ObjectId | string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  details: string;
  meta?: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    userName: { type: String, required: true, maxlength: 160 },
    userRole: { type: String, required: true, maxlength: 40 },
    action: { type: String, required: true, maxlength: 100, index: true },
    resource: { type: String, required: true, maxlength: 100 },
    resourceId: { type: String, maxlength: 100 },
    ipAddress: { type: String, maxlength: 60 },
    userAgent: { type: String, maxlength: 400 },
    details: { type: String, required: true, maxlength: 4000 },
    meta: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  {
    // No auto-timestamps since we have explicit 'timestamp'
    collection: 'auditlogs'
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
