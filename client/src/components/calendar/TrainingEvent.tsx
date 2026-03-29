import { useState } from "react"
import type { Training } from "../../types/training"

interface Props {
  training: Training
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>
  onEdit: (training: Training) => void
}

export default function TrainingEvent({
  training,
  setTrainings,
  onEdit
}: Props) {

  const PIXELS_PER_HOUR = 60
  const PIXELS_PER_MINUTE = 1

  const START_HOUR = 6   // 👈 הלוח מתחיל ב-6

  const [dragging,setDragging] = useState(false)
  const [resizing,setResizing] = useState(false)

  const top =
    (training.startHour - START_HOUR) * PIXELS_PER_HOUR +
    training.startMinute * PIXELS_PER_MINUTE

  const height =
    training.duration * PIXELS_PER_MINUTE

  const handleMouseDown = (e:React.MouseEvent)=>{

    if((e.target as HTMLElement).classList.contains("resize-handle")){
      setResizing(true)
    }else{
      setDragging(true)
    }

  }

  const handleMouseUp = ()=>{
    setDragging(false)
    setResizing(false)
  }

  const handleMouseMove = (e:React.MouseEvent)=>{

    const minutes = Math.round(e.movementY)

    if(dragging){

      setTrainings(prev =>
        prev.map(t=>{

          if(t.id !== training.id) return t

          let total =
            t.startHour*60 +
            t.startMinute +
            minutes

          if(total < START_HOUR*60) total = START_HOUR*60

          return{
            ...t,
            startHour: Math.floor(total/60),
            startMinute: total%60
          }

        })
      )

    }

    if(resizing){

      setTrainings(prev =>
        prev.map(t=>{

          if(t.id !== training.id) return t

          return{
            ...t,
            duration: Math.max(15,t.duration+minutes)
          }

        })
      )

    }

  }

  return(

    <div
      className={`training-event training-${training.type}`}
      style={{top,height}}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onDoubleClick={(e)=>{
        e.stopPropagation()
        onEdit(training)
      }}
    >

      <div className="training-title">
        {training.title}
      </div>

      <div className="training-description">
        {training.description}
      </div>

      <div className="resize-handle"/>

    </div>

  )

}