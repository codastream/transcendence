import { HTMLMotionProps, motion, useAnimation } from 'framer-motion';
import React, { useMemo } from 'react';

interface CircleButtonProps extends HTMLMotionProps<'button'> {
  className?: string;
  isGrowing?: boolean;
  isMoving: boolean;
  children?: React.ReactNode;
  size?: number;
}

const dropdownStyle = 'shadow-[0_10px_10px_1px_rgba(205,205,205,0.4)] ';

export const CircleButton = ({
  children,
  className = '',
  isGrowing = true,
  isMoving = false,
  size = 70,
  ...props
}: CircleButtonProps) => {
  const controls = useAnimation();
  const floatPattern = useMemo(() => {
    const xA = (Math.random() - 0.5) * 22;
    const xB = (Math.random() - 0.5) * 22;
    const yA = (Math.random() - 0.5) * 22;
    const yB = (Math.random() - 0.5) * 22;
    const duration = 7 + Math.random() * 5;
    return {
      x: [0, xA, xB, 0],
      y: [0, yA, yB, 0],
      duration,
      delay: Math.random() * 2,
    };
  }, []);

  const handleMouseMove = () => {
    if (!isMoving) return;
    const randomX = (Math.random() - 0.5) * 90;
    const randomY = (Math.random() - 0.5) * 100;
    controls.start({
      x: randomX,
      y: randomY,
      transition: { type: 'spring', stiffness: 300, damping: 10 },
    });
  };
  const resetPosition = () => {
    if (isMoving) controls.start({ x: 0, y: 0 });
  };

  return (
    <motion.div
      animate={
        isMoving
          ? {
              x: floatPattern.x,
              y: floatPattern.y,
            }
          : { x: 0, y: 0 }
      }
      transition={
        isMoving
          ? {
              duration: floatPattern.duration,
              delay: floatPattern.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
      className="inline-block"
    >
      <motion.button
        {...props}
        animate={isMoving ? controls : { x: 0, y: 0 }}
        onMouseEnter={handleMouseMove}
        onMouseLeave={resetPosition}
        whileHover={isGrowing ? { scale: 1.1, color: '#029c8a' } : {}}
        whileTap={{ scale: 0.95, color: '#11ccbb' }}
        transition={{ duration: 0.3 }}
        style={{ width: size, height: size }}
        className={`
      basis-50
      m-10 p-6    
      aspect-square
      rounded-full
      bg-slate-100/80
      flex items-center justify-center
      font-quantico border border-cyan-300
      text-xl 
      text-gray-700
      cursor-pointer
      disabled:opacity-50 disabled:cursor-not-allowed
      ${dropdownStyle}
      ${className}
`}
      >
        <span className="text-xl text-center whitespace-wrap">{children}</span>
      </motion.button>
    </motion.div>
  );
};
