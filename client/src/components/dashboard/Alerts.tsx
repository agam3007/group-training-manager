interface Alert {
  id: string;

  message: string;
}

interface Props {
  alerts: Alert[];
}

export default function Alerts({ alerts }: Props) {
  return (
    <div className="dashboard-card">
      <h3>Alerts</h3>

      {alerts.map((a) => (
        <div key={a.id}>⚠ {a.message}</div>
      ))}
    </div>
  );
}
