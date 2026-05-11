import { useMemo, useState } from 'react';

function normalizeImageUrl(img) {
  if (!img) return '';
  const value = String(img).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://photos.hotelbeds.com/giata/${value.replace(/^\/+/, '')}`;
}

export default function ImageCarousel({
  images = [],
  alt = 'Image',
  className = '',
  imageClassName = '',
  height = '100%',
  radius = 16,
}) {
  const safeImages = useMemo(
    () => (Array.isArray(images) ? images.map(normalizeImageUrl).filter(Boolean) : []),
    [images]
  );
  const [index, setIndex] = useState(0);

  if (!safeImages.length) return null;

  const current = safeImages[index % safeImages.length];

  const prev = (e) => {
    e?.stopPropagation?.();
    setIndex((curr) => (curr - 1 + safeImages.length) % safeImages.length);
  };

  const next = (e) => {
    e?.stopPropagation?.();
    setIndex((curr) => (curr + 1) % safeImages.length);
  };

  return (
    <div className={`img-carousel ${className}`} style={{ height, borderRadius: radius }}>
      <img src={current} alt={alt} className={`img-carousel-image ${imageClassName}`} />

      {safeImages.length > 1 ? (
        <>
          <button type="button" className="img-carousel-btn img-carousel-prev" onClick={prev} aria-label="Previous image">
            ‹
          </button>
          <button type="button" className="img-carousel-btn img-carousel-next" onClick={next} aria-label="Next image">
            ›
          </button>
        </>
      ) : null}

      {safeImages.length > 1 ? (
        <div className="img-carousel-dots">
          {safeImages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`img-carousel-dot ${i === index ? 'active' : ''}`}
              onClick={(e) => {
                e?.stopPropagation?.();
                setIndex(i);
              }}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}