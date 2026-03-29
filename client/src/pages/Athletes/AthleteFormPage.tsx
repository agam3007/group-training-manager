import { useEffect,useState } from "react"
import { useParams,useNavigate } from "react-router-dom"

import type { Athlete } from "../../types/athlete"

import { getAthlete,createAthlete,updateAthlete } from "../../api/athlete"

export default function AthleteFormPage(){

  const { id } = useParams()

  const navigate = useNavigate()

  const isNew = !id

  const [athlete,setAthlete] = useState<Athlete>({
    id:"",
    name:"",
    level:"",
    groups:[],
    pbs:[],
    goals:[]
  })

  useEffect(()=>{

    if(!isNew){

      load()

    }

  },[id])

  const load = async()=>{

    const data = await getAthlete(id!)

    setAthlete(data)

  }

  const handleChange = (field:string,value:any)=>{

    setAthlete(prev=>({

      ...prev,

      [field]:value

    }))

  }

  const save = async()=>{

    if(isNew){

      await createAthlete(athlete)

    }else{

      await updateAthlete(athlete.id,athlete)

    }

    navigate("/athletes")

  }

  return(

    <div className="athlete-page">

      <h1>
        {isNew ? "New Athlete" : athlete.name}
      </h1>

      {/* BASIC INFO */}

      <section>

        <h2>Profile</h2>

        <input
          placeholder="Name"
          value={athlete.name}
          onChange={e =>
            handleChange("name",e.target.value)
          }
        />

        <input
          placeholder="Level"
          value={athlete.level}
          onChange={e =>
            handleChange("level",e.target.value)
          }
        />

        <input
          placeholder="Age"
          type="number"
          value={athlete.age || ""}
          onChange={e =>
            handleChange("age",Number(e.target.value))
          }
        />

      </section>

      {/* CONTACT */}

      <section>

        <h2>Contact</h2>

        <input
          placeholder="Phone"
          value={athlete.phone || ""}
          onChange={e =>
            handleChange("phone",e.target.value)
          }
        />

        <input
          placeholder="Email"
          value={athlete.email || ""}
          onChange={e =>
            handleChange("email",e.target.value)
          }
        />

        <input
          placeholder="Parent Phone"
          value={athlete.parentPhone || ""}
          onChange={e =>
            handleChange("parentPhone",e.target.value)
          }
        />

      </section>

      {/* PHYSICAL */}

      <section>

        <h2>Physical</h2>

        <input
          placeholder="Height"
          type="number"
          value={athlete.height || ""}
          onChange={e =>
            handleChange("height",Number(e.target.value))
          }
        />

        <input
          placeholder="Weight"
          type="number"
          value={athlete.weight || ""}
          onChange={e =>
            handleChange("weight",Number(e.target.value))
          }
        />

      </section>

      {/* ZONES */}

      <section>

        <h2>Zones</h2>

        <input
          placeholder="HR zones (comma separated)"
          value={athlete.zones?.hr?.join(",") || ""}
          onChange={e =>
            handleChange("zones",{
              ...athlete.zones,
              hr:e.target.value
                .split(",")
                .map(Number)
            })
          }
        />

        <input
          placeholder="Run pace zones"
          value={athlete.zones?.pace?.join(",") || ""}
          onChange={e =>
            handleChange("zones",{
              ...athlete.zones,
              pace:e.target.value
                .split(",")
                .map(Number)
            })
          }
        />

      </section>

      {/* NOTES */}

      <section>

        <h2>Coach Notes</h2>

        <textarea
          value={athlete.notes || ""}
          onChange={e =>
            handleChange("notes",e.target.value)
          }
        />

      </section>

      <button onClick={save}>
        Save Athlete
      </button>

    </div>

  )

}