import { useState, useEffect } from "react";
import "./App.css";
import { api } from "./services/api";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LineElement, PointElement, LinearScale, Title, Tooltip, Legend } from "chart.js";
import dayjs from "dayjs";

// Registrando os componentes necessários
ChartJS.register(CategoryScale, LineElement, PointElement, LinearScale, Title, Tooltip, Legend);

interface EquipmentDataProps {
  equipmentId: string;
  timestamp: string;
  value: number;
}

interface DateGroup {
  [date: string]: number[];
}

interface EquipmentGroup {
  [equipmentId: string]: DateGroup;
}

interface Averages {
  [equipmentId: string]: { [date: string]: number };
}

function App() {
  const [payloads, setPayloads] = useState<EquipmentDataProps[]>([]);
  const [averages, setAverages] = useState<Averages>({});

  useEffect(() => {
    async function fetchPayloads() {
      const response = await api.get("/payloads");
      setPayloads(response.data);
      calculateAverages(response.data);
    }
    fetchPayloads();
  }, []);

  function calculateAverages(data: EquipmentDataProps[]) {
    const grouped: EquipmentGroup = data.reduce((acc: EquipmentGroup, curr) => {
      const date = dayjs(curr.timestamp).format("YYYY-MM-DD");
      if (!acc[curr.equipmentId]) {
        acc[curr.equipmentId] = {}; // Asegura que este objeto segue a interface DateGroup
      }
      if (!acc[curr.equipmentId][date]) {
        acc[curr.equipmentId][date] = [];
      }
      acc[curr.equipmentId][date].push(curr.value);
      return acc;
    }, {} as EquipmentGroup); // Cast inicial para EquipmentGroup

    const avgs: Averages = Object.keys(grouped).reduce((acc: Averages, equipId) => {
      acc[equipId] = Object.keys(grouped[equipId]).reduce((subAcc: { [date: string]: number }, date) => {
        const values = grouped[equipId][date];
        subAcc[date] = values.reduce((a, b) => a + b, 0) / values.length;
        return subAcc;
      }, {});
      return acc;
    }, {} as Averages); // Cast inicial para Averages

    setAverages(avgs);
  }

  const data = {
    labels: payloads.map(p => new Date(p.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: "Equipment Values",
        data: payloads.map(p => p.value),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)"
      }
    ]
  };

  return (
    <>
      <h2>Testando a leitura dos dados da API Payloads</h2>
      <Line data={data} />
      {/* Renderizando as médias aqui */}
      {Object.entries(averages).map(([equipId, dates]) => (
        <div key={equipId}>
          <h3>Equipment ID: {equipId}</h3>
          {Object.entries(dates).map(([date, avg]) => (
            <p key={date}>
              {date}: {avg.toFixed(2)}
            </p>
          ))}
        </div>
      ))}
    </>
  );
}

export default App;
