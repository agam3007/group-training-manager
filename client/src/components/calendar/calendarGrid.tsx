import TrainingEvent from "./TrainingEvent"
import type { Training } from "../../types/training"

interface Props{
  trainings: Training[]
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>
  onEdit: (training: Training)=>void
  onEmptyCellClick:(day:number,hour:number)=>void
  weekOffset:number
}

const hours = Array.from({length:16},(_,i)=>i + 6)
const days = new Array(7).fill(null)

function CurrentTimeLine(){

  const now = new Date()

  const START_HOUR = 6

  const hour = now.getHours()
  const minute = now.getMinutes()

  if(hour < START_HOUR) return null

  const top =
    (hour - START_HOUR) * 60 +
    minute

  return(

    <div
      className="current-time-line"
      style={{top}}
    />

  )

}

export default function CalendarGrid({
  trainings,
  setTrainings,
  onEdit,
  onEmptyCellClick,
  weekOffset
}:Props){

  const handleDrop = (
    e:React.DragEvent,
    day:number
  )=>{

    const id = e.dataTransfer.getData("id")

    setTrainings(prev =>
      prev.map(t=>
        t.id===id
          ? {...t,day}
          : t
      )
    )

  }

  return(

    <>
      {days.map((_,dayIndex)=>{

        const today = new Date()

        const isToday =
          weekOffset === 0 &&
          dayIndex === today.getDay()-1

        return(

          <div
            key={dayIndex}
            className={`day-column ${isToday ? "today-column" : ""}`}
            onDragOver={e=>e.preventDefault()}
            onDrop={(e)=>handleDrop(e,dayIndex)}
          >

            {isToday && <CurrentTimeLine />}

            {hours.map(hour=>(

              <div
                key={hour}
                className="hour-cell"
                onClick={()=>onEmptyCellClick(dayIndex,hour)}
              />

            ))}

            {trainings
              .filter(t=>t.day===dayIndex)
              .map(training=>(

                <div
                  key={training.id}
                  draggable
                  onDragStart={e=>
                    e.dataTransfer.setData(
                      "id",
                      training.id
                    )
                  }
                >

                  <TrainingEvent
                    training={training}
                    setTrainings={setTrainings}
                    onEdit={onEdit}
                  />

                </div>

              ))}

          </div>

        )

      })}
    </>

  )

}