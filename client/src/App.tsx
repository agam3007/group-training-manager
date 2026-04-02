import { BrowserRouter, Routes, Route } from "react-router-dom"

import Dashboard from "./pages/Dashboard/Dashboard"
import Schedule from "./pages/Schedule/Schedule"

import { useState } from "react"
import type { Training } from "./types/training"
import AppLayout from "./components/layout/AppLayout"
import AthletesPage from "./pages/Athletes/Athlete"
import GroupsPage from "./pages/Groups/Group"
import AthleteDetails from "./pages/Athletes/AthleteDetails"
import AthleteFormPage from "./pages/Athletes/AthleteFormPage"
import GroupDetails from "./pages/Groups/GroupDetails"

function App(){

  const [trainings,setTrainings] =
    useState<Training[]>([])

  return(

    <BrowserRouter>

      <Routes>
        <Route element={<AppLayout />}>

        <Route
          path="/"
          element={
            <Dashboard
              setTrainings={setTrainings}
            />
          }
        />

        <Route
          path="/schedule"
          element={
            <Schedule
              trainings={trainings}
              setTrainings={setTrainings}
            />
          }
        />
        <Route path="/groups" element={<GroupsPage/>} />
<Route path="/athletes" element={<AthletesPage/>} />

<Route path="/athletes/:id" element={<AthleteDetails />} />

<Route path="/athletes" element={<AthletesPage/>} />

<Route path="/groups" element={<GroupsPage/>} />

<Route path="/groups/:id" element={<GroupDetails/>} />
  </Route>    </Routes>

    </BrowserRouter>

  )

}

export default App