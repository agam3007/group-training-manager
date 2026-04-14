import { useState } from "react";
import type { Training } from "@/shared/types";
import "./Library.css";

interface Props {
  trainings: Training[];
  onAdd: () => void;
  onSelect: (training: Training) => void;
}

export default function Library({ trainings, onAdd, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const getIcon = (type: string) => {
    switch (type) {
      case "swim":
        return "🏊";
      case "bike":
        return "🚴";
      case "run":
        return "🏃";
      case "strength":
        return "🏋️";
      default:
        return "📋";
    }
  };

  const grouped = trainings.reduce(
    (acc, t) => {
      if (!acc[t.type]) acc[t.type] = [];
      acc[t.type].push(t);
      return acc;
    },
    {} as Record<string, Training[]>,
  );

  const toggleGroup = (type: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div className="calendar-library">
      <div className="library-header">
        <div className="library-top">
          <input
            className="library-search"
            placeholder="Search training..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="library-add" onClick={onAdd}>
            +
          </button>
        </div>
      </div>

      <div className="library-list">
        {Object.entries(grouped).map(([type, list]) => {
          const isOpen = openGroups[type];

          return (
            <div key={type} className="library-group">
              {/* HEADER */}
              <div
                className="library-group-header"
                onClick={() => toggleGroup(type)}
              >
                <span>
                  {getIcon(type)} {type.toUpperCase()} ({list.length})
                </span>

                <span>{isOpen ? "▾" : "▸"}</span>
              </div>

              {/* ITEMS */}
              {isOpen && (
                <div className="library-group-items">
                  {list.map((t) => (
                    <div
                      key={t.id}
                      className="library-item"
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("training", JSON.stringify(t))
                      }
                      onClick={() => onSelect(t)}
                    >
                      <span className="library-icon">{getIcon(t.type)}</span>

                      <span>{t.title || "Untitled"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
