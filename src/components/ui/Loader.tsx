"use client";

import React from "react";

const Loader: React.FC<{ fullscreen?: boolean }> = ({ fullscreen = false }) => {
  return (
    <div
      className={`z-[9999] flex items-center justify-center ${
        fullscreen
          ? "fixed inset-0 bg-white/70 dark:bg-gray-900/70"
          : "absolute inset-0 bg-white/70 dark:bg-gray-900/70 rounded-[15px]"
      }`}
    >
      <div className="relative h-12 w-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{
              transform: `rotate(${i * 45}deg) translate(20px)`,
              animation: "fade 1s linear infinite",
              animationDelay: `${i * 0.125}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes fade {
          0%,
          39%,
          100% {
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;

