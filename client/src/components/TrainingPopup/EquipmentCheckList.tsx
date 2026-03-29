interface Props{

equipment:string[]

setEquipment:(v:string[])=>void

}

export default function EquipmentChecklist({
equipment,
setEquipment
}:Props){

const items=[

"Fins",
"Paddles",
"Pull Buoy",
"Snorkel",
"Band",
"Watch"

]

function toggle(item:string){

if(equipment.includes(item)){

setEquipment(
equipment.filter(i=>i!==item)
)

}else{

setEquipment(
[...equipment,item]
)

}

}

return(

<div className="equipment">

<h4>Equipment</h4>

{items.map(item=>(

<label
key={item}
className="equipment-item"
>

<input
type="checkbox"
checked={equipment.includes(item)}
onChange={()=>toggle(item)}
/>

<span>{item}</span>

</label>

))}

</div>

)

}