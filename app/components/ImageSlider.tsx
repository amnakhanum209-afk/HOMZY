
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
  {
    src: "/homzy-villa.png",
    alt: "Modern luxury villa",
  },
  {
    src: "/homzy-living-room.png",
    alt: "Modern apartment living room",
  },
  {
    src: "/homzy-apartment.png",
    alt: "Modern apartment building",
  },
  {
    src: "/homzy-family-home.png",
    alt: "Beautiful family home",
  },
];

export default function ImageSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-[450px] overflow-hidden rounded-lg shadow-lg">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.src} className="w-full flex-shrink-0">
            <Image
              src={slide.src}
              alt={slide.alt}
              width={450}
              height={340}
              className="h-[340px] w-full object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`Go to image ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              index === current
                ? "w-6 bg-[#D4AF37]"
                : "w-2 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
