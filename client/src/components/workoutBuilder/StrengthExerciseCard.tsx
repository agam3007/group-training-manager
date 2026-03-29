import type { StrengthExercise } from "../../types/training"

interface Props{
exercise:StrengthExercise
update:(id:string,data:any)=>void
remove:(id:string)=>void
}

export default function StrengthExerciseCard({
exercise,
update,
remove
}:Props){

function updateBlock(index:number,data:any){

const newBlocks=[...exercise.blocks]

newBlocks[index]={

...newBlocks[index],
...data

}

update(exercise.id,{blocks:newBlocks})

}

function addBlock(){

update(exercise.id,{

blocks:[
...exercise.blocks,
{sets:3,reps:8}
]

})

}

return(

<div className="strength-card">

<input
value={exercise.name}
onChange={e=>
update(exercise.id,{name:e.target.value})
}
/>

{exercise.blocks.map((b,i)=>(

<div key={i} className="strength-row">

<input
type="number"
value={b.sets}
onChange={e=>
updateBlock(i,{sets:Number(e.target.value)})
}
/>

<input
type="number"
value={b.reps}
onChange={e=>
updateBlock(i,{reps:Number(e.target.value)})
}
/>

<input
placeholder="weight"
value={b.weight||""}
onChange={e=>
updateBlock(i,{weight:e.target.value})
}
/>

</div>

))}

<button onClick={addBlock}>
+ block
</button>

<button onClick={()=>remove(exercise.id)}>
delete
</button>

</div>

)

}