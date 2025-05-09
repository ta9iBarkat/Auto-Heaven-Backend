import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  // Core Relationships
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'Car reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },

  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Minimum rating is 1'],
    max: [5, 'Maximum rating is 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate reviews per user per car
ReviewSchema.index({ car: 1, user: 1 }, { unique: true });

// Update car's average rating when new review is saved
ReviewSchema.post('save', async function(doc) {
  await calculateAverageRating(doc.car);
});

// Update car's average rating when review is removed
ReviewSchema.post('remove', async function(doc) {
  await calculateAverageRating(doc.car);
});

// Calculate average rating helper
const calculateAverageRating = async (carId) => {
  const stats = await mongoose.model('Review').aggregate([
    {
      $match: { car: carId }
    },
    {
      $group: {
        _id: '$car',
        averageRating: { $avg: '$rating' },
        ratingsCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Car').findByIdAndUpdate(carId, {
      ratingsAverage: stats[0].averageRating,
      ratingsQuantity: stats[0].ratingsCount
    });
  } else {
    await mongoose.model('Car').findByIdAndUpdate(carId, {
      ratingsAverage: 0,
      ratingsQuantity: 0
    });
  }
};

export default mongoose.model('Review', ReviewSchema);