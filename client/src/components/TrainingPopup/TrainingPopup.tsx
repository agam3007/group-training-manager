import type { Training, WorkoutStep } from "../../types/training"
import { useState,useMemo } from "react"

import WorkoutBuilder from "../workoutBuilder/WorkoutBuilder"
import TrainingTypeSelector from "./TrainingTypeSelector"
import EquipmentChecklist from "./EquipmentCheckList"

interface Props{

  training: Training

  onSave:(training:Training)=>void

  onClose:()=>void

}

export default function TrainingPopup({
  training,
  onSave,
  onClose
}:Props){

const [title,setTitle]=
useState(training.title)

const [description,setDescription]=
useState(training.description)

const [type,setType]=
useState(training.type)

const [steps,setSteps]=
useState<WorkoutStep[]>(training.steps||[])

const [equipment,setEquipment]=
useState<string[]>(training.equipment||[])

const [notes,setNotes]=
useState(training.notes||"")

const totalDistance = useMemo(()=>{

return steps.reduce((sum,step)=>{

if("distance" in step){

return sum + step.distance * step.reps

}

return sum

},0)

},[steps])

const save=()=>{

onSave({

...training,

title,

description,

type,

steps,

equipment,

notes

})

onClose()

}

return(

<div className="popup">

<div className="training-popup">

<div className="training-header">

<h2>

{title||"New Training"}

</h2>

<div className="training-stats">

<span>{steps.length} Steps</span>

<span>{totalDistance}</span>

</div>

<button
className="close-btn"
onClick={onClose}
>
✕
</button>

</div>

<div className="training-body">

<div className="training-left">

<input
className="input"
placeholder="Title"
value={title}
onChange={e=>setTitle(e.target.value)}
/>

<textarea
className="textarea"
placeholder="Workout description"
value={description}
onChange={e=>setDescription(e.target.value)}
/>

<WorkoutBuilder
steps={steps}
setSteps={setSteps}
/>

</div>

<div className="training-right">

<h4>Training Type</h4>

<TrainingTypeSelector
value={type}
onChange={setType}
/>

<EquipmentChecklist
equipment={equipment}
setEquipment={setEquipment}
/>

<h4>Notes</h4>

<textarea
value={notes}
onChange={e=>setNotes(e.target.value)}
/>

</div>

</div>

<div className="training-footer">

<button
className="save-btn"
onClick={save}
>

Save Training

</button>

<button
className="cancel-btn"
onClick={onClose}
>

Cancel

</button>

</div>

</div>

</div>

)

}