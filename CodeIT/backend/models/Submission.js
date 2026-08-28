import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
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
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: {
        values: ['python', 'cpp', 'java'],
        message: '{VALUE} is not a supported language.'
      },
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: [
          'ACCEPTED',
          'WRONG_ANSWER',
          'COMPILATION_ERROR',
          'RUNTIME_ERROR',
          'TIME_LIMIT_EXCEEDED',
          'JUDGE_UNAVAILABLE'
        ],
        message: '{VALUE} is not a valid submission status.'
      }
    },
    passed: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    publicPassed: {
      type: Number,
      required: true,
      min: 0
    },
    publicTotal: {
      type: Number,
      required: true,
      min: 0
    },
    hiddenPassed: {
      type: Number,
      required: true,
      min: 0
    },
    hiddenTotal: {
      type: Number,
      required: true,
      min: 0
    },
    executionTime: {
      type: String,
      default: '0.000s'
    },
    memory: {
      type: String,
      default: undefined
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
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

// Indexes for fast paginated submission history queries
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

export default Submission;
