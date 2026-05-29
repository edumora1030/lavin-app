import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

export const COLORS = {
  navy: '#0f2744',
  navyMid: '#1e3a5f',
  blue: '#2563eb',
  blueLight: '#3b82f6',
  bluePale: '#93c5fd',
  success: '#16a34a',
  successPale: '#86efac',
  warning: '#f59e0b',
  warningPale: '#fcd34d',
  danger: '#dc2626',
  dangerPale: '#fca5a5',
  muted: '#64748b',
  grid: '#e2e8f0',
};

export const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 18,
        font: { family: 'Inter, system-ui, sans-serif', size: 12 },
        color: COLORS.navy,
      },
    },
    tooltip: {
      backgroundColor: COLORS.navy,
      titleFont: { family: 'Inter, system-ui, sans-serif', size: 13 },
      bodyFont: { family: 'Inter, system-ui, sans-serif', size: 12 },
      padding: 12,
      cornerRadius: 8,
    },
  },
};

export function doughnutOptions(title) {
  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      title: title ? { display: true, text: title, color: COLORS.navy, font: { size: 14, weight: '600' } } : undefined,
    },
  };
}

export function barOptions(title, horizontal = false) {
  return {
    ...baseOptions,
    indexAxis: horizontal ? 'y' : 'x',
    scales: {
      x: {
        grid: { color: COLORS.grid, drawBorder: false },
        ticks: { color: COLORS.muted, font: { size: 11 } },
      },
      y: {
        grid: { color: COLORS.grid, drawBorder: false },
        ticks: { color: COLORS.muted, font: { size: 11 } },
        beginAtZero: true,
      },
    },
    plugins: {
      ...baseOptions.plugins,
      title: title ? { display: true, text: title, color: COLORS.navy, font: { size: 14, weight: '600' } } : undefined,
    },
  };
}
