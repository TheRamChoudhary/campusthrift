import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import bgImage from "../assets/background_image.png";
import { Link } from "react-router-dom";

export default function Support() {
  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#1DB954]/30 selection:text-white relative">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow max-w-[800px] w-full mx-auto px-4 py-16">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-[2rem] p-8 md:p-12 shadow-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight text-white">Help & Support</h1>
            <div className="space-y-6 text-white/70 leading-relaxed text-sm md:text-base">
              <p>
                <strong>Need help? We're here for you!</strong> At CampusThrift, our top priority is ensuring a smooth and secure marketplace experience for all students.
              </p>
              
              <h2 className="text-xl font-bold text-white mt-8 mb-4">What we do about support</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>24/7 Moderation:</strong> We constantly monitor listings and chats for spam, scams, and policy violations to keep the campus community safe.</li>
                <li><strong>Dispute Resolution:</strong> Having issues with a buyer or seller? Reach out to us, and our team will step in to mediate the situation fairly.</li>
                <li><strong>Feedback Implementation:</strong> We actively listen to user feedback. Use our in-app "Feedback" tool to report bugs or request new features.</li>
                <li><strong>Account Assistance:</strong> Trouble logging in or updating your profile? We can help you recover and secure your account.</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-8 mb-4">Contact Us</h2>
              <p>
                If you have an urgent inquiry, you can reach our support team directly via email:
              </p>
              <div className="bg-[#1DB954]/10 border border-[#1DB954]/20 p-4 rounded-xl inline-block mt-2">
                <a href="mailto:205124076@nitt.edu" className="text-[#1DB954] font-extrabold hover:underline">205124076@nitt.edu</a>
              </div>

              <h2 className="text-xl font-bold text-white mt-8 mb-4">Give us Feedback</h2>
              <p>
                Have a feature request or found a bug? We'd love to hear from you. Use our official feedback form to send your thoughts directly to the developers.
              </p>
              <div className="mt-4">
                <Link to="/feedback" className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full transition-all border border-white/20 hover:border-white/40">
                  Submit Feedback &rarr;
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
