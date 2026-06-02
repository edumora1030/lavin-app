import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  DoughnutController,
  RadarController,
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  DoughnutController,
  RadarController,
);

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
  /* Paleta dashboard RH — azul marino */
  brand: '#0f2744',
  brandMid: '#1e3a5f',
  brandLight: '#2563eb',
  brandPale: '#93c5fd',
  accent: '#f59e0b',
  accentBlue: '#3b82f6',
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

export function lineOptions() {
  return {
    ...baseOptions,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: COLORS.muted, font: { size: 11 }, maxRotation: 45, minRotation: 0 },
      },
      y: {
        grid: { color: COLORS.grid, drawBorder: false },
        ticks: { color: COLORS.muted, font: { size: 11 } },
        beginAtZero: true,
        max: 100,
      },
    },
    plugins: {
      ...baseOptions.plugins,
      legend: { position: 'top', align: 'end' },
    },
  };
}

export function radarOptions() {
  return {
    ...baseOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: { color: COLORS.grid },
        angleLines: { color: COLORS.grid },
        pointLabels: { color: COLORS.navy, font: { size: 11, weight: '600' } },
        ticks: { display: false },
      },
    },
    plugins: {
      ...baseOptions.plugins,
      legend: { position: 'bottom' },
    },
  };
}

export function doughnutOptionsCompact() {
  return {
    ...doughnutOptions(''),
    cutout: '72%',
    plugins: {
      ...baseOptions.plugins,
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } },
    },
  };
}
