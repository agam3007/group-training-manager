interface Props{

value:string

onChange:(type:any)=>void

}

export default function TrainingTypeSelector({
value,
onChange
}:Props){

const types=[

{id:"swim",icon:"🏊"},

{id:"bike",icon:"🚴"},

{id:"run",icon:"🏃"},

{id:"strength",icon:"🏋️"}

]

return(

<div className="type-selector">

{types.map(t=>(

<button
key={t.id}
className={
value===t.id
? "active"
: ""
}
onClick={()=>onChange(t.id)}
>

{t.icon}

</button>

))}

</div>

)

}