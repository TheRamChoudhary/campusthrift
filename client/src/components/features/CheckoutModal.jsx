import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";

export default function CheckoutModal({ isOpen, onClose, request, onSuccess }) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("card"); // card, upi
  const [step, setStep] = useState("form"); // form, processing, success
  const [txnDetails, setTxnDetails] = useState(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const price = request?.listing?.price ?? 0;

  // Process listing payment mutation
  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/payments/pay", {
        requestId: request._id,
        paymentMethod,
      });
      return res.data.data;
    },
    onMutate: () => {
      setStep("processing");
    },
    onSuccess: (data) => {
      toast.success("Payment successful!");
      setTxnDetails(data.transaction);
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests-buyer"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Payment failed");
      setStep("form");
    },
  });

  if (!isOpen || !request) return null;

  // Card formatting
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    const formatted = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setCardExpiry(value.substring(0, 5));
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();

    if (paymentMethod === "card") {
      if (
        cardNumber.length < 19 ||
        cardExpiry.length < 5 ||
        cardCvv.length < 3
      ) {
        toast.error("Please enter valid credit card details.");
        return;
      }
    }
    payMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#30363d] flex flex-col max-h-[90vh] transition-all transform duration-300 scale-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/20">
          <div>
            <h3 className="font-bold text-[#c9d1d9] text-lg">
              Secure Checkout
            </h3>
            <p className="text-xs text-[#8b949e]">
              Order Ref: #{request._id.substring(18).toUpperCase()}
            </p>
          </div>
          {step !== "processing" && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-[#8b949e] transition bg-[#21262d]/50 backdrop-blur-sm border border-[#30363d] hover:bg-[#30363d]/50 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Form / Progress / Success Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "form" && (
            <form onSubmit={handleSubmitPayment} className="space-y-5">
              {/* Product summary card */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-xl  relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                <p className="text-indigo-100 text-xs font-semibold tracking-wider uppercase">
                  Purchase Summary
                </p>
                <h4 className="font-bold text-lg mt-1 truncate">
                  {request.listing?.title}
                </h4>
                <p className="text-xs text-indigo-100/90 mt-1">
                  Seller: {request.seller?.name || "Fellow NITTian"}
                </p>

                <div className="mt-4 pt-3 border-t border-indigo-500/30 flex items-end justify-between">
                  <span className="text-xs text-indigo-100">Amount Due:</span>
                  <span className="text-2xl font-black text-white">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Methods selector */}
              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wide uppercase mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">


                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                      paymentMethod === "card"
                        ? "border-indigo-600 bg-[#388bfd]/10/50 text-indigo-700 font-bold"
                        : "border-[#30363d] hover:border-[#30363d] text-[#8b949e]"
                    }`}
                  >
                    <span className="text-2xl mb-1">💳</span>
                    <span className="text-xs">Credit/Debit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                      paymentMethod === "upi"
                        ? "border-indigo-600 bg-[#388bfd]/10/50 text-indigo-700 font-bold"
                        : "border-[#30363d] hover:border-[#30363d] text-[#8b949e]"
                    }`}
                  >
                    <span className="text-2xl mb-1">📲</span>
                    <span className="text-xs">Scan UPI QR</span>
                  </button>
                </div>
              </div>

              {/* Method-specific forms */}
              <div className="bg-transparent rounded-xl p-4 border border-[#30363d] min-h-[140px] flex items-center justify-center">

                {/* CARD */}
                {paymentMethod === "card" && (
                  <div className="w-full space-y-3">
                    <div className="relative bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl p-4 text-white shadow-2xl  flex flex-col justify-between h-32 mb-2 font-mono">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-400">
                          MOCK STUDENT CARD
                        </span>
                        <span className="text-lg font-extrabold tracking-wider italic text-slate-300">
                          VISA
                        </span>
                      </div>
                      <div className="text-center font-bold tracking-widest text-base sm:text-lg my-1">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <div>
                          <p className="uppercase text-[8px] leading-none text-slate-500">
                            Card Holder
                          </p>
                          <p className="font-semibold text-slate-300 uppercase truncate max-w-[120px]">
                            {cardName || "NITT STUDENT"}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase text-[8px] leading-none text-slate-500">
                            Expires
                          </p>
                          <p className="font-semibold text-slate-300">
                            {cardExpiry || "MM/YY"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Cardholder Name"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          required
                          className="w-full border border-[#30363d] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#58a6ff] bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Card Number (16-digit)"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          required
                          className="w-full border border-[#30363d] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#58a6ff] bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          required
                          className="w-full border border-[#30363d] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#58a6ff] bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 text-center"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          placeholder="CVV (3-digit)"
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(
                              e.target.value.replace(/\D/g, "").substring(0, 3),
                            )
                          }
                          required
                          className="w-full border border-[#30363d] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#58a6ff] bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI QR */}
                {paymentMethod === "upi" && (
                  <div className="w-full flex items-center gap-4 py-2">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 p-2 rounded-xl border border-[#30363d] shadow-2xl  flex-shrink-0">
                      {/* Simulating QR code */}
                      <div className="w-24 h-24 bg-[#21262d]/50 backdrop-blur-sm border border-[#30363d] flex flex-col items-center justify-center border-4 border-slate-900 rounded relative">
                        <div className="grid grid-cols-4 gap-1 w-20 h-20 opacity-90">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-sm ${i % 3 === 0 || i % 4 === 1 ? "bg-black" : "bg-transparent"}`}
                            ></div>
                          ))}
                        </div>
                        <span className="absolute bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 px-1 py-0.5 rounded text-[8px] font-bold text-[#58a6ff] border shadow-2xl ">
                          UPI MOCK
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#8b949e]">
                        Scan & Pay via any UPI App
                      </p>
                      <p className="text-[11px] text-[#8b949e] mt-0.5">
                        Google Pay, PhonePe, Paytm, or BHIM
                      </p>
                      <div className="mt-2 bg-[#388bfd]/10 text-indigo-700 text-[10px] py-1 px-2.5 rounded font-semibold inline-block border border-indigo-100">
                        Scan simulation active. Pay instantly!
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Checkout button */}
              <button
                type="submit"

                className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3 rounded-xl transition duration-200 shadow-2xl  hover:shadow-indigo-500/20 disabled:opacity-50"
              >
                🔒 Complete Payment — ₹{price.toLocaleString("en-IN")}
              </button>
            </form>
          )}

          {step === "processing" && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h4 className="font-bold text-[#c9d1d9] text-base">
                  Processing Secure Payment...
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Please do not refresh or close this dialog.
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 text-3xl font-bold animate-bounce shadow-xl ">
                ✓
              </div>

              <div>
                <h4 className="font-extrabold text-white text-xl tracking-tight">
                  Payment Successful!
                </h4>
                <p className="text-xs text-[#8b949e] mt-1">
                  Receipt has been generated and log updated.
                </p>
              </div>

              {/* Receipt detail */}
              <div className="bg-transparent border border-[#30363d] rounded-xl p-4 text-left max-w-sm mx-auto space-y-2 text-xs font-mono">
                <div className="flex justify-between font-bold text-[#8b949e]">
                  <span>Transaction ID:</span>
                  <span className="text-white">
                    {txnDetails?.transactionId || "TXN-UNKNOWN"}
                  </span>
                </div>
                <div className="flex justify-between text-[#8b949e]">
                  <span>Purchased Item:</span>
                  <span className="text-[#c9d1d9] font-semibold truncate max-w-[160px]">
                    {request.listing?.title}
                  </span>
                </div>
                <div className="flex justify-between text-[#8b949e]">
                  <span>Method:</span>
                  <span className="text-[#c9d1d9] uppercase font-semibold">
                    {txnDetails?.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-[#8b949e]">
                  <span>Completed:</span>
                  <span>
                    {txnDetails?.createdAt
                      ? new Date(txnDetails.createdAt).toLocaleString()
                      : ""}
                  </span>
                </div>
                <div className="pt-2 border-t border-dashed border-[#30363d] flex justify-between font-black text-[#c9d1d9] text-sm">
                  <span>Paid Amount:</span>
                  <span className="text-[#58a6ff]">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#21262d]/50 backdrop-blur-sm border border-[#30363d] hover:bg-[#30363d]/50 text-[#8b949e] font-semibold py-2.5 rounded-xl transition text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
