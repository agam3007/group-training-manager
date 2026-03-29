import { useState, useEffect } from "react"
import type { Athlete } from "../../../types/athlete"
import {
  createAthlete,
  updateAthlete,
  deleteAthlete
} from "../../../api/athlete"

interface Props{
  athlete?:Athlete
  onSave:(athlete:Athlete)=>void
  onDelete?:(id:string)=>void
  onClose:()=>void
}

export default function AthletePopup({
  athlete,
  onSave,
  onDelete,
  onClose
}:Props){

  const [name,setName] = useState("")
  const [level,setLevel] = useState("")
  const [age,setAge] = useState<number | undefined>()
  const [phone,setPhone] = useState("")
  const [parentPhone,setParentPhone] = useState("")
  const [notes,setNotes] = useState("")

  useEffect(()=>{

    if(athlete){

      setName(athlete.name)
      setLevel(athlete.level)
      setAge(athlete.age)
      setPhone(athlete.phone ?? "")
      setParentPhone(athlete.parentPhone ?? "")
      setNotes(athlete.notes ?? "")

    }

  },[athlete])

  const save = async ()=>{

    try{

      let result:Athlete

      if(athlete){

        result = await updateAthlete(athlete.id,{
          name,
          level,
          age,
          phone,
          parentPhone,
          notes
        })

      }else{

        result = await createAthlete({
          name,
          level,
          age,
          phone,
          parentPhone,
          groups:[],
          notes
        })

      }

      onSave(result)

      onClose()

    }catch(err){

      console.error(err)

    }

  }

  const remove = async ()=>{

    if(!athlete) return

    const confirmDelete =
      window.confirm("Delete this athlete?")

    if(!confirmDelete) return

    await deleteAthlete(athlete.id)

    onDelete?.(athlete.id)

    onClose()

  }

  return(

    <div className="popup">

      <div className="popup-content">

        <div className="popup-header">

          <h3>
            {athlete ? "Edit Athlete" : "Add Athlete"}
          </h3>

          <button
            className="popup-close"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <input
          placeholder="Name"
          value={name}
          onChange={e=>setName(e.target.value)}
        />

        <input
          placeholder="Level"
          value={level}
          onChange={e=>setLevel(e.target.value)}
        />

        <input
          placeholder="Age"
          type="number"
          value={age ?? ""}
          onChange={e=>setAge(Number(e.target.value))}
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={e=>setPhone(e.target.value)}
        />

        <input
          placeholder="Parent phone"
          value={parentPhone}
          onChange={e=>setParentPhone(e.target.value)}
        />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={e=>setNotes(e.target.value)}
        />

        <div className="popup-buttons">

          {athlete &&

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