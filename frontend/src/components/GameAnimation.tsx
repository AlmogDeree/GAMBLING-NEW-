import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameAnimationProps {
  systemNumbers: number[];
  selectedNumber: number;
  attempts: number;
}

const GameAnimation: React.FC<GameAnimationProps> = ({ 
  systemNumbers, 
  selectedNumber, 
  attempts 
}) => {
  const [animatingNumbers, setAnimatingNumbers] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Generate random numbers for animation
    const numbers = Array.from({ length: Math.max(attempts, 3) }, () => 
      Math.floor(Math.random() * 100) + 1
    );
    setAnimatingNumbers(numbers);

    // Generate particles for visual effect
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 400,
      y: Math.random() * 300
    }));
    setParticles(newParticles);
  }, [attempts]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="relative bg-gradient-to-br from-purple-800/90 to-blue-800/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20"
      >
        {/* Title */}
        <motion.h2 
          animate={{ 
            scale: [1, 1.1, 1],
            color: ['#fff', '#fbbf24', '#fff']
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-3xl font-bold mb-8 text-center text-white"
        >
          Drawing Numbers...
        </motion.h2>
        
        {/* Animated Numbers */}
        <div className="flex justify-center gap-4 mb-6">
          {animatingNumbers.slice(0, 3).map((num, idx) => (
            <motion.div
              key={idx}
              initial={{ y: -100, opacity: 0, rotateY: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                rotateY: [0, 360, 720, 1080],
                scale: [0.5, 1.2, 1, 1.1, 1]
              }}
              transition={{ 
                delay: idx * 0.3,
                duration: 1.2,
                type: "spring",
                stiffness: 200
              }}
              className="relative"
            >
              {/* Main Number Circle */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 180, 360],
                  boxShadow: [
                    '0 0 20px rgba(251, 191, 36, 0.3)',
                    '0 0 40px rgba(251, 191, 36, 0.6)',
                    '0 0 20px rgba(251, 191, 36, 0.3)'
                  ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: idx * 0.2
                }}
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg border-2 border-white/30"
              >
                <motion.span
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: idx * 0.1
                  }}
                >
                  ?
                </motion.span>
              </motion.div>
              
              {/* Glow Effect */}
              <motion.div
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.4, 0, 0.4]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: idx * 0.3
                }}
                className="absolute inset-0 bg-yellow-400 rounded-full blur-xl"
              />

              {/* Ring Effect */}
              <motion.div
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: idx * 0.25
                }}
                className="absolute inset-0 border-2 border-purple-400 rounded-full"
              />
            </motion.div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: dot * 0.2
                }}
                className="w-3 h-3 bg-white rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Floating Particles */}
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            animate={{
              y: [particle.y, particle.y - 100, particle.y],
              x: [particle.x, particle.x + 50, particle.x],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: particle.id * 0.2
            }}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{ left: particle.x, top: particle.y }}
          />
        ))}

        {/* Decorative Elements */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-yellow-400 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-400 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 -left-5 w-10 h-10 bg-blue-400 rounded-full blur-2xl opacity-40" />
        <div className="absolute top-1/4 -right-5 w-10 h-10 bg-pink-400 rounded-full blur-2xl opacity-40" />
        
        {/* Loading Text */}
        <motion.div
          animate={{ 
            opacity: [0.5, 1, 0.5],
            scale: [0.95, 1.05, 0.95]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-center text-gray-200"
        >
          <div className="text-lg font-semibold mb-2">Generating lucky numbers...</div>
          <div className="text-sm opacity-75">Good luck!</div>
        </motion.div>

        {/* Spinning Border */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-3xl border-2 border-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 opacity-50"
          style={{
            background: 'conic-gradient(from 0deg, #fbbf24, #a855f7, #3b82f6, #fbbf24)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'subtract',
            padding: '2px'
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default GameAnimation;