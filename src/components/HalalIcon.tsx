"use client";

import React from "react";

interface HalalIconProps {
  size?: number;
  className?: string;
}

/**
 * Rounded Halal logo emblem rendered from the canonical Halal seal asset.
 */
export default function HalalIcon({ size = 21, className = "" }: HalalIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-black/10 bg-white ${className}`}
      style={{ width: size, height: size }}
      title="Halal"
      aria-label="Halal"
      role="img"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/halal-logo.jpg"
        alt="Halal"
        className="w-full h-full object-cover rounded-full scale-[1.06]"
      />
    </span>
  );
}
