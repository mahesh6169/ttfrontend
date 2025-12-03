'use client';

import Link from 'next/link';
import { FaTag, FaGift } from 'react-icons/fa';

export default function PromotionsPage() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return (
    <main className="bg-white">
      <section className="relative min-h-[30vh] md:min-h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center px-4 py-8 md:py-12 overflow-hidden mt-4 md:mt-6 bg-gradient-to-br from-[#1A0F2E] via-[#2D1B4E] to-[#0D0618]">
        
        <div className="absolute inset-0 bg-gradient-radial opacity-80 animate-gradient-shift">
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(255, 107, 53, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 30%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 80%, rgba(255, 182, 72, 0.1) 0%, transparent 40%)
            `
          }}></div>
        </div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
          <div className="particle particle-7"></div>
          <div className="particle particle-8"></div>
          <div className="particle particle-9"></div>
          <div className="particle particle-10"></div>
          <div className="particle particle-11"></div>
          <div className="particle particle-12"></div>
          <div className="particle particle-13"></div>
          <div className="particle particle-14"></div>
          <div className="particle particle-15"></div>
        </div>
        
        <div className="floating-emoji emoji-1">🎉</div>
        <div className="floating-emoji emoji-2">💰</div>
        <div className="floating-emoji emoji-3">🏷️</div>
        <div className="floating-emoji emoji-4">🎁</div>
        <div className="floating-emoji emoji-5">😊</div>
        <div className="floating-emoji emoji-6">🎉</div>
        <div className="floating-emoji emoji-7">💰</div>
        <div className="floating-emoji emoji-8">🏷️</div>
        <div className="floating-emoji emoji-9">🎁</div>
        <div className="floating-emoji emoji-10">😊</div>
        <div className="floating-emoji emoji-11">🎉</div>
        <div className="floating-emoji emoji-12">💰</div>
        
        <div className="relative w-full max-w-3xl md:max-w-4xl space-y-6 md:space-y-8 pt-2 md:pt-0">
          <div className="space-y-4 md:space-y-6 w-full mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 px-8 sm:px-4 md:px-8">
              {isProduction ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0D9488] to-[#14B8A6] p-4 md:p-7 rounded-[20px] shadow-[0_10px_30px_rgba(13,148,136,0.3)] opacity-70 cursor-not-allowed">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                  <div className="relative w-[55px] h-[55px] mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                    <FaTag className="text-[30px] text-white" />
                  </div>
                  <h3 className="relative text-xl md:text-2xl font-bold text-white mb-4 text-center drop-shadow-md">Discount Codes</h3>
                  <div className="relative z-30 inline-block w-full bg-white/25 backdrop-blur-md text-white py-3 px-8 rounded-xl font-semibold text-sm md:text-base text-center">
                    Coming Soon
                  </div>
                </div>
              ) : (
                <Link
                  href="/discountcode"
                  className="relative overflow-hidden bg-gradient-to-br from-[#0D9488] to-[#14B8A6] p-4 md:p-7 rounded-[20px] shadow-[0_10px_30px_rgba(13,148,136,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                  <div className="relative w-[55px] h-[55px] mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                    <FaTag className="text-[30px] text-white" />
                  </div>
                  <h3 className="relative text-xl md:text-2xl font-bold text-white mb-4 text-center drop-shadow-md">Discount Codes</h3>
                  <div className="relative z-30 inline-block w-full bg-white text-[#0D9488] py-3 px-8 rounded-xl font-semibold text-sm md:text-base hover:bg-[#F0FDFA] hover:scale-105 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-all text-center">
                    Browse Now
                  </div>
                </Link>
              )}

              <div className="relative overflow-hidden bg-gradient-to-br from-[#D97706] to-[#F59E0B] p-4 md:p-7 rounded-[20px] shadow-[0_10px_30px_rgba(217,119,6,0.3)] opacity-70 cursor-not-allowed">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                <div className="relative w-[55px] h-[55px] mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                  <FaGift className="text-[30px] text-white" />
                </div>
                <h3 className="relative text-xl md:text-2xl font-bold text-white mb-4 text-center drop-shadow-md">More Deals</h3>
                <div className="relative z-30 inline-block w-full bg-white/25 backdrop-blur-md text-white py-3 px-8 rounded-xl font-semibold text-sm md:text-base text-center">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes gradientShift {
            0% { opacity: 0.8; }
            100% { opacity: 1; }
          }
          
          .animate-gradient-shift {
            animation: gradientShift 8s ease-in-out infinite alternate;
          }
          
          .particle {
            position: absolute;
            border-radius: 50%;
            animation: floatUp 10s infinite ease-in-out;
          }
          
          .particle-1 { width: 6px; height: 6px; background: #FF6B35; left: 10%; bottom: -10%; animation-delay: 0s; }
          .particle-2 { width: 4px; height: 4px; background: #8B5CF6; left: 25%; bottom: -10%; animation-delay: 2s; }
          .particle-3 { width: 8px; height: 8px; background: #FFB648; left: 50%; bottom: -10%; animation-delay: 4s; }
          .particle-4 { width: 5px; height: 5px; background: #FF6B35; left: 70%; bottom: -10%; animation-delay: 1s; }
          .particle-5 { width: 6px; height: 6px; background: #8B5CF6; left: 85%; bottom: -10%; animation-delay: 3s; }
          .particle-6 { width: 4px; height: 4px; background: #FFB648; left: 40%; bottom: -10%; animation-delay: 5s; }
          .particle-7 { width: 5px; height: 5px; background: #FF6B35; left: 15%; bottom: -10%; animation-delay: 1.5s; }
          .particle-8 { width: 7px; height: 7px; background: #8B5CF6; left: 35%; bottom: -10%; animation-delay: 3.5s; }
          .particle-9 { width: 4px; height: 4px; background: #FFB648; left: 55%; bottom: -10%; animation-delay: 0.5s; }
          .particle-10 { width: 6px; height: 6px; background: #FF6B35; left: 75%; bottom: -10%; animation-delay: 2.5s; }
          .particle-11 { width: 5px; height: 5px; background: #8B5CF6; left: 90%; bottom: -10%; animation-delay: 4.5s; }
          .particle-12 { width: 4px; height: 4px; background: #FFB648; left: 5%; bottom: -10%; animation-delay: 1.8s; }
          .particle-13 { width: 7px; height: 7px; background: #FF6B35; left: 30%; bottom: -10%; animation-delay: 3.2s; }
          .particle-14 { width: 5px; height: 5px; background: #8B5CF6; left: 60%; bottom: -10%; animation-delay: 0.8s; }
          .particle-15 { width: 6px; height: 6px; background: #FFB648; left: 80%; bottom: -10%; animation-delay: 4.2s; }
          
          @keyframes floatUp {
            0% { transform: translateY(0) scale(1); opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
          }
          
          .floating-emoji {
            position: absolute;
            font-size: 1.8rem;
            z-index: 10;
            animation: bounce 4s ease-in-out infinite;
            filter: drop-shadow(0 4px 15px rgba(0, 0, 0, 0.3));
            pointer-events: none;
          }
          
          .emoji-1 { top: 8%; left: 3%; animation-delay: 0s; }
          .emoji-2 { top: 12%; right: 5%; animation-delay: 0.5s; }
          .emoji-3 { bottom: 12%; left: 5%; animation-delay: 1s; }
          .emoji-4 { bottom: 18%; right: 3%; animation-delay: 1.5s; }
          .emoji-5 { top: 25%; left: 2%; animation-delay: 2s; }
          .emoji-6 { top: 35%; right: 2%; animation-delay: 2.5s; }
          .emoji-7 { top: 18%; left: 12%; animation-delay: 0.8s; }
          .emoji-8 { top: 20%; right: 15%; animation-delay: 1.2s; }
          .emoji-9 { bottom: 25%; left: 15%; animation-delay: 1.8s; }
          .emoji-10 { bottom: 30%; right: 12%; animation-delay: 2.2s; }
          .emoji-11 { bottom: 8%; left: 20%; animation-delay: 0.3s; }
          .emoji-12 { bottom: 10%; right: 18%; animation-delay: 1.3s; }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0) rotate(-5deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
          }
          
          @media (max-width: 640px) {
            .floating-emoji {
              font-size: 1.5rem;
              z-index: 25;
            }
            .emoji-1 { top: 15%; left: 15%; }
            .emoji-2 { top: 18%; right: 18%; }
            .emoji-3 { top: 32%; left: 8%; }
            .emoji-4 { top: 50%; right: 10%; }
            .emoji-5 { top: 65%; left: 18%; }
            .emoji-6 { top: 78%; right: 15%; }
            .emoji-7, .emoji-8, .emoji-9, .emoji-10, .emoji-11, .emoji-12 {
              display: none;
            }
          }
        `}</style>
      </section>
    </main>
  );
}
