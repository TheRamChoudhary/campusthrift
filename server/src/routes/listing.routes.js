const express = require("express");
const router = express.Router();
const {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  uploadImages,
  toggleWishlist,
  getWishlist,
  reportListing,
} = require("../controllers/listingController");
const { protect, optionalProtect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

router.get("/", optionalProtect, getAllListings);
router.get("/my", protect, getMyListings);
router.get("/my/wishlist", protect, getWishlist);
router.get("/:id", optionalProtect, getListingById);
router.post("/", protect, upload.fields([{ name: "images", maxCount: 10 }, { name: "video", maxCount: 1 }]), createListing);
router.put("/:id", protect, upload.fields([{ name: "images", maxCount: 10 }, { name: "video", maxCount: 1 }]), updateListing);
router.delete("/:id", protect, deleteListing);

// Wishlist toggle & Report endpoints
router.post("/:id/wishlist", protect, toggleWishlist);
router.post("/:id/report", protect, reportListing);

// Standalone image upload endpoint
router.post("/upload-images", protect, upload.array("images", 5), uploadImages);

module.exports = router;
