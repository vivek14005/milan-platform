import { useEffect, useState } from "react";

import decorPhoto from "../assets/milan-vendor-decor.webp";
import photographyPhoto from "../assets/milan-vendor-photography.webp";
import cateringPhoto from "../assets/milan-vendor-catering.webp";
import makeupPhoto from "../assets/milan-vendor-makeup.webp";
import djPhoto from "../assets/milan-vendor-dj.webp";
import marriageHallPhoto from "../assets/milan-vendor-marriage-hall.webp";

const slides = [
  {
    image: decorPhoto,
    category: "DECORATION",
    caption: "Beautiful spaces, thoughtfully made.",
  },
  {
    image: photographyPhoto,
    category: "PHOTOGRAPHY",
    caption: "Every moment, beautifully remembered.",
  },
  {
    image: cateringPhoto,
    category: "CATERING",
    caption: "Every flavour becomes a memory.",
  },
  {
    image: makeupPhoto,
    category: "MAKEUP & BEAUTY",
    caption: "Made for your most special day.",
  },
  {
    image: djPhoto,
    category: "DJ & MUSIC",
    caption: "The soundtrack to every celebration.",
  },
  {
    image: marriageHallPhoto,
    category: "MARRIAGE HALLS",
    caption: "A beautiful setting for your forever.",
  },
];

export default function VendorHeroGallery() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <figure className="vendor-hero-scene">
      <div className="vendor-hero-frame">
        {slides.map((slide, index) => (
          <img
            key={slide.category}
            src={slide.image}
            alt={slide.category}
            className={`vendor-hero-photo ${index === activeIndex ? "is-active" : ""
              }`}
          />
        ))}
      </div>

      <figcaption>
        <div className="vendor-hero-caption-copy">
          <small>{slides[activeIndex].category} · MILAN VENDORS</small>
          <strong>{slides[activeIndex].caption}</strong>
        </div>

        <div className="vendor-hero-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.category}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              aria-label={`Show ${slide.category}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  );
}