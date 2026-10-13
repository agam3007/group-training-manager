import { BrowserRouter, Routes, Route } from "react-router-dom"

import Dashboard from "./pages/Dashboard/Dashboard"
import Schedule from "./pages/Schedule/Schedule"

import { useEffect, useState } from "react"
import type { Training } from "../../shared/types/training"
import AppLayout from "./components/layout/appLayout/AppLayout"
import AthletesPage from "./pages/Athletes/Athlete"
import GroupsPage from "./pages/Groups/Group"
import AthleteDetails from "./pages/AthleteDetails/AthleteDetails"
import TrainingPlan from "./pages/TrainingPlan/TrainingPlan"
import ProgramCalendarPage from "./pages/TrainingPlan/ProgramCalendarPage"
import Login from "./pages/Login/Login"
import { RequireAuth } from "./auth/AuthContext"

function App(){

  const [trainings,setTrainings] =
    useState<Training[]>([])

  useEffect(()=>{
    async function load(){
      try{
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/trainings`)
        const data = await res.json()
        setTrainings(data)
      }catch(err){
        console.error("Failed to load trainings",err)
      }
    }
    load()
  },[])

  return(

    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/schedule" element={<Schedule trainings={trainings} setTrainings={setTrainings}/>} />
          <Route path="/schedule/group/:groupId" element={<Schedule trainings={trainings} setTrainings={setTrainings}/>} />
          <Route path="/schedule/athlete/:athleteId" element={<Schedule trainings={trainings} setTrainings={setTrainings}/>} />
          <Route path="/athletes" element={<AthletesPage/>} />
          <Route path="/athletes/:id" element={<AthleteDetails />} />
          <Route path="/groups" element={<GroupsPage/>} />
          <Route path="/groups/:id" element={<GroupsPage/>} />
          <Route path="/training-plans" element={<TrainingPlan/>} />
          <Route path="/training-plans/calendar" element={<ProgramCalendarPage/>} />
        </Route>
      </Routes>
    </BrowserRouter>

  )

}

export default App