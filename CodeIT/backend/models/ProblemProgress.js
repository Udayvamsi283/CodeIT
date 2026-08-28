import mongoose from 'mongoose';

const problemProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    problemId: {
      type: String,
      required: [true, 'Problem ID is required'],
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['NOT_STARTED', 'ATTEMPTED', 'SOLVED'],
        message: '{VALUE} is not a valid progress status.'
      },
      default: 'NOT_STARTED'
    },
    solvedLanguages: [
      {
        type: String,
        enum: {
          values: ['python', 'cpp', 'java'],
          message: '{VALUE} is not a supported language.'
        },
        lowercase: true,
        trim: true
      }
    ],
    firstAttemptedAt: {
      type: Date,
      default: Date.now
    },
    lastAttemptedAt: {
      type: Date,
      default: Date.now
    },
    solvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound unique index ensuring one progress record per (userId, problemId)
problemProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const ProblemProgress = mongoose.models.ProblemProgress || mongoose.model('ProblemProgress', problemProgressSchema);

export default ProblemProgress;
