const Listing = require("../models/Listing");
const User = require("../models/User");
const Feedback = require("../models/Feedback");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { uploadToCloudinary } = require("../middleware/upload");

// @route GET /api/v1/listings
exports.getAllListings = asyncHandler(async (req, res, next) => {
  const {
    search,
    category,
    condition,
    minPrice,
    maxPrice,
    sort,
    page = 1,
    limit = 12,
    ids,
  } = req.query;

  const blockedUsers = await User.find({ isBlocked: true }).select("_id");
  const blockedUserIds = blockedUsers.map((u) => u._id);

  // If user is logged in, also filter out their personally blocked users
  // AND users who have personally blocked them!
  if (req.user) {
    if (req.user.blockedUsers && req.user.blockedUsers.length > 0) {
      blockedUserIds.push(...req.user.blockedUsers);
    }
    // Find users who personally blocked the logged-in user
    const usersWhoBlockedMe = await User.find({ blockedUsers: req.user._id }).select("_id");
    const blockedMeIds = usersWhoBlockedMe.map((u) => u._id);
    blockedUserIds.push(...blockedMeIds);
  }

  const query = {
    status: "available",
    seller: { $nin: blockedUserIds },
  };

  if (ids) {
    const idList = ids.split(",");
    query._id = { $in: idList };
  }

  // Search
  if (search) {
    query.$text = { $search: search };
  }

  // Filters
  if (category) query.category = category;
  if (condition) query.condition = condition;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Sort
  let sortOption = { createdAt: -1 };
  if (sort === "price-asc") sortOption = { price: 1 };
  if (sort === "price-desc") sortOption = { price: -1 };
  if (sort === "oldest") sortOption = { createdAt: 1 };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Listing.countDocuments(query);
  const listings = await Listing.find(query)
    .populate("seller", "name email")
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        listings,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      },
      "Listings fetched successfully",
    ),
  );
});

// @route GET /api/v1/listings/:id
exports.getListingById = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id).populate(
    "seller",
    "name email phone isBlocked blockedUsers avatar bio department branch hostel",
  );

  if (!listing) throw new ApiError(404, "Listing not found");

  if (listing.seller && listing.seller.isBlocked) {
    throw new ApiError(403, "This listing is unavailable because the seller has been blocked");
  }

  // Check personal blocks
  if (req.user && listing.seller) {
    const sellerIdStr = listing.seller._id.toString();
    const myIdStr = req.user._id.toString();
    
    // Did I block the seller?
    const iBlockedSeller = req.user.blockedUsers && req.user.blockedUsers.some(id => id.toString() === sellerIdStr);
    
    // Did the seller block me?
    const sellerBlockedMe = listing.seller.blockedUsers && listing.seller.blockedUsers.some(id => id.toString() === myIdStr);
    
    if (iBlockedSeller || sellerBlockedMe) {
      throw new ApiError(403, "This listing is unavailable due to communication blocks");
    }
  }

  res
    .status(200)
    .json(new ApiResponse(200, listing, "Listing fetched successfully"));
});

// @route POST /api/v1/listings
exports.createListing = asyncHandler(async (req, res, next) => {
  const { title, description, price, category, condition, tags } = req.body;

  // Upload images to Cloudinary if provided
  let imageUrls = [];
  if (req.files && req.files.images && req.files.images.length > 0) {
    imageUrls = await Promise.all(
      req.files.images.map((file) => uploadToCloudinary(file.buffer, false)),
    );
  }

  // Upload video to Cloudinary if provided
  let videoUrl = "";
  if (req.files && req.files.video && req.files.video.length > 0) {
    videoUrl = await uploadToCloudinary(req.files.video[0].buffer, true);
  }

  const listing = await Listing.create({
    title,
    description,
    price,
    category,
    condition,
    tags,
    images: imageUrls,
    video: videoUrl,
    seller: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, listing, "Listing created successfully"));
});

// @route PUT /api/v1/listings/:id
exports.updateListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) throw new ApiError(404, "Listing not found");

  const isAdmin = req.user.role === "admin" || req.user.role === "moderator";
  const isSeller = listing.seller.toString() === req.user._id.toString();

  if (!isSeller && !isAdmin) {
    throw new ApiError(403, "Not authorized to update this listing");
  }

  const updateData = { ...req.body };

  // Upload new images to Cloudinary if provided
  if (req.files && req.files.images && req.files.images.length > 0) {
    updateData.images = await Promise.all(
      req.files.images.map((file) => uploadToCloudinary(file.buffer, false)),
    );
  }

  // Upload new video to Cloudinary if provided
  if (req.files && req.files.video && req.files.video.length > 0) {
    updateData.video = await uploadToCloudinary(req.files.video[0].buffer, true);
  }

  const updated = await Listing.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res
    .status(200)
    .json(new ApiResponse(200, updated, "Listing updated successfully"));
});

// @route DELETE /api/v1/listings/:id
exports.deleteListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) throw new ApiError(404, "Listing not found");
  if (
    listing.seller.toString() !== req.user._id.toString() &&
    req.user.role !== "admin" &&
    req.user.role !== "moderator"
  ) {
    throw new ApiError(403, "Not authorized to delete this listing");
  }

  await listing.deleteOne();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Listing deleted successfully"));
});

// @route GET /api/v1/listings/my
exports.getMyListings = asyncHandler(async (req, res, next) => {
  const listings = await Listing.find({ seller: req.user._id }).sort({
    createdAt: -1,
  });

  res
    .status(200)
    .json(new ApiResponse(200, listings, "Your listings fetched successfully"));
});

// @route POST /api/v1/listings/upload-images
// Standalone image upload — returns array of Cloudinary URLs
exports.uploadImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No images provided");
  }

  const urls = await Promise.all(
    req.files.map((file) => uploadToCloudinary(file.buffer)),
  );

  res
    .status(200)
    .json(new ApiResponse(200, { urls }, "Images uploaded successfully"));
});

// @route POST /api/v1/listings/:id/wishlist
exports.toggleWishlist = asyncHandler(async (req, res, next) => {
  const listingId = req.params.id;
  const listing = await Listing.findById(listingId);
  if (!listing) throw new ApiError(404, "Listing not found");

  const user = await User.findById(req.user._id);
  const isWishlisted = user.wishlist.includes(listingId);

  if (isWishlisted) {
    user.wishlist = user.wishlist.filter((id) => id.toString() !== listingId);
    await user.save();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isWishlisted: false },
          "Removed from wishlist successfully",
        ),
      );
  } else {
    user.wishlist.push(listingId);
    await user.save();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isWishlisted: true },
          "Added to wishlist successfully",
        ),
      );
  }
});

// @route GET /api/v1/listings/my/wishlist
exports.getWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    populate: { path: "seller", select: "name email" },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.wishlist || [],
        "Wishlist fetched successfully",
      ),
    );
});

// @route POST /api/v1/listings/:id/report
exports.reportListing = asyncHandler(async (req, res, next) => {
  const listingId = req.params.id;
  const { description } = req.body;

  if (!description) {
    throw new ApiError(400, "Complaint description is required");
  }

  const listing = await Listing.findById(listingId).populate("seller", "name");
  if (!listing) throw new ApiError(404, "Listing not found");

  const feedback = await Feedback.create({
    user: req.user._id,
    type: "complaint",
    subject: `Report on Listing: ${listing.title}`,
    description,
    listing: listingId,
  });

  res
    .status(201)
    .json(new ApiResponse(201, feedback, "Listing reported successfully"));
});
