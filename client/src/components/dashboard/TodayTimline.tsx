import { useState } from "react"
import type { DayEvent } from "../../types/dayEvent"
import AddEventModal from "./AddEventModal"
import "./TodayTimline.css"

interface Props{

  events:DayEvent[]

  onAdd:(event:DayEvent)=>void

  onUpdate:(event:DayEvent)=>void

  onDelete:(id:string)=>void

  onToggleDone:(id:string)=>void

}

export default function TodayTimeline({

  events,
  onAdd,
  onUpdate,
  onDelete,
  onToggleDone

}:Props){

  const [open,setOpen] = useState(false)

  const [editing,setEditing] =
    useState<DayEvent|null>(null)

  const sorted =
    [...events].sort(
      (a,b)=>a.time.localeCompare(b.time)
    )

  const color=(type:string)=>{

    if(type==="training") return "#22c55e"
    if(type==="task") return "#f59e0b"
    if(type==="call") return "#3b82f6"

    return "#94a3b8"

  }

  return(

    <div className="timeline-card">

      <div className="timeline-header">

        <h3>Today's Schedule</h3>

        <button
          className="add-btn"
          onClick={()=>setOpen(true)}
        >
          +
        </button>

      </div>

      <div className="timeline">

        {sorted.map(e=>(

          <div
            key={e.id}
            className="timeline-item"
          >

            <div className="timeline-time">
              {e.time}
            </div>

            <div className="timeline-dot"/>

            <div
              className={`timeline-event ${
                e.done ? "done":""}`
              }

              style={{
                borderLeft:
                `4px solid ${color(e.type)}`
              }}
            >

              <div className="event-title">
                {e.title}
              </div>

              <div className="event-type">
                {e.type}
              </div>

              <div className="event-actions">

                <button
                  onClick={()=>onToggleDone(e.id)}
                >
                  ✓
                </button>

                <button
                  onClick={()=>setEditing(e)}
                >
                  Edit
                </button>

                <button
                  onClick={()=>onDelete(e.id)}
                >
                  🗑
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

      {open &&

        <AddEventModal
          onClose={()=>setOpen(false)}
          onAdd={(event)=>{

            onAdd(event)
            setOpen(false)

          }}
        />

      }

      {editing &&

        <AddEventModal

          event={editing}

          onClose={()=>setEditing(null)}

          onAdd={()=>{}}

          onUpdate={(event)=>{

            onUpdate(event)

            setEditing(null)

          }}

        />

      }

    </div>

  )

}