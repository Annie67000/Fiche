import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

// Enregistrer les éléments nécessaires
ChartJS.register(ArcElement, Tooltip, Legend);

export default function DoughnutChart() {
  const data = {
    labels: ["En attente", "Envoyé", "Échec"],
    datasets: [
      {
        label: "Statut des envois (%)",
        data: [50, 40, 10],
        backgroundColor: [
          "rgba(255, 193, 7, 0.7)", // Yellow for largest
          "rgba(81, 207, 102, 0.7)", // Green for medium
          "rgba(255, 107, 107, 0.7)" // Red for smallest
        ],
        borderColor: [
          "rgba(255, 193, 7, 1)",
          "rgba(81, 207, 102, 1)",
          "rgba(255, 107, 107, 1)"
        ],
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    cutout: "60%" // taille du trou au centre (donut)
  };

  return <Doughnut data={data} options={options} />;
}
