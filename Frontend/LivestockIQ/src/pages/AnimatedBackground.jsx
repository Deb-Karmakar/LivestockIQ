import React from 'react';

// Animated Background Component
const AnimatedBackground = () => {
  return (
    <>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-green-50 to-blue-50"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0">
          {/* Large circles */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-green-200/40 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-green-300/30 rounded-full blur-lg animate-bounce-slow"></div>
          <div className="absolute bottom-32 left-1/4 w-56 h-56 bg-green-250/35 rounded-full blur-xl animate-float"></div>
          
          {/* Medium floating elements */}
          <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-green-300/25 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-40 right-10 w-40 h-40 bg-green-200/30 rounded-full animate-pulse-slow"></div>
          
          {/* Small accent dots */}
          <div className="absolute top-1/4 left-1/2 w-8 h-8 bg-green-500/40 rounded-full animate-ping-slow"></div>
          <div className="absolute top-2/3 left-1/3 w-6 h-6 bg-green-600/35 rounded-full animate-ping-delayed"></div>
          <div className="absolute bottom-1/4 right-1/4 w-10 h-10 bg-green-400/30 rounded-full animate-pulse"></div>
        </div>
        
        {/* Animated lines/paths */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.2"/>
              <stop offset="50%" stopColor="rgb(34, 197, 94)" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Curved paths */}
          <path 
            d="M-50,200 Q200,100 400,150 T800,120" 
            stroke="url(#lineGradient)" 
            strokeWidth="2" 
            fill="none"
            className="animate-draw-line"
          />
          <path 
            d="M0,400 Q300,350 600,380 T1200,360" 
            stroke="url(#lineGradient)" 
            strokeWidth="1.5" 
            fill="none"
            className="animate-draw-line-delayed"
          />
          <path 
            d="M200,600 Q500,550 800,580 T1400,560" 
            stroke="url(#lineGradient)" 
            strokeWidth="1" 
            fill="none"
            className="animate-draw-line-slow"
          />
        </svg>
        
        {/* Particle-like elements */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-green-500/60 rounded-full animate-float-random"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.40]">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>
      
      {/* Custom CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        
        @keyframes float-random {
          0%, 100% { transform: translate(0px, 0px); opacity: 0.4; }
          25% { transform: translate(10px, -10px); opacity: 0.8; }
          50% { transform: translate(-5px, -20px); opacity: 0.6; }
          75% { transform: translate(-10px, -5px); opacity: 0.9; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        
        @keyframes ping-delayed {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.05; }
          100% { transform: scale(1); opacity: 0.2; }
        }
        
        @keyframes draw-line {
          0% { stroke-dasharray: 0, 1000; }
          100% { stroke-dasharray: 1000, 0; }
        }
        
        @keyframes draw-line-delayed {
          0%, 30% { stroke-dasharray: 0, 1000; }
          100% { stroke-dasharray: 1000, 0; }
        }
        
        @keyframes draw-line-slow {
          0%, 60% { stroke-dasharray: 0, 1000; }
          100% { stroke-dasharray: 1000, 0; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-float-random {
          animation: float-random 7s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 3s ease-in-out infinite;
        }
        
        .animate-ping-delayed {
          animation: ping-delayed 4s ease-in-out infinite 1s;
        }
        
        .animate-draw-line {
          animation: draw-line 8s ease-in-out infinite;
        }
        
        .animate-draw-line-delayed {
          animation: draw-line-delayed 10s ease-in-out infinite;
        }
        
        .animate-draw-line-slow {
          animation: draw-line-slow 12s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

// Example usage - how to integrate with your existing AuthPage
const AuthPageExample = ({ children }) => {
  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Your existing auth content goes here */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;