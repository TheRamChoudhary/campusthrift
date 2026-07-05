import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import bgImage from "../assets/background_image.png";

export default function Guidelines() {
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
            <h1 className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight text-white">Community Guidelines</h1>
            <div className="space-y-6 text-white/70 leading-relaxed text-sm md:text-base">
              <p>
                <strong>Welcome to CampusThrift!</strong> This platform is designed exclusively for students to buy, sell, and trade old products, pre-loved items, and college essentials safely. 
                To maintain a secure and friendly environment, all users must strictly adhere to these guidelines.
              </p>
              
              <h2 className="text-xl font-bold text-white mt-8 mb-4">Zero-Tolerance for Abuse & Scams</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Abusive Behavior:</strong> Any form of harassment, hate speech, bullying, or abusive language in chats, listings, or feedback is strictly prohibited.</li>
                <li><strong>Scams & Fraud:</strong> Attempting to defraud other students, posting fake items, or soliciting payments for goods you do not intend to deliver will result in an immediate and permanent ban.</li>
                <li><strong>Inappropriate Content:</strong> Do not post listings containing explicit material, illegal items, weapons, or items prohibited by campus regulations.</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-8 mb-4">How to Use CampusThrift Properly</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Accurate Descriptions:</strong> Be honest when selling old products. Accurately describe the condition, wear and tear, and functionality of your items.</li>
                <li><strong>Safe Meetups:</strong> Always arrange to meet on campus in public, well-lit areas. Never share overly personal information such as your exact dorm room number unless absolutely necessary.</li>
                <li><strong>Respectful Communication:</strong> Keep all negotiations polite. If you agree on a price, honor the agreement.</li>
              </ul>

              <div className="mt-8 bg-red-500/10 border border-red-500/30 p-6 rounded-xl">
                <h3 className="text-red-500 font-bold text-lg mb-2">Consequences of Violations</h3>
                <p className="text-red-400/80 text-sm">
                  If we find you engaging in inappropriate behavior, scamming, or abusing the platform, <strong>you will be permanently banned from CampusThrift</strong> and your NITT email will be blacklisted. We reserve the right to report severe infractions to campus administration.
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
