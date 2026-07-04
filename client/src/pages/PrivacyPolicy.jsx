import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import bgImage from "../assets/background_image.png";

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight text-white">Privacy Policy</h1>
            <div className="space-y-6 text-white/70 leading-relaxed text-sm md:text-base">
              <p>
                <strong>Welcome to CampusThrift's Privacy Policy.</strong> We take your privacy seriously. This document outlines how we collect, use, and protect your personal information on our platform.
              </p>
              <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information Collection</h2>
              <p>
                We only collect the necessary information to facilitate secure transactions between students on campus. This includes your university email address, name, and basic profile details.
              </p>
              <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Use of Information</h2>
              <p>
                Your information is used solely for the purpose of operating the CampusThrift platform, connecting buyers with sellers, and maintaining a safe marketplace environment. We do not sell your data to third parties.
              </p>
              <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Communication</h2>
              <p>
                By using CampusThrift, you agree to receive essential service notifications. Users communicate through our secure in-app messaging system to protect personal contact information.
              </p>
              <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Data Security</h2>
              <p>
                We implement robust security measures to protect your data. However, remember that no internet transmission is entirely secure. We encourage you to use strong passwords and protect your account credentials.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
