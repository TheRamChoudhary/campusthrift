import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import Navbar from "../components/layout/Navbar";
import { LISTING_CATEGORIES } from "../utils/constants";

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateAndAddFiles = (files) => {
    const validFiles = [];
    const validPreviews = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    const currentCount = imageFiles.length;
    const incomingCount = files.length;

    if (currentCount + incomingCount > 10) {
      toast.error("You can only upload up to 10 images in total.");
      return;
    }

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `"${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP.`,
        );
        return;
      }
      if (file.size > maxFileSize) {
        toast.error(`"${file.name}" is too large. Maximum file size is 5MB.`);
        return;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...validPreviews]);
      toast.success(`Added ${validFiles.length} image(s).`);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    validateAndAddFiles(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      validateAndAddFiles(files);
    }
  };

  const moveImage = (index, direction) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    const targetIndex = index + direction;

    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      // Swap files
      [newFiles[index], newFiles[targetIndex]] = [
        newFiles[targetIndex],
        newFiles[index],
      ];
      // Swap previews
      [newPreviews[index], newPreviews[targetIndex]] = [
        newPreviews[targetIndex],
        newPreviews[index],
      ];

      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
    }
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, idx) => idx !== index);
    const newPreviews = imagePreviews.filter((_, idx) => idx !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    toast.success("Image removed.");
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    const maxVideoSize = 20 * 1024 * 1024; // 20MB

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format not supported. Please upload MP4, WebM, OGG, or QuickTime video.");
      return;
    }

    if (file.size > maxVideoSize) {
      toast.error("Video file is too large. Maximum size is 20MB.");
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    toast.success("Video added successfully!");
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview("");
    toast.success("Video removed.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      toast.error("Please upload at least one image of your product.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("condition", formData.condition);
      imageFiles.forEach((file) => data.append("images", file));
      if (videoFile) {
        data.append("video", videoFile);
      }

      await api.post("/listings", data);
      toast.success("Listing created successfully!");
      navigate("/my-listings");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl shadow-xl border border-slate-100/80 p-8 md:p-10 transition-all duration-300">
          {/* Header */}
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#58a6ff] bg-[#388bfd]/10 px-3.5 py-1.5 rounded-full">
              Seller Portal
            </span>
            <h2 className="text-3xl font-black text-[#c9d1d9] tracking-tight mt-3">
              List an Item for Sale
            </h2>
            <p className="text-[#8b949e] text-sm mt-1">
              Fill out the details below to publish your listing across the NIT
              Trichy community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">
                Item Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={80}
                placeholder="e.g. iPad Pro (11-inch, M1, 128GB) with Apple Pencil"
                className="w-full border border-[#30363d] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] transition-all duration-200 bg-slate-50/50 hover:bg-slate-50"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">
                Detailed Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                maxLength={1000}
                placeholder="Describe your item's specs, condition, features, usage duration, and delivery availability..."
                className="w-full border border-[#30363d] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] transition-all duration-200 bg-slate-50/50 hover:bg-slate-50 resize-none leading-relaxed"
              />
              <div className="flex justify-end mt-1 text-[10px] text-gray-400 font-semibold font-mono">
                {formData.description.length}/1000 characters
              </div>
            </div>

            {/* Numeric Row: Price & Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">
                  Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="0"
                    className="w-full border border-[#30363d] rounded-2xl pl-8 pr-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] transition-all duration-200 bg-slate-50/50 hover:bg-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  className="w-full border border-[#30363d] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] transition-all duration-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
                >
                  <option value="">Select a condition</option>
                  <option value="new">🆕 Brand New (Unused / unopened package)</option>
                  <option value="like-new">✨ Like New (Rarely used, pristine state)</option>
                  <option value="good">👍 Good (Fully functional, minor wear)</option>
                  <option value="fair">🩹 Fair (Visible wear, works perfectly)</option>
                </select>
              </div>
            </div>

            {/* Category Option */}
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">
                Marketplace Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full border border-[#30363d] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] transition-all duration-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
              >
                <option value="">Select a category</option>
                {LISTING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Interactive Drag-and-Drop Image Gallery Component */}
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">
                Product Media{" "}
                <span className="text-gray-400 font-normal font-sans">
                  (Up to 10 images, first will be Cover photo)
                </span>
              </label>

              {/* Drag/Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? "border-indigo-500 bg-[#388bfd]/10/50 scale-[0.99] shadow-inner"
                    : "border-slate-300 bg-slate-50/30 hover:border-indigo-400 hover:bg-[#388bfd]/10/20"
                }`}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="text-center p-6 pointer-events-none">
                  <span className="text-4xl block mb-2 filter drop-shadow-2xl ">
                    📸
                  </span>
                  <p className="text-sm font-semibold text-[#8b949e]">
                    Drag & drop your images here or{" "}
                    <span className="text-[#58a6ff] hover:underline">
                      browse files
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">
                    JPEG, PNG, WebP · Max 5MB per file
                  </p>
                  <div className="mt-3.5 inline-flex items-center gap-1.5 bg-[#388bfd]/10 text-indigo-700 px-3.5 py-1 rounded-full text-xs font-bold shadow-2xl ">
                    <span>⚡</span>
                    <span>{imageFiles.length}/10 Images Uploaded</span>
                  </div>
                </div>
              </div>

              {/* Advanced Thumbnail Slider/Reordering list */}
              {imagePreviews.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] font-extrabold text-[#58a6ff] uppercase tracking-wider">
                    Arrange Media & Set Priority
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {imagePreviews.map((src, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 border transition-all duration-200 ${
                          i === 0
                            ? "border-indigo-500 shadow-xl  ring-2 ring-[#58a6ff]/10"
                            : "border-slate-200 hover:border-indigo-200"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Image preview with Aspect-ratio */}
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-100/80 bg-slate-900 flex-shrink-0">
                            <img
                              src={src}
                              alt={`Preview ${i}`}
                              className="w-full h-full object-cover"
                            />
                            {i === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-[#238636] text-[8px] text-white font-extrabold text-center py-0.5 tracking-wider uppercase">
                                Cover
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#c9d1d9] truncate">
                              Image #{i + 1}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono font-medium truncate mt-0.5">
                              {(imageFiles[i]?.size / (1024 * 1024)).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveImage(i, -1)}
                            disabled={i === 0}
                            title="Move Up"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#58a6ff] hover:bg-[#388bfd]/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(i, 1)}
                            disabled={i === imagePreviews.length - 1}
                            title="Move Down"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#58a6ff] hover:bg-[#388bfd]/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            title="Delete Image"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Video Upload Component */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">
                Product Demo Video <span className="text-gray-400 font-normal font-sans">(Optional, max 1 video, max 20MB)</span>
              </label>

              {!videoFile ? (
                <div className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-3xl cursor-pointer border-slate-300 bg-slate-50/30 hover:border-indigo-400 hover:bg-[#388bfd]/10/20 transition-all duration-300">
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center p-4 pointer-events-none">
                    <span className="text-3xl block mb-1">🎥</span>
                    <p className="text-xs font-semibold text-[#8b949e]">
                      Upload product demo video or <span className="text-[#58a6ff] hover:underline">browse files</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">MP4, WebM, OGG, MOV · Max 20MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-100/80 bg-slate-900 flex-shrink-0">
                      <video
                        src={videoPreview}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#c9d1d9] truncate">
                        {videoFile.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-4 py-2 rounded-xl transition duration-200"
                  >
                    Delete Video
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl  hover:shadow-indigo-500/25 hover:-translate-y-0.5 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Marketplace Listing...
                  </>
                ) : (
                  <>
                    <span>🚀 Publish Product Listing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
