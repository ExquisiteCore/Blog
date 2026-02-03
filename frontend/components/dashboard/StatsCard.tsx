interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export default function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-base-content/60">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-base-content/50 mt-1">{description}</p>
            )}
            {trend && (
              <p className={`text-xs mt-1 ${trend.isUp ? 'text-success' : 'text-error'}`}>
                {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className="text-primary opacity-80">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
