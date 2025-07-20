 import { useEffect, useState } from 'react';

function App() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('http://localhost:3001/logs');
      const data = await res.json();
      setLogs(data.reverse());
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 font-mono bg-black text-white min-h-screen">
      <h1 className="text-xl mb-4">📈 Fixorium Auto Trader</h1>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Token</th>
            <th>Profit %</th>
            <th>Tx1</th>
            <th>Tx2</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={idx} className="border-t border-gray-600">
              <td>{log.token}</td>
              <td>{log.profit.toFixed(2)}%</td>
              <td><a href={`https://solscan.io/tx/${log.tx1}`} target="_blank">View</a></td>
              <td><a href={`https://solscan.io/tx/${log.tx2}`} target="_blank">View</a></td>
              <td>{new Date(log.time).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
          
