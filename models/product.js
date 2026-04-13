const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: 
  { type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  stars:
  { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  comment: 
  { 
    type: String, 
    required: true 
  },
  createdAt: 
  { 
    type: Date, 
    default: Date.now 
  },
});

const productSchema = new mongoose.Schema({
  title: 
  { 
    type: String, 
    required: true 
  },
  brand: 
  { 
    type: String, 
    required: true
  },
  description: 
  { 
    type: String 
  },
  url: 
  { type: String, 
    required: true
  },
  price: 
  { type: Number, 
    required: true
  },
  stock: 
  { 
    type: Number, 
    default: 0 
  },
  reviews: [reviewSchema],
  rating: 
  { 
    type: Number, 
    default: 0 
  },
  reviewCount: 
  { 
    type: Number, 
    default: 0 
  },
});

// Method to recalc rating
productSchema.methods.updateRating = function () {
  if (this.reviews.length > 0) {
    const totalStars = this.reviews.reduce((sum, r) => sum + r.stars, 0);
    this.rating = totalStars / this.reviews.length;
    this.reviewCount = this.reviews.length;
  } else {
    this.rating = 0;
    this.reviewCount = 0;
  }
};

module.exports = mongoose.model("Product", productSchema);
