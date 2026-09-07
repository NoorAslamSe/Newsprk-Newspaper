import mongoose, { Schema, Document } from 'mongoose';

/**
 * Daily upload metrics aggregated into one document per UTC day.
 * Callers upsert (findOneAndUpdate) against `date` so counters accumulate
 * without creating unbounded collections of individual upload events.
 * Average upload time = totalTimeMs / count for a given type.
 */
export interface IUploadAnalytics extends Document {
  date: Date;
  totalUploads: number;
  failedUploads: number;
  storageByProvider: {
    cloudinary: number; // bytes stored in Cloudinary
    cdn: number;        // bytes stored in S3/CDN-compatible bucket
  };
  uploadTimeByType: {
    image: { totalTimeMs: number; count: number }; // sum/count lets callers derive an average
    video: { totalTimeMs: number; count: number };
    audio: { totalTimeMs: number; count: number };
    other: { totalTimeMs: number; count: number };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UploadAnalyticsSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      default: () => new Date(new Date().setHours(0, 0, 0, 0)), // Midnight UTC — one doc per day
    },
    totalUploads: { type: Number, default: 0 },
    failedUploads: { type: Number, default: 0 },
    storageByProvider: {
      cloudinary: { type: Number, default: 0 },
      cdn: { type: Number, default: 0 },
    },
    uploadTimeByType: {
      image: { totalTimeMs: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      video: { totalTimeMs: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      audio: { totalTimeMs: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      other: { totalTimeMs: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    },
  },
  { timestamps: true }
);

export const UploadAnalytics =
  mongoose.models.UploadAnalytics || mongoose.model<IUploadAnalytics>('UploadAnalytics', UploadAnalyticsSchema);
