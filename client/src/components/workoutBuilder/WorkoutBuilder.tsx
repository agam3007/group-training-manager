import type { WorkoutStep, EnduranceSet } from "../../types/training"
import EnduranceSetCard from "./EnduranceSetCard"

interface Props{

steps:WorkoutStep[]

setSteps:React.Dispatch<
React.SetStateAction<WorkoutStep[]>
>

}

export default function WorkoutBuilder({
steps,
setSteps
}:Props){

function addSet(type:"warmup"|"main"|"cooldown"){

const newSet:EnduranceSet={

id:crypto.randomUUID(),

setType:type,

reps:1,

distance:100,

unit:"m"

}

setSteps(prev=>[
...prev,
newSet
])

}

function update(id:string,data:any){

setSteps(prev=>
prev.map(s=>
s.id===id
?{...s,...data}
:s
)
)

}

function remove(id:string){

setSteps(prev=>
prev.filter(s=>s.id!==id)
)

}

function duplicate(step:WorkoutStep){

const copy={

...step,

id:crypto.randomUUID()

}

setSteps(prev=>[
...prev,
copy
])

}

return(

<div className="builder">

{steps.map(step=>(

"distance" in step && (

<EnduranceSetCard
key={step.id}
set={step}
update={update}
remove={remove}
duplicate={()=>duplicate(step)}
/>

)

))}

<div className="builder-actions">

<button
onClick={()=>addSet("warmup")}
>

+ Warmup

</button>

<button
onClick={()=>addSet("main")}
>

+ Main

</button>

<button
onClick={()=>addSet("cooldown")}
>

+ Cooldown

</button>

</div>

</div>

)

}