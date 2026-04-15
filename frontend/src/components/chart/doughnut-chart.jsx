import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const FAKE_STATUS_DATA = {
  labels: ["Envoyé", "En attente", "Échec"],
  data: [65, 25, 10],
};

export default function DoughnutChart() {
  const [statusData, setStatusData] = useState(FAKE_STATUS_DATA);

  const data = {
    labels: statusData.labels,
    datasets: [
      {
        label: "Statut des envois",
        data: statusData.data,
        backgroundColor: [
          "rgba(81, 207, 102, 0.8)",
          "rgba(255, 193, 7, 0.8)",
          "rgba(255, 107, 107, 0.8)",
        ],
        borderColor: [
          "rgba(81, 207, 102, 1)",
          "rgba(255, 193, 7, 1)",
          "rgba(255, 107, 107, 1)",
        ],
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}
