import type { Group } from "../../../types/group"
import "./GroupCard.css"

interface Props{
  group: Group
  onClick:(group:Group)=>void
}

const days = [
  "Sun","Mon","Tue","Wed","Thu","Fri","Sat"
]

export default function GroupCard({
  group,
  onClick
}:Props){

  return(

    <div
      className="group-card"
      onClick={()=>onClick(group)}
    >

      <h3>{group.name}</h3>

      <div className="group-schedule">

        {group.schedule.map((s,i)=>(

          <span key={i}>
            {days[s.day]} {s.hour}:00
          </span>

        ))}

      </div>

      <div className="group-participants">

          {group.athletes.length} athletes
      </div>

    </div>

  )

}