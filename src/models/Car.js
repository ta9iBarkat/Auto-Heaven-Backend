import mongoose from 'mongoose';

const CarSchema = new mongoose.Schema({
  // Required Core Fields
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  listingType: {
    type: String,
    required: true,
    enum: ['rent', 'sale'], 
    default: 'rent'
  },

  // Pricing
  pricePerDay: {
    type: Number,
    required: function() { return this.listingType === 'rent'; }  // Simplified condition
  },
  salePrice: {
    type: Number,
    required: function() { return this.listingType === 'sale'; }  // Simplified condition
  },

  // Characteristics
  category: {
    type: String,
    required: true,
    enum: ['Luxury', 'Family', 'Van', 'SUV', 'Sports', 'Economy']
  },
  images: {
    type: [String],
    required: true,
    validate: [arrayLimit, '{PATH} must contain at least 1 image']
  },

  // Status
  isAvailable: {
    type: Boolean,
    default: true
  },
  bookedDates: [{
    startDate: Date,
    endDate: Date,
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Helper validation (unchanged)
function arrayLimit(val) {
  return val.length >= 1 && val.length <= 10;
}

// Virtual populate reviews (unchanged)
CarSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'car',
  localField: '_id'
});

// Update availability when booking changes (unchanged)
CarSchema.methods.updateAvailability = function() {
  this.isAvailable = this.bookedDates.length === 0;
  return this.save();
};

export default mongoose.model('Car', CarSchema);