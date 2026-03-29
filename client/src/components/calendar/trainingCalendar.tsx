import "./calendar.css"

import WeekHeader from "./weeklyHeader"
import DaySummaryRow from "./daySummeryRow"
import TimeColumn from "./TimeColumn"
import CalendarGrid from "./calendarGrid"

import { useState } from "react"
import type { Training } from "../../types/training"
import TrainingPopup from "../TrainingPopup/TrainingPopup"

interface Props{
  trainings: Training[]
  setTrainings: React.Dispatch<
    React.SetStateAction<Training[]>
  >
}

export default function TrainingCalendar({
  trainings,
  setTrainings
}:Props){

const [weekOffset,setWeekOffset] = useState(0)

  const [editing,setEditing] =
  useState<Training | null>(null)

  const [selectedCell,setSelectedCell] =
useState<{day:number,hour:number} | null>(null)
const today = new Date()

const startOfWeek = new Date(today)

const day = today.getDay()
const diff = day === 0 ? -6 : 1 - day

startOfWeek.setDate(today.getDate() + diff + weekOffset*7)

const endOfWeek = new Date(startOfWeek)
endOfWeek.setDate(startOfWeek.getDate()+6)
const handleEmptyCellClick = (day:number,hour:number)=>{

const newTraining:Training = {
  id:crypto.randomUUID(),
  title:"",
  description:"",
  sets:[],
  day,
  startHour:hour,
  startMinute:0,
  duration:60,
  type:"swim"
}

  setSelectedCell({day,hour})
  setEditing(newTraining)

}

  return (

    <div className="calendar">
<div className="calendar-nav">

  <button
    onClick={()=>setWeekOffset(w=>w-1)}
  >
    ◀
  </button>

  <button
    onClick={()=>setWeekOffset(0)}
  >
    Today
  </button>

  <button
    onClick={()=>setWeekOffset(w=>w+1)}
  >
    ▶
  </button>

  <div className="week-range">

    {startOfWeek.toLocaleDateString("en-US",{month:"short",day:"numeric"})}

    {" - "}

    {endOfWeek.toLocaleDateString("en-US",{month:"short",day:"numeric"})}

  </div>

</div>
<WeekHeader weekOffset={weekOffset}/>
      <DaySummaryRow />

      <div className="calendar-body">

        <TimeColumn />

<CalendarGrid
    trainings={trainings}
    setTrainings={setTrainings}
    onEdit={setEditing}
    onEmptyCellClick={handleEmptyCellClick}
    weekOffset={weekOffset}
/>
      </div>

      {editing && (

  <TrainingPopup
    training={editing}
    onClose={()=>setEditing(null)}
    onSave={(updated)=>{

setTrainings(prev => {

  const exists = prev.find(t=>t.id===updated.id)

  if(exists){

    return prev.map(t=>
      t.id===updated.id
        ? updated
        : t
    )

  }

  return [...prev,updated]

})

    }}
  />

)}

    </div>

  )
}