// PieChart.js
import React, { useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const PieChart = ({ data, id }) => {
  useEffect(() => {
    const chartInstance = new Chart(document.getElementById(id), {
      type: `pie`,
      data: data,
    });

    console.log("Chart created with id:", id);

    return () => {
      console.log("Destroying chart with id:", id);
      chartInstance.destroy();
    };
  }, [data, id]);

  return <canvas id={id} />;
};

export default PieChart;
