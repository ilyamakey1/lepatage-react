import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onComplete, 
  duration = 2000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Начинаем fade-out анимацию
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, duration - 400);

    // Полностью скрываем лоадер
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete, duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-black z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="logo-container">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
          
          .logo-container {
            font-family: 'Playfair Display', serif;
            font-size: 60px;
            color: white;
            letter-spacing: 5px;
            font-weight: 400;
          }
          
          .logo-letter {
            opacity: 0;
            display: inline-block;
            transform: translateY(20px);
            animation: showLetter 0.3s forwards;
          }
          
          .logo-letter:nth-child(1) { animation-delay: 0s; }
          .logo-letter:nth-child(2) { animation-delay: 0.15s; }
          .logo-letter:nth-child(3) { animation-delay: 0.3s; }
          .logo-letter:nth-child(4) { animation-delay: 0.45s; }
          .logo-letter:nth-child(5) { animation-delay: 0.6s; }
          .logo-letter:nth-child(6) { animation-delay: 0.75s; }
          .logo-letter:nth-child(7) { animation-delay: 0.9s; }
          .logo-letter:nth-child(8) { animation-delay: 1.05s; }
          .logo-letter:nth-child(9) { animation-delay: 1.2s; }
          
          @keyframes showLetter {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @media (max-width: 768px) {
            .logo-container {
              font-size: 48px;
              letter-spacing: 3px;
            }
          }
          
          @media (max-width: 480px) {
            .logo-container {
              font-size: 36px;
              letter-spacing: 2px;
            }
          }
        `}</style>
        
        <div className="logo-container">
          <span className="logo-letter">L</span>
          <span className="logo-letter">'</span>
          <span className="logo-letter">É</span>
          <span className="logo-letter">P</span>
          <span className="logo-letter">A</span>
          <span className="logo-letter">T</span>
          <span className="logo-letter">A</span>
          <span className="logo-letter">G</span>
          <span className="logo-letter">E</span>
        </div>
      </div>
    </div>
  );
};