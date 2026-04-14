import "./TimeColumn.css";
const hours = Array.from({ length: 16 }, (_, i) => i + 6);

export default function TimeColumn() {
  return (
    <div className="time-column">
      {hours.map((hour) => (
        <div key={hour} className="time-cell">
          {hour}:00
        </div>
      ))}
    </div>
  );
}
