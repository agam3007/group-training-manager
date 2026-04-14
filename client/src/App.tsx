import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard/Dashboard";
import Schedule from "./pages/Schedule/Schedule";

import { useEffect, useState } from "react";
import type { Training } from "../../shared/types/training";
import AppLayout from "./components/layout/appLayout/AppLayout";
import AthletesPage from "./pages/Athletes/Athlete";
import GroupsPage from "./pages/Groups/Group";
import AthleteDetails from "./pages/AthleteDetails/AthleteDetails";
import GroupDetails from "./pages/GroupDetails/GroupDetails";
import { getTrainings } from "./api/training";

function App() {
  const [trainings, setTrainings] = useState<Training[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTrainings();
        setTrainings(data);
      } catch (err) {
        console.error("Failed to load trainings", err);
      }
    }

    load();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard setTrainings={setTrainings} />} />

          <Route
            path="/schedule"
            element={
              <Schedule trainings={trainings} setTrainings={setTrainings} />
            }
          />
          <Route
            path="/schedule/group/:groupId"
            element={
              <Schedule trainings={trainings} setTrainings={setTrainings} />
            }
          />

          <Route
            path="/schedule/athlete/:athleteId"
            element={
              <Schedule trainings={trainings} setTrainings={setTrainings} />
            }
          />
          <Route path="/athletes" element={<AthletesPage />} />

          <Route path="/athletes/:id" element={<AthleteDetails />} />

          <Route path="/groups" element={<GroupsPage />} />

          <Route path="/groups/:id" element={<GroupDetails />} />
        </Route>{" "}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
