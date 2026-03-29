import { useState } from "react";
import { api } from "../../api/api";

function TrainingBuilder() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const createTraining = async () => {
    await api.post("/trainings", {
      title,
      date
    });
  };

  return (
    <div>
      <h1>Create Training</h1>

      <input
        placeholder="Training title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <button onClick={createTraining}>
        Create
      </button>
    </div>
  );
}

export default TrainingBuilder;