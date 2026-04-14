import "./weeklyHeader.css";

interface Props {
  weekOffset: number;
}

export default function WeeklyHeader({ weekOffset }: Props) {
  const today = new Date();

  const startOfWeek = new Date(today);

  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(today.getDate() + diff + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);

    return d;
  });

  return (
    <div className="week-header">
      <div />

      {days.map((date, index) => {
        const today = new Date();

        const isToday =
          weekOffset === 0 && date.toDateString() === today.toDateString();

        return (
          <div key={index} className="day-header">
            <div className={`day-name ${isToday ? "today-name" : ""}`}>
              {date.toLocaleDateString("en-US", { weekday: "short" })}
            </div>

            <div className={`day-date ${isToday ? "today-date" : ""}`}>
              {date.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
