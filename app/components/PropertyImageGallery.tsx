
"use client";

import { useState } from "react";

type PropertyImageGalleryProps = {
  imageUrl: string | null;
  imageUrls: string[];
  title: string;
};

export default function PropertyImageGallery({
  imageUrl,
  imageUrls,
  title,
}: PropertyImageGalleryProps) {
  const images = Array.from(
    new Set([...(imageUrl ? [imageUrl] : []), ...imageUrls].filter(Boolean))
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-zinc-500">
        No property images available.
      </div>
    );
  }

  const previousImage = () => {
    setCurrentIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const nextImage = () => {
    setCurrentIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  return (
    <section className="mt-6">
      <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl bg-gray-100">
        <img
          src={images[currentIndex]}
          alt={title}
        className="block h-auto max-h-[420px] w-full object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={previousImage}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[#0A1F44]/85 px-3 py-2 text-xl text-white hover:bg-[#0A1F44]"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#0A1F44]/85 px-3 py-2 text-xl text-white hover:bg-[#0A1F44]"
            >
              ›
            </button>

            <span className="absolute bottom-3 right-3 rounded-full bg-[#0A1F44]/85 px-3 py-1 text-xs text-white">
              {currentIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mx-auto mt-3 flex max-w-3xl gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`View photo ${index + 1}`}
              aria-pressed={currentIndex === index}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                currentIndex === index
                  ? "border-[#D4AF37]"
                  : "border-transparent"
              }`}
            >
              <img
                src={image}
                alt={`${title} photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
