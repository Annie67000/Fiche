import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

// Register chart components
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function LineChart() {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Transactions",
        data: [50, 75, 125, 100, 200, 150], // Adjusted realistic data
        borderColor: "#51cf66", // Green to match project
        backgroundColor: "rgba(81, 207, 102, 0.2)", // Semi-transparent green fill
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: "#51cf66",
        tension: 0.3, // Smoother curve
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
}
