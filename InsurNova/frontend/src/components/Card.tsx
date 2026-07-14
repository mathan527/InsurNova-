import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const hoverClass = hover ? 'card-hover cursor-pointer' : 'card';
  
  return (
    <div 
      className={`${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
