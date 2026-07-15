import React from 'react';

export default function LoadingScreen({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center bg-transparent">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 w-24 h-24 bg-bsg-blue/20 rounded-full animate-ping"></div>
        <div className="absolute inset-0 w-24 h-24 bg-bsg-blue/40 rounded-full animate-pulse"></div>
        <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-bsg-blue to-bsg-blue-light rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 animate-bounce">
          <span className="text-white font-extrabold text-2xl">BSG</span>
        </div>
      </div>
      <p className="text-xl font-bold text-gray-500 animate-pulse tracking-widest uppercase">
        {text}
      </p>
    </div>
  );
}
