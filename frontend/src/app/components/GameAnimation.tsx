import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameAnimationProps {
  systemNumbers: number[];
  selectedNumber: number;
  attempts: number;
}

const GameAnimation: React.FC<GameAnimationProps> = ({ systemNumbers, selectedNumber, attempts }) => {
  const [animatingNumbers, setAnimatingNumbers] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Generate random numbers for animation
    const numbers = Array.from({ length: attempts }, () => 
      Math.floor(Math.random() * 100) + 1
    );
    setAnimatingNumbers(numbers);
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
        className="bg-gradient-to-br from-purple-800 to-blue-800 p-8 rounded-3xl shadow-2xl"
      >
        <motion.h2 
          animate={{ 
            scale: [1, 1.1, 1],
            color: ['#fff', '#fbbf24', '#fff']
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-3xl font-bold mb-8 text-center"
        >
          Drawing Numbers...
        </motion.h2>
        
        <div className="flex justify-center gap-4">
          {animatingNumbers.map((num, idx) => (
            <motion.div
              key={idx}
              initial={{ y: -100, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                rotate: [0, 360, 720],
                scale: [0.5, 1.2, 1]
              }}
              transition={{ 
                delay: idx * 0.3,
                duration: 0.8,
                type: "spring",
                stiffness: 200
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: idx * 0.1
                }}
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold
                  bg-gradient-to-br from-gray-700 to-gray-900 text-white
                  shadow-lg border-2 border-white/20
                `}
              >
                <motion.span
                  animate={{
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity
                  }}
                >
                  ?
                </motion.span>
              </motion.div>
              
              {/* Glow effect */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: idx * 0.2
                }}
                className="absolute inset-0 bg-yellow-400 rounded-full blur-xl"
              />
            </motion.div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-yellow-400 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-400 rounded-full blur-3xl opacity-30" />
        
        {/* Loading text */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-center mt-8 text-gray-300"
        >
          Generating lucky numbers...
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default GameAnimation;