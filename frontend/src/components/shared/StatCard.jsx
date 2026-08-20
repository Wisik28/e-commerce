import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ label, value, icon: Icon, caption, trend, highlight }) => {
  const getHighlightClass = () => {
    if (highlight === 'amber') return 'highlight-amber';
    if (highlight === 'red') return 'highlight-red';
    return '';
  };

  return (
    <div className={`stat-card ${getHighlightClass()}`}>
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon-wrapper">
            <Icon size={18} />
          </div>
        )}
      </div>
      
      <div className="stat-value">{value}</div>
      
      {(caption || trend) && (
        <div className="stat-footer">
          {trend && (
            <span className={`stat-trend ${trend.type === 'up' ? 'up' : trend.type === 'down' ? 'down' : 'neutral'}`}>
              {trend.type === 'up' ? <TrendingUp size={12} /> : trend.type === 'down' ? <TrendingDown size={12} /> : null}
              {trend.value}
            </span>
          )}
          {caption && <span className="stat-caption">{caption}</span>}
        </div>
      )}
    </div>
  );
};
export default StatCard;
