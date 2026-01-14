"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface ShareUIProps {
  children: ReactNode;
  darkSide?: "left" | "right";
  isExpanding?: boolean;
  shouldAnimateIn?: boolean;
}

export default function ShareUI({ children, darkSide = "left", isExpanding = false, shouldAnimateIn = false }: ShareUIProps) {
  const halfClipPath = darkSide === "left" 
    ? 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
    : 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
  
  const fullClipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
  
  let clipPath;
  let wavePosition;
  
  if (isExpanding) {
    // When button is clicked, expand to full - wave moves to edge
    clipPath = fullClipPath;
    // Left side: move wave to right (100% from left)
    // Right side: move wave to left (0% from left, or 100% from right)
    wavePosition = darkSide === "left" ? "100%" : "0%";
  } else if (shouldAnimateIn) {
    // When page loads from button click, start at full and animate to half
    clipPath = fullClipPath;
    wavePosition = darkSide === "left" ? "100%" : "0%"; // Start at edge
  } else {
    // Normal state: half coverage - wave slightly offset from center
    clipPath = halfClipPath;
    // Sign-in page (left): wave a bit to the right (52%)
    // Sign-up page (right): wave a bit to the left (48%)
    wavePosition = darkSide === "left" ? "53%" : "47%";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background */}
      <div className="absolute inset-0">
        <Image
          src="/images/images.jpg"
          alt="Background"
          fill
          className="object-cover blur-md"
          priority
        />
      </div>
      
      {/* Popup with clear background image */}
      <div className="relative w-full max-w-5xl h-[600px] rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/images.jpg"
            alt="Popup Background"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Wave positioned next to the black box at the dividing line - vertical from top to bottom */}
        <div
          className="absolute pointer-events-none z-20 transition-all duration-500 ease-in-out"
          style={{
            left: wavePosition,
            top: darkSide === "left" ? "165px" : "360px", // Different top offset for left and right
            transform: darkSide === "left" 
              ? "translateX(-50%) rotate(90deg)" 
              : "translateX(-50%) rotate(-90deg)",
            transformOrigin: "center center",
            width: "800px",  // This becomes height after rotation - increased for bigger wave
            height: "76px"   // This becomes width after rotation
          }}
        >
          <Image
            src="/images/wave.svg"
            alt="Wave"
            width={800}
            height={300}
            className="w-full h-full"
            style={{ display: "block" }}
          />
        </div>

        <div 
          className="absolute inset-0 bg-black bg-opacity-50 z-10 flex items-center transition-all duration-500 ease-in-out"
          style={{
            clipPath: clipPath,
            justifyContent: darkSide === "left" ? "flex-start" : "flex-end"
          }}
        >
          <div className={`w-1/2 h-full flex items-center ${darkSide === "left" ? "justify-center pl-8" : "justify-center pr-8"}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

