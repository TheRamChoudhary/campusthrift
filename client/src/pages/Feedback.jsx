import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import Navbar from "../components/layout/Navbar";
import bgImage from "../assets/background_image.png";

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  reviewed: "bg-[#388bfd]/10 text-indigo-700 border border-indigo-200",
  resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const typeColors = {
  bug: "bg-rose-50 text-rose-700 border border-rose-100",
  suggestion: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  complaint: "bg-amber-50 text-amber-700 border border-amber-100",
  rating: "bg-amber-100/10 text-amber-500 border border-amber-500/20",
};

export default function Feedback() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("submit-feedback"); // submit-feedback, review-seller, history

  // Feedback Form State
  const [feedbackType, setFeedbackType] = useState("bug");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackDesc, setFeedbackDesc] = useState("");
  const [feedbackSubType, setFeedbackSubType] = useState("website");
  const [targetRollNo, setTargetRollNo] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Fetch current user's submitted feedback
  const { data: myFeedback, isLoading: isFeedbackLoading } = useQuery({
    queryKey: ["my-feedback"],
    queryFn: async () => {
      const res = await api.get("/feedback");
      return res.data.data;
    },
  });

  // Submit Feedback Handler
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const isRating = feedbackType === "rating";

    if (isRating && !targetRollNo) {
      toast.error("Please enter the seller's Roll Number");
      return;
    }

    if (!isRating && (!feedbackSubject || !feedbackDesc)) {
      toast.error("Please enter a subject and description");
      return;
    }

    if (isRating && !feedbackDesc) {
      toast.error("Please provide a review comment");
      return;
    }

    setSubmittingFeedback(true);
    try {
      await api.post("/feedback", {
        type: feedbackType,
        subject: isRating ? `Seller Rating: ${targetRollNo}` : feedbackSubject,
        description: feedbackDesc,
        subType: feedbackType === "complaint" ? feedbackSubType : undefined,
        targetRollNo: isRating ? targetRollNo : ((feedbackType === "complaint" && ["user", "seller"].includes(feedbackSubType)) ? targetRollNo : undefined),
        rating: isRating ? feedbackRating : undefined,
      });
      toast.success(isRating ? "Thank you! Your confidential review has been submitted." : "Thank you! Your feedback has been received.");
      setFeedbackSubject("");
      setFeedbackDesc("");
      setFeedbackSubType("website");
      setTargetRollNo("");
      setFeedbackRating(5);
      queryClient.invalidateQueries({ queryKey: ["my-feedback"] });
      setActiveTab("history");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };



  return (
    <div className="min-h-screen relative flex flex-col text-white selection:bg-[#1DB954]/30">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Banner with ultra-transparent glass design */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl  mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02),transparent)]"></div>
          <div className="z-10 relative">
            <span className="flex items-center gap-1.5"><svg className="w-8 h-8 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg></span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-[#c9d1d9]">
              Support & Trust Center
            </h1>
            <p className="text-[#8b949e] text-xs sm:text-sm mt-1.5 max-w-lg">
              Report bugs, suggest marketplace features, file complaints, and
              review fellow student listings.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-1.5 shadow-2xl  border border-[#30363d] mb-8">
          <button
            onClick={() => setActiveTab("submit-feedback")}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition ${
              activeTab === "submit-feedback"
                ? "bg-[#238636] text-white shadow-xl "
                : "text-[#8b949e] hover:text-[#8b949e] hover:bg-transparent"
            }`}
          >
            <span className="flex justify-center items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg> File Feedback / Bug</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition ${
              activeTab === "history"
                ? "bg-[#238636] text-white shadow-xl "
                : "text-[#8b949e] hover:text-[#8b949e] hover:bg-transparent"
            }`}
          >
            <span className="flex justify-center items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Support Tickets ({myFeedback?.length || 0})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="transition-all duration-300">
          {/* Submit Feedback Form */}
          {activeTab === "submit-feedback" && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl border border-[#30363d] shadow-2xl  p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[#c9d1d9] mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg> Submit Support Request
              </h2>
              <p className="text-[#8b949e] text-xs mb-6">
                Your report will be directly forwarded to the NIT Trichy
                platform administrators and moderators.
              </p>

              <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["bug", "rating", "complaint"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setFeedbackType(type);
                          if (type !== "complaint") {
                            setFeedbackSubType("website");
                          }
                        }}
                        className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-bold transition text-center capitalize ${
                          feedbackType === type
                            ? "bg-[#388bfd]/10 border-indigo-600 text-indigo-700 shadow-2xl "
                            : "border-[#30363d] text-[#8b949e] hover:bg-transparent"
                        }`}
                      >
                        <span className="flex justify-center items-center gap-1.5">
                          {type === "bug" && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                          {type === "rating" && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>}
                          {type === "complaint" && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                          {type === "rating" ? "Rate Seller" : type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {feedbackType === "rating" && (
                  <div className="space-y-5 animate-fadeIn">
                    {/* Confidentiality banner */}
                    <div className="bg-amber-550/10 border border-amber-500/20 rounded-xl p-4 text-xs text-[#8b949e] leading-relaxed space-y-1">
                      <p className="font-extrabold text-[#c9d1d9] flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Confidentiality Guard
                      </p>
                      <p>
                        Your seller review and ratings are **100% anonymous**. Individual stars and comments are never displayed on the seller's public profile or shared with them. They are only aggregated to update their dynamic marketplace Trust Score.
                      </p>
                    </div>

                    {/* Seller Roll Number */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                        Seller's Roll Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 205124108"
                        value={targetRollNo}
                        onChange={(e) => setTargetRollNo(e.target.value)}
                        required={feedbackType === "rating"}
                        className="w-full border border-[#30363d] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                      />
                    </div>

                    {/* Confidential Stars */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                        Rating Stars
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="text-3xl focus:outline-none transition-transform active:scale-95 bg-transparent"
                          >
                            <span
                              className={
                                star <= (hoverRating || feedbackRating)
                                  ? "text-amber-400"
                                  : "text-gray-650"
                              }
                            >
                              ★
                            </span>
                          </button>
                        ))}
                        <span className="text-sm font-semibold text-[#8b949e] ml-3">
                          {feedbackRating === 1 && "Poor"}
                          {feedbackRating === 2 && "Fair"}
                          {feedbackRating === 3 && "Average"}
                          {feedbackRating === 4 && "Good"}
                          {feedbackRating === 5 && "Excellent!"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {feedbackType === "complaint" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                        What is this complaint about?
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-2 text-sm text-[#c9d1d9] cursor-pointer">
                          <input
                            type="radio"
                            name="complaintSubType"
                            value="website"
                            checked={feedbackSubType === "website"}
                            onChange={() => setFeedbackSubType("website")}
                            className="accent-[#238636] scale-110"
                          />
                          <span>Website issue / general bug</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#c9d1d9] cursor-pointer">
                          <input
                            type="radio"
                            name="complaintSubType"
                            value="user"
                            checked={feedbackSubType === "user"}
                            onChange={() => setFeedbackSubType("user")}
                            className="accent-[#238636] scale-110"
                          />
                          <span>A student (inappropriate behaviour)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#c9d1d9] cursor-pointer">
                          <input
                            type="radio"
                            name="complaintSubType"
                            value="seller"
                            checked={feedbackSubType === "seller"}
                            onChange={() => setFeedbackSubType("seller")}
                            className="accent-[#238636] scale-110"
                          />
                          <span>A seller (transaction dispute)</span>
                        </label>
                      </div>
                    </div>

                    {feedbackSubType === "user" && (
                      <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                          Offending User's Roll Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 205124108"
                          value={targetRollNo}
                          onChange={(e) => setTargetRollNo(e.target.value)}
                          required={feedbackType === "complaint" && feedbackSubType === "user"}
                          className="w-full border border-[#30363d] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          Providing the correct Roll Number allows admins to quickly identify and block this user.
                        </p>
                      </div>
                    )}

                    {feedbackSubType === "seller" && (
                      <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                          Reported Seller's Roll Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 205124108"
                          value={targetRollNo}
                          onChange={(e) => setTargetRollNo(e.target.value)}
                          required={feedbackType === "complaint" && feedbackSubType === "seller"}
                          className="w-full border border-[#30363d] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          Mentioning the seller's Roll Number allows moderators to review their listings and resolve the dispute.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {feedbackType !== "rating" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cannot process credit card payload, typo on listing page"
                      value={feedbackSubject}
                      onChange={(e) => setFeedbackSubject(e.target.value)}
                      required={feedbackType !== "rating"}
                      maxLength={100}
                      className="w-full border border-[#30363d] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                    {feedbackType === "rating" ? "Review Comment (3 lines)" : "Description"}
                  </label>
                  <textarea
                    rows={feedbackType === "rating" ? 3 : 5}
                    placeholder={feedbackType === "rating" ? "Write a 3-line comment about the seller (e.g. negotiation, condition of item, delivery speed)..." : "Describe your issue or suggestion in detail..."}
                    value={feedbackDesc}
                    onChange={(e) => setFeedbackDesc(e.target.value)}
                    required
                    maxLength={1000}
                    className="w-full border border-[#30363d] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff] resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-2xl  hover:shadow-indigo-500/20 disabled:opacity-50 text-sm"
                >
                  {submittingFeedback
                    ? "Submitting Request..."
                    : <span className="flex justify-center items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg> Submit Request</span>}
                </button>
              </form>
            </div>
          )}



          {/* History tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#c9d1d9] flex items-center gap-2 mb-2 px-1">
                <svg className="w-5 h-5 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> My Support Tickets
              </h2>

              {isFeedbackLoading ? (
                <div className="text-center py-12 text-gray-400">
                  Loading support logs...
                </div>
              ) : !myFeedback?.length ? (
                <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl border border-[#30363d] shadow-2xl flex flex-col items-center">
                  <svg className="w-10 h-10 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"></path></svg>
                  <h3 className="font-bold text-[#8b949e] text-sm">
                    No support tickets found
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">
                    If you experience any platform issues or have suggestions,
                    please file a ticket.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myFeedback.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl border border-[#30363d] shadow-2xl  p-5 hover:shadow-xl  transition duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-gray-50 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${typeColors[item.type]}`}
                          >
                            {item.type} {item.subType ? `(${item.subType})` : ""}
                          </span>
                          <h3 className="font-extrabold text-sm sm:text-base text-[#c9d1d9]">
                            {item.subject}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize ${statusColors[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#8b949e] bg-transparent/50 p-3 rounded-xl border border-[#30363d] leading-relaxed">
                        {item.description}
                      </p>

                      {item.type === "rating" && item.rating && (
                        <div className="mt-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 inline-flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg> Rated: {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                        </div>
                      )}

                      {item.type === "rating" && item.targetRollNo && (
                        <div className="mt-2 text-xs font-semibold text-[#58a6ff] bg-[#388bfd]/10 px-3 py-1.5 rounded-lg border border-[#30363d] inline-flex items-center gap-1.5 sm:ml-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Seller Roll No: {item.targetRollNo}
                        </div>
                      )}

                      {item.type === "complaint" && item.targetRollNo && (
                        <div className="mt-2 text-xs font-semibold text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 inline-flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Reported Roll Number: {item.targetRollNo}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400 font-semibold font-mono">
                        <span>Ticket ID: #{item._id}</span>
                        <span>
                          Opened:{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
