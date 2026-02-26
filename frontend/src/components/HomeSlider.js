import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL, getImageUrl } from '../config';
import './HomeSlider.css';

const DEFAULT_GRADIENTS = [
  'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
  'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
  'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
  'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)',
];

const FALLBACK_SLIDES = [
  { id: 'f1', image: `${BASE_URL}/images/products/water-purifier-premium-1.jpg`, title: 'Shop by Category', subtitle: 'Explore', description: '', buttonText: 'Shop Now', link: '/shop', bgGradient: DEFAULT_GRADIENTS[0] },
  { id: 'f2', image: `${BASE_URL}/images/products/water-purifier-regular-1.jpg`, title: 'Great Deals', subtitle: 'Quality Within Budget', description: '', buttonText: 'Explore', link: '/', bgGradient: DEFAULT_GRADIENTS[1] },
];

const HomeSlider = ({ selectedCategoryId, categoriesWithSubs = [] }) => {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const trackRef = useRef(null);
  const navigate = useNavigate();

  const effectiveCategoryId = selectedCategoryId ?? (Array.isArray(categoriesWithSubs) && categoriesWithSubs.length > 0 ? (categoriesWithSubs[0].categoryId ?? categoriesWithSubs[0].CategoryId) : null);

  useEffect(() => {
    if (!effectiveCategoryId) {
      setSlides(FALLBACK_SLIDES);
      setCurrentSlide(0);
      return;
    }
    let cancelled = false;
    axios.get(`${BASE_URL}/api/CategorySlides`, { params: { categoryId: effectiveCategoryId } })
      .then((res) => {
        if (cancelled) return;
        const raw = res.data;
        const arr = Array.isArray(raw) ? raw : (raw?.$values ?? []);
        if (arr.length === 0) {
          setSlides(FALLBACK_SLIDES);
          setCurrentSlide(0);
          return;
        }
        const mapped = arr.map((s, i) => ({
          id: s.categorySlideImageId ?? s.CategorySlideImageId ?? i,
          image: getImageUrl(s.imageUrl ?? s.ImageUrl),
          title: s.title ?? s.Title ?? s.categoryName ?? 'Shop',
          subtitle: s.subtitle ?? s.Subtitle ?? '',
          description: s.subtitle ?? s.Subtitle ?? '',
          buttonText: s.buttonText ?? s.ButtonText ?? 'Shop Now',
          link: s.link ?? s.Link ?? `/?category=${effectiveCategoryId}`,
          bgGradient: DEFAULT_GRADIENTS[i % DEFAULT_GRADIENTS.length],
        }));
        setSlides(mapped);
        setCurrentSlide(0);
      })
      .catch(() => {
        if (!cancelled) {
          setSlides(FALLBACK_SLIDES);
          setCurrentSlide(0);
        }
      });
    return () => { cancelled = true; };
  }, [effectiveCategoryId]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.slide-card');
    if (!card) return;
    const slideWidth = card.offsetWidth;
    const margin = 12;
    el.style.transform = `translateX(-${currentSlide * (slideWidth + margin)}px)`;
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const goToSlide = (index) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleButtonClick = (link) => {
    navigate(link);
  };

  const minSwipeDistance = 50;
  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > minSwipeDistance) {
      distance > 0 ? nextSlide() : prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="home-slider">
      {/* Desktop: fade slides. Mobile: horizontal carousel with peek */}
      <div className="slider-container slider-desktop">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
            style={{ background: slide.bgGradient }}
          >
            <div className="slide-content">
              <div className="slide-text">
                <span className="slide-subtitle">{slide.subtitle}</span>
                <h2 className="slide-title">{slide.title}</h2>
                <p className="slide-description">{slide.description}</p>
                <button 
                  className="slide-button"
                  onClick={() => handleButtonClick(slide.link)}
                >
                  {slide.buttonText}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
              <div className="slide-image-container">
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="slide-image"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: horizontal scroll carousel */}
      <div 
        className="slider-container slider-mobile"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          ref={trackRef}
          className="slider-track"
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="slide-card"
              style={{ background: slide.bgGradient }}
              onClick={() => handleButtonClick(slide.link)}
            >
              <div className="slide-card-inner">
                <div className="slide-card-content">
                  <span className="slide-card-subtitle">{slide.subtitle}</span>
                  <h2 className="slide-card-title">{slide.title}</h2>
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="slide-card-image"
                  />
                  <button type="button" className="slide-card-btn">
                    {slide.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - desktop only */}
      <button className="slider-arrow prev" onClick={prevSlide} aria-label="Previous slide">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button className="slider-arrow next" onClick={nextSlide} aria-label="Next slide">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HomeSlider;
