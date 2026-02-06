import React, { useEffect, useState } from 'react';
import { Check, X, Star, Trophy, Zap } from 'lucide-react';

const StickerAnimation = ({ type = 'success', message = '', duration = 2000, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(false);
      setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const getStickerConfig = () => {
    const configs = {
      success: {
        icon: <Check className="h-12 w-12" />,
        bgColor: 'bg-green-500',
        textColor: 'text-green-600',
        bgLight: 'bg-green-100',
        borderColor: 'border-green-300',
        iconColor: 'text-green-600',
        shadow: 'shadow-lg shadow-green-500/30'
      },
      error: {
        icon: <X className="h-12 w-12" />,
        bgColor: 'bg-red-500',
        textColor: 'text-red-600',
        bgLight: 'bg-red-100',
        borderColor: 'border-red-300',
        iconColor: 'text-red-600',
        shadow: 'shadow-lg shadow-red-500/30'
      },
      star: {
        icon: <Star className="h-12 w-12" fill="currentColor" />,
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgLight: 'bg-yellow-100',
        borderColor: 'border-yellow-300',
        iconColor: 'text-yellow-600',
        shadow: 'shadow-lg shadow-yellow-500/30'
      },
      trophy: {
        icon: <Trophy className="h-12 w-12" />,
        bgColor: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgLight: 'bg-purple-100',
        borderColor: 'border-purple-300',
        iconColor: 'text-purple-600',
        shadow: 'shadow-lg shadow-purple-500/30'
      },
      zap: {
        icon: <Zap className="h-12 w-12" />,
        bgColor: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgLight: 'bg-blue-100',
        borderColor: 'border-blue-300',
        iconColor: 'text-blue-600',
        shadow: 'shadow-lg shadow-blue-500/30'
      }
    };

    return configs[type] || configs.success;
  };

  const config = getStickerConfig();

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className={`relative ${animate ? 'animate-in' : 'animate-out'}`}>
        {/* Animation de particules */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute ${config.bgColor} rounded-full animate-ping`}
              style={{
                width: `${Math.random() * 20 + 10}px`,
                height: `${Math.random() * 20 + 10}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.3
              }}
            />
          ))}
        </div>

        {/* Sticker principal */}
        <div
          className={`
            relative rounded-2xl ${config.bgLight} ${config.borderColor} border-2
            ${config.shadow} p-8 transform transition-all duration-300
            ${animate ? 'scale-100 rotate-0' : 'scale-0 rotate-45 opacity-0'}
          `}
        >
          <div className="relative">
            {/* Icone avec effet de brillance */}
            <div className={`relative ${config.iconColor}`}>
              <div className={`absolute inset-0 ${config.bgColor} blur-xl opacity-50`} />
              {config.icon}
            </div>
            
            {/* Message */}
            {message && (
              <div className={`mt-4 text-center font-bold ${config.textColor}`}>
                {message}
              </div>
            )}
            
            {/* Effet de halo */}
            <div className={`absolute -inset-4 ${config.bgColor} rounded-3xl blur-2xl opacity-20 -z-10`} />
          </div>
        </div>

        {/* Effets de confettis */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute ${config.bgColor} rounded-full animate-bounce`}
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: `${Math.random() * 2 + 1}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Hook personnalisé pour utiliser facilement les stickers
export const useSticker = () => {
  const [sticker, setSticker] = useState(null);

  const showSticker = (type, message, duration = 2000) => {
    setSticker({ type, message, duration });
    
    setTimeout(() => {
      setSticker(null);
    }, duration + 300);
  };

  const StickerComponent = () => {
    if (!sticker) return null;
    
    return (
      <StickerAnimation
        type={sticker.type}
        message={sticker.message}
        duration={sticker.duration}
        onComplete={() => setSticker(null)}
      />
    );
  };

  return { showSticker, StickerComponent };
};

export default StickerAnimation;