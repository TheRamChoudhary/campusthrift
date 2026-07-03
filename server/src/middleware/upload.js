const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Use memory storage — files are uploaded to Cloudinary in the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP images are allowed"), false);
    }
  },
});

/**
 * Upload a single Buffer to Cloudinary and return the secure URL.
 * Config is called here (lazily) so dotenv is always loaded first.
 */
const uploadToCloudinary = (buffer) => {
  // Configure lazily — ensures process.env is populated by the time this runs
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "campusthrift",
        transformation: [
          { width: 800, height: 800, crop: "limit", quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary };
