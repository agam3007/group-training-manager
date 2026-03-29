import { useState } from "react"
import type { EnduranceSet } from "../../types/training"

interface Props{

set:EnduranceSet

update:(id:string,data:any)=>void

remove:(id:string)=>void

duplicate:()=>void

}

export default function EnduranceSetCard({
set,
update,
remove,
duplicate
}:Props){

const [editing,setEditing]=
useState(false)

return(

<div
className={`set-card ${set.setType}`}
>

{!editing && (

<div
className="set-summary"
onClick={()=>setEditing(true)}
>

<strong>

{set.reps} × {set.distance}{set.unit}

</strong>

{set.notes && (

<div>

{set.notes}

</div>

)}

<div className="set-extra">

{set.rest && (
<span>
rest {set.rest}s
</span>
)}

</div>

</div>

)}

{editing && (

<div className="set-edit">

<input
type="number"
value={set.reps}
onChange={e=>
update(set.id,{
reps:Number(e.target.value)
})
}
/>

<input
type="number"
value={set.distance}
onChange={e=>
update(set.id,{
distance:Number(e.target.value)
})
}
/>

<input
placeholder="rest"
value={set.rest||""}
onChange={e=>
update(set.id,{
rest:Number(e.target.value)
})
}
/>

<input
placeholder="notes"
value={set.notes||""}
onChange={e=>
update(set.id,{
notes:e.target.value
})
}
/>

<button
onClick={()=>setEditing(false)}
>

Done

</button>

<button
onClick={duplicate}
>

Duplicate

</button>

<button
onClick={()=>remove(set.id)}
>

Delete

</button>

</div>

)}

</div>

)

}