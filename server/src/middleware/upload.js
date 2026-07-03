const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Use memory storage — files are uploaded to Cloudinary in the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit to allow low-MB videos
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPEG, PNG, WebP images and MP4, WebM, OGG, QuickTime videos are allowed",
        ),
        false,
      );
    }
  },
});

/**
 * Upload a single Buffer to Cloudinary and return the secure URL.
 * Config is called here (lazily) so dotenv is always loaded first.
 */
const uploadToCloudinary = (buffer, isVideo = false) => {
  // Configure lazily — ensures process.env is populated by the time this runs
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const uploadOptions = {
    folder: "campusthrift",
    resource_type: "auto",
  };

  if (!isVideo) {
    uploadOptions.transformation = [
      { width: 800, height: 800, crop: "limit", quality: "auto" },
    ];
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary };
