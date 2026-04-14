import "./StatsChart.css";
type Props = {
  data: number[];
};
const days = ["S", "M", "T", "W", "T", "F", "S"];
export default function StatsChart({ data }: Props) {
  const max = Math.max(...data, 1);

  return (
    <div className="chart">
      {data.map((d, i) => (
        <div key={i} className="bar">
          <div
            className="fill"
            style={{
              height: `${Math.max((d / max) * 100, 5)}%`,
            }}
          />

          <span className="label">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}
