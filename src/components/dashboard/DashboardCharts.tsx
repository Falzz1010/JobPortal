import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface ApplicationsChartProps {
  pending: number;
  reviewing: number;
  accepted: number;
  rejected: number;
}

export const ApplicationsStatusChart: React.FC<ApplicationsChartProps> = ({ 
  pending, 
  reviewing, 
  accepted, 
  rejected 
}) => {
  const data = {
    labels: ['Pending', 'Reviewing', 'Accepted', 'Rejected'],
    datasets: [
      {
        label: 'Applications by Status',
        data: [pending, reviewing, accepted, rejected],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="h-64">
      <Doughnut 
        data={data} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'Applications by Status'
            }
          }
        }} 
      />
    </div>
  );
};

interface JobsActivityChartProps {
  months: string[];
  jobsPosted: number[];
  applications: number[];
}

export const JobsActivityChart: React.FC<JobsActivityChartProps> = ({
  months,
  jobsPosted,
  applications
}) => {
  const data = {
    labels: months,
    datasets: [
      {
        label: 'Jobs Posted',
        data: jobsPosted,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Applications Received',
        data: applications,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ],
  };

  return (
    <div className="h-64">
      <Bar 
        data={data} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Monthly Activity'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }} 
      />
    </div>
  );
};

interface ApplicationTrendsProps {
  dates: string[];
  applications: number[];
}

export const ApplicationTrendsChart: React.FC<ApplicationTrendsProps> = ({
  dates,
  applications
}) => {
  const data = {
    labels: dates,
    datasets: [
      {
        fill: true,
        label: 'Applications',
        data: applications,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ],
  };

  return (
    <div className="h-64">
      <Line 
        data={data} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: true,
              text: 'Application Trends'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }} 
      />
    </div>
  );
};