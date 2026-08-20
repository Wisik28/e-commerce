import React, { useState } from 'react';

// ==========================================
// TREND CHART (SVG Line & Area Chart)
// ==========================================
export const TrendChart = ({ data = [], height = 200, labels = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Tidak ada data chart.</div>;

  const padding = 40;
  const chartHeight = height - padding * 2;
  const chartWidth = 500; // viewbox basis
  
  const minVal = 0;
  const maxVal = Math.max(...data) * 1.1 || 100;
  
  // Calculate points
  const points = data.map((val, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / (data.length - 1);
    const y = padding + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, value: val, label: labels[idx] || `Point ${idx + 1}` };
  });

  // Create path strings
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    // Area path closes at the bottom
    areaPath = linePath + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  }

  // Y-axis grid helper
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const formatCurrency = (val) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
    return `Rp ${val}`;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${chartWidth} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines & Y Axis Labels */}
        {gridLines.map((ratio, idx) => {
          const y = padding + chartHeight * ratio;
          const gridVal = maxVal - ratio * (maxVal - minVal);
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="var(--neutral-200)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill="var(--neutral-400)">
                {formatCurrency(gridVal)}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {points.map((p, idx) => (
          <text key={idx} x={p.x} y={height - padding + 20} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--neutral-400)">
            {p.label}
          </text>
        ))}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}

        {/* Trend Line */}
        {linePath && <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Active Dots & Hover Hotspots */}
        {points.map((p, idx) => (
          <g key={idx}>
            {/* Interactive Dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === idx ? 6 : 4}
              fill={hoveredIndex === idx ? 'var(--primary)' : 'var(--white)'}
              stroke="var(--primary)"
              strokeWidth={hoveredIndex === idx ? 3 : 2}
              style={{ transition: 'all 0.15s ease' }}
            />
            {/* Invisible larger hover zone */}
            <circle
              cx={p.x}
              cy={p.y}
              r="20"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div style={{
          position: 'absolute',
          left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
          top: `${(points[hoveredIndex].y / height) * 100 - 45}%`,
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--neutral-900)',
          color: 'var(--white)',
          padding: '0.4rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: '600',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          {points[hoveredIndex].label} · <span style={{ color: 'var(--primary)' }}>{formatCurrency(points[hoveredIndex].value)}</span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// DONUT CHART (SVG Donut with Legends)
// ==========================================
export const DonutChart = ({ data = {} }) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const total = values.reduce((sum, v) => sum + v, 0);

  if (total === 0) return <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--neutral-400)' }}>Tidak ada data status.</div>;

  const colors = {
    terkirim: '#16A34A',
    dikirim: '#0EA5E9',
    diproses: '#F97316',
    menunggu: '#D97706',
    aktif: '#16A34A',
    rendah: '#F97316',
    habis: '#DC2626',
    lambat: '#9CA3AF',
    sehat: '#16A34A',
  };

  const getLabel = (key) => {
    const labelsMap = {
      terkirim: 'Terkirim',
      dikirim: 'Dikirim',
      diproses: 'Diproses',
      menunggu: 'Menunggu',
      aktif: 'Aktif',
      rendah: 'Stok Rendah',
      habis: 'Stok Habis',
      lambat: 'Lambat',
      sehat: 'Sehat',
    };
    return labelsMap[key] || key;
  };

  // SVG calculations
  const radius = 35;
  const strokeWidth = 14;
  const circ = 2 * Math.PI * radius; // ~219.9

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--neutral-100)" strokeWidth={strokeWidth} />
          {keys.map((key, idx) => {
            const val = data[key];
            if (val === 0) return null;
            const percent = val / total;
            const strokeLength = circ * percent;
            const strokeOffset = circ - (circ * percent) + (circ * accumulatedPercent);
            
            accumulatedPercent -= percent;

            return (
              <circle
                key={key}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={colors[key] || '#9CA3AF'}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circ}`}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--neutral-900)' }}>{total}</div>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        {keys.map(key => {
          const val = data[key];
          const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', color: 'var(--neutral-600)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors[key] || '#9CA3AF', display: 'inline-block' }}></span>
                <span>{getLabel(key)}</span>
              </div>
              <div style={{ fontWeight: '700', color: 'var(--neutral-800)' }}>
                {val} <span style={{ fontWeight: '500', color: 'var(--neutral-400)', fontSize: '0.75rem', marginLeft: '4px' }}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// HORIZONTAL BAR LIST
// ==========================================
export const HorizontalBarList = ({ items = [] }) => {
  if (items.length === 0) return <div style={{ color: 'var(--neutral-400)', fontSize: '0.8rem' }}>Tidak ada data ranking.</div>;

  const maxVal = Math.max(...items.map(item => item.value)) || 1;

  const formatVal = (val) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
    return val.toString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map((item, idx) => {
        const percentage = (item.value / maxVal) * 100;
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--neutral-800)' }}>
                {item.rank && <span style={{ color: 'var(--neutral-400)', fontWeight: '800' }}>{item.rank}</span>}
                <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: '700', color: 'var(--neutral-900)' }}>{formatVal(item.value)}</span>
                {item.subtitle && <span style={{ color: 'var(--neutral-400)', fontSize: '0.75rem', marginLeft: '6px' }}>{item.subtitle}</span>}
              </div>
            </div>
            
            <div className="progress-bar-track" style={{ height: '6px' }}>
              <div className="progress-bar-fill" style={{ width: `${percentage}%`, height: '100%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
