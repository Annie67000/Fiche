import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function LineChart() {
  const [chartData, setChartData] = useState({ labels: [], data: [] });

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8003";
    fetch(`${API_BASE_URL}/api/v1/transaction-stats/`)
      .then((res) => res.json())
      .then((result) => {
        if (result.labels && result.labels.length > 0) {
          const labels = result.labels.map((date) => {
            const monthIndex = parseInt(date.split("-")[1], 10) - 1;
            return MONTH_NAMES[monthIndex] || date;
          });
          setChartData({
            labels,
            data: result.data,
          });
        }
      })
      .catch((err) => console.error("Erreur fetch transaction stats:", err));
  }, []);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Nombre de fichiers",
        data: chartData.data,
        backgroundColor: "rgba(121, 80, 242, 0.8)",
        borderColor: "#7950f2",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
