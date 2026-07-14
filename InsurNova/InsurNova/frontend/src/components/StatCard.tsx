import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
  className?: string;
}

export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  iconColor = 'text-primary-400',
  className = ''
}: StatCardProps) {
  return (
    <div className={`stat-card group ${className}`}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-white/5 ${iconColor} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      
      <div className="mt-4 space-y-1">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}
