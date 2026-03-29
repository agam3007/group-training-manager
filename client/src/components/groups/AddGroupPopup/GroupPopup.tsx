import { useState, useEffect } from "react"

import type { Group } from "../../../types/group"
import type { Athlete } from "../../../types/athlete"

import {
  createGroup,
  updateGroup,
  deleteGroup
} from "../../../api/group"

interface Props{

  group?:Group

  athletes:Athlete[]

  onSave:(group:Group)=>void

  onDelete?:(id:string)=>void

  onClose:()=>void

}

export default function GroupPopup({

  group,

  athletes,

  onSave,

  onDelete,

  onClose

}:Props){

  const [name,setName] = useState("")

  const [day,setDay] = useState(0)

  const [hour,setHour] = useState(18)

  const [selectedAthletes,setSelectedAthletes] =
    useState<string[]>([])

  useEffect(()=>{

    if(group){

      setName(group.name)

      setDay(group.schedule[0]?.day ?? 0)

      setHour(group.schedule[0]?.hour ?? 18)

      setSelectedAthletes(group.athletes ?? [])

    }

  },[group])

  const toggleAthlete = (id:string)=>{

    setSelectedAthletes(prev=>{

      if(prev.includes(id)){

        return prev.filter(a=>a!==id)

      }

      return [...prev,id]

    })

  }

  const save = async ()=>{

    try{

      let result:Group

      if(group){

        result = await updateGroup(group.id,{
          name,
          athletes:selectedAthletes,
          schedule:[{day,hour}]
        })

      }else{

        result = await createGroup({
          name,
          type:"general",
          athletes:selectedAthletes,
          schedule:[{day,hour}]
        })

      }

      onSave(result)

      onClose()

    }catch(err){

      console.error(err)

    }

  }

  const remove = async ()=>{

    if(!group) return

    const confirmDelete =
      window.confirm("Delete this group?")

    if(!confirmDelete) return

    await deleteGroup(group.id)

    onDelete?.(group.id)

    onClose()

  }

  return(

    <div className="popup">

      <div className="popup-content">

        <div className="popup-header">

          <h3>

            {group ? "Edit Group" : "Add Group"}

          </h3>

          <button
            className="popup-close"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <input
          placeholder="Group name"
          value={name}
          onChange={e=>setName(e.target.value)}
        />

        <div className="popup-row">

          <div>

            <label>Day</label>

            <select
              value={day}
              onChange={e=>setDay(Number(e.target.value))}
            >

              <option value={0}>Sun</option>
              <option value={1}>Mon</option>
              <option value={2}>Tue</option>
              <option value={3}>Wed</option>
              <option value={4}>Thu</option>
              <option value={5}>Fri</option>
              <option value={6}>Sat</option>

            </select>

          </div>

          <div>

            <label>Hour</label>

            <input
              type="number"
              value={hour}
              onChange={e=>setHour(Number(e.target.value))}
            />

          </div>

        </div>

        <h4 style={{marginTop:"20px"}}>
          Athletes
        </h4>

        <div
          style={{
            maxHeight:"200px",
            overflowY:"auto"
          }}
        >

          {athletes.map(a=>(

            <label
              key={a.id}
              style={{
                display:"flex",
                gap:"8px",
                marginBottom:"6px"
              }}
            >

              <input
                type="checkbox"
                checked={
                  selectedAthletes.includes(a.id)
                }
                onChange={()=>toggleAthlete(a.id)}
              />

              {a.name}

            </label>

          ))}

        </div>

        <div className="popup-buttons">

          {group &&

            <button
              className="delete-btn"
              onClick={remove}
            >
              Delete
            </button>

          }

          <div style={{display:"flex",gap:"10px"}}>

            <button
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="save-btn"
              onClick={save}
            >
              Save
            </button>

          </div>

        </div>

      </div>

    </div>

  )

}
