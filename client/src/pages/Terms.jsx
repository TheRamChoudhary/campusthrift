import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import bgImage from "../assets/background_image.png";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#1DB954]/30 selection:text-white relative">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-[#121212]/15 backdrop-blur-md"></div>
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow max-w-[800px] w-full mx-auto px-4 py-16">
          <div className="bg-[#181818] border border-[#333333] rounded-[2rem] p-8 md:p-12 shadow-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight text-white">Terms & Conditions</h1>
            <div className="space-y-6 text-white/70 leading-relaxed text-sm md:text-base">
              <p>
                <strong>Welcome to CampusThrift.</strong> These terms outline the rules and regulations for the use of our platform.
              </p>
              <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing this website, we assume you accept these terms and conditions. Do not continue to use CampusThrift if you do not agree to all of the terms stated on this page.
              </p>
              <h2 className="text-xl font-bold text-white mt-8 mb-4">2. User Accounts</h2>
              <p>
                You must be a currently enrolled student with a valid university email address to use CampusThrift. You are responsible for maintaining the confidentiality of your account and password.
              </p>
              <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Selling and Buying</h2>
              <p>
                Users are solely responsible for the items they list and purchase. CampusThrift is a venue for students to connect; we do not own the items listed and are not directly involved in the transactions between buyers and sellers. We advise all users to meet in safe, public campus locations for exchanges.
              </p>
              <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Prohibited Items</h2>
              <p>
                You may not list illegal items, weapons, hazardous materials, or any items that violate university policies. Violators will have their accounts permanently banned.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
