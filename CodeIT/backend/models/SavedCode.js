import mongoose from 'mongoose';

const savedCodeSchema = new mongoose.Schema(
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
    sourceCode: {
      type: String,
      default: '',
      maxlength: [65536, 'Source code cannot exceed 64 KB']
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

// Compound unique index ensuring one saved code per (userId, problemId, language)
savedCodeSchema.index({ userId: 1, problemId: 1, language: 1 }, { unique: true });

const SavedCode = mongoose.models.SavedCode || mongoose.model('SavedCode', savedCodeSchema);

export default SavedCode;
