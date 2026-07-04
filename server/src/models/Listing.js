const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Books & Notes",
        "Lab Equipment & Coats",
        "Cycles & Bicycles",
        "Hostel Essentials",
        "Electronics",
        "Furniture",
        "Clothing",
        "Sports",
        "Stationery",
        "Other",
      ],
    },
    images: [
      {
        type: String,
      },
    ],
    video: {
      type: String,
      default: "",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "sold", "reserved"],
      default: "available",
    },
    condition: {
      type: String,
      enum: ["new", "like-new", "good", "fair"],
      required: [true, "Condition is required"],
    },
    tags: [String],
  },
  { timestamps: true },
);

// Text index for search
listingSchema.index({ title: "text", description: "text" });
listingSchema.index({ category: 1 });
listingSchema.index({ seller: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Listing", listingSchema);
