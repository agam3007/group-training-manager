import "./Stats.css";
import { useLang } from "@/i18n/LanguageContext";

interface Props {
  athletes: number;
  groups: number;
  trainingsToday: number;
  callsPending: number;
}

export default function Stats({
  athletes,
  groups,
  trainingsToday,
  callsPending,
}: Props) {
  const { t } = useLang();

  return (
    <div className="stats-container">
      <div className="stat-item">
        <span className="stat-label">{t("dash.stats.athletes")}:</span>
        <span className="stat-value">{athletes}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">{t("dash.stats.groups")}:</span>
        <span className="stat-value">{groups}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">{t("dash.stats.trainingsToday")}:</span>
        <span className="stat-value">{trainingsToday}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">{t("dash.stats.atRisk")}:</span>
        <span className="stat-value">{callsPending}</span>
      </div>
    </div>
  );
}