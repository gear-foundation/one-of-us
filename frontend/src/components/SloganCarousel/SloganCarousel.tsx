import { useEffect, useState } from 'react';
import { SLOGANS, SLOGAN_INTERVAL_MS } from '../../config/constants';
import './SloganCarousel.css';

export const SloganCarousel = () => {
  const [currentSlogan, setCurrentSlogan] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlogan((prev) => (prev + 1) % SLOGANS.length);
    }, SLOGAN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="slogan-container">
      {SLOGANS.map((slogan, index) => (
        <h1
          key={index}
          className={`slogan ${index === currentSlogan ? 'active' : ''} ${index < currentSlogan ? 'passed' : ''}`}
        >
          {slogan}
        </h1>
      ))}
    </div>
  );
};





