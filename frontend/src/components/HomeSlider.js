import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeSlider.css';

const BASE_URL = 'https://localhost:7193';

const slides = [
  {
    id: 1,
    image: `${BASE_URL}/images/products/water-purifier-premium-1.jpg`,
    title: 'Premium Water Purifiers',
    subtitle: 'Advanced 9-Stage Purification',
    description: 'Experience pure, mineral-rich water with our premium RO+UV+UF technology. Smart TDS control & energy efficient.',
    buttonText: 'Shop Premium',
    link: '/?quaternary=1', // Premium domestic
    bgGradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)'
  },
  {
    id: 2,
    image: `${BASE_URL}/images/products/water-purifier-regular-1.jpg`,
    title: 'Affordable Home Solutions',
    subtitle: 'Quality Within Budget',
    description: 'Essential RO purification for every home. Reliable, efficient, and easy to maintain water purifiers.',
    buttonText: 'Explore Range',
    link: '/?quaternary=2', // Regular domestic
    bgGradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)'
  },
  {
    id: 3,
    image: `${BASE_URL}/images/products/water-purifier-commercial-1.jpg`,
    title: 'Commercial Grade Systems',
    subtitle: '50-200 LPH Capacity',
    description: 'High-capacity water purification for offices, restaurants, and hotels. 24/7 reliable performance.',
    buttonText: 'View Commercial',
    link: '/?tertiary=2', // Commercial
    bgGradient: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)'
  },
  {
    id: 4,
    image: `${BASE_URL}/images/products/water-purifier-industrial-1.jpg`,
    title: 'Industrial Solutions',
    subtitle: '500-2000 LPH Plants',
    description: 'Complete water treatment systems for manufacturing units. PLC controlled with SCADA compatibility.',
    buttonText: 'Discover Industrial',
    link: '/?tertiary=3', // Industrial
    bgGradient: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)'
  }
];

const HomeSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="home-slider">
      <div className="slider-container">
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

      {/* Navigation Arrows */}
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
