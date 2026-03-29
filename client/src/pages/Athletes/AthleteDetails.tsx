import { useEffect,useState,useRef } from "react"
import { useParams,useNavigate } from "react-router-dom"

import type { Athlete } from "../../types/athlete"
import { getAthlete } from "../../api/athlete"

import "./AthleteDetails.css"
import AddTestModal from "../../components/athletes/addTestModal/AddTestModal"
import StatsChart from "../../components/athletes/statsChart/StatsChart"
import ZonesTable from "../../components/athletes/zonesTable/ZonesTable"
import ProgressChart from "../../components/athletes/progressChart/ProgressChart"

/* -------- TYPES -------- */

type SportType = "run" | "bike" | "swim" | "gym"

type DayEvent = {
  athleteId?:string
  groupId?:string
  type:"training"
  done?:boolean
}

/* -------- HELPERS -------- */

function secondsToTime(sec:number){
  const m=Math.floor(sec/60)
  const s=Math.round(sec%60)
  return `${m}:${s.toString().padStart(2,"0")}`
}

const sportIcon = (sport:string)=>{
  if(sport==="run") return "🏃"
  if(sport==="bike") return "🚴"
  if(sport==="swim") return "🏊"
  return ""
}

/* -------- COMPONENT -------- */

export default function AthleteDetails(){

  const { id } = useParams()
  const navigate = useNavigate()

  const [athlete,setAthlete] =
    useState<Athlete | null>(null)

  const [events,setEvents] =
    useState<DayEvent[]>([])

  const [openSections,setOpenSections] =
    useState<string[]>([])

  const [sport,setSport] =
    useState<SportType>("run")

  const [showTestModal,setShowTestModal] =
    useState(false)

  const [openDropdown,setOpenDropdown] =
    useState(false)

  const [selectedPB,setSelectedPB] =
    useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    load()
  },[])

  useEffect(()=>{

    const handleClickOutside = (e:any)=>{

      if(
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ){
        setOpenDropdown(false)
      }

    }

    document.addEventListener("click",handleClickOutside)

    return ()=>{
      document.removeEventListener("click",handleClickOutside)
    }

  },[])

  const load = async()=>{

    const data = await getAthlete(id!)
    setAthlete(data)

    setEvents([
      {type:"training",athleteId:id,done:true},
      {type:"training",athleteId:id,done:false},
      {type:"training",groupId:"g1",done:true}
    ])

  }

  const toggleSection = (name:string)=>{

    setOpenSections(prev =>
      prev.includes(name)
        ? prev.filter(s=>s!==name)
        : [...prev,name]
    )

  }

  if(!athlete) return <div>Loading...</div>

  /* -------- ATTENDANCE -------- */

  const athleteTrainings = events.filter(e=>

    e.type==="training" &&

    (
      e.athleteId === athlete.id ||
      athlete.groups.includes(e.groupId!)
    )

  )

  const total = athleteTrainings.length
  const done = athleteTrainings.filter(t=>t.done).length
  const attendance =
    total ? Math.round(done/total*100) : 0

  /* -------- ADD TEST -------- */

  const addTest = (test:any)=>{

    setAthlete(prev=>({

      ...prev!,

      tests:[...(prev?.tests||[]),test],

      zones:{
  ...prev?.zones,
  [test.sport]: test.zones
}

    }))

  }

  /* -------- GOALS -------- */

  const addGoal = ()=>{

    setAthlete(prev=>({

      ...prev!,

      goals:[
        ...(prev?.goals||[]),
        {
          id:Date.now().toString(),
          title:"New Goal",
          done:false
        }
      ]

    }))

  }

  return(

    <div className="dashboard">

      {/* LEFT */}

      <div className="left">

        <div className="profile">
          <div className="avatar"/>
          <h1>{athlete.name}</h1>
          <p>{athlete.level}</p>
        </div>

        <div className="card">
          <div className="section-header" onClick={()=>toggleSection("info")}>
            <h3>Personal Info</h3>
            <span>✏️</span>
          </div>

          {openSections.includes("info") && (
            <div className="section-content">
              <p>Age: {athlete.age}</p>
              <p>Phone: {athlete.phone}</p>
              <p>Email: {athlete.email}</p>
              <p>Parent: {athlete.parentPhone}</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header" onClick={()=>toggleSection("physical")}>
            <h3>Physical</h3>
            <span>✏️</span>
          </div>

          {openSections.includes("physical") && (
            <div className="section-content">
              <p>Height: {athlete.height}</p>
              <p>Weight: {athlete.weight}</p>
              <p>Rest HR: {athlete.restingHR}</p>
              <p>Max HR: {athlete.maxHR}</p>
            </div>
          )}
        </div>

        <div className="card injury-card">
          <h3>Injuries ⚠️</h3>
          <p>{athlete.injuries || "None"}</p>
        </div>

        <div className="card">
          <h3>Coach Notes</h3>
          <p>{athlete.notes}</p>
        </div>

      </div>

      {/* CENTER */}

      <div className="center">

        <div className="card">
          <h3>Stats</h3>

          <div className="stats-grid">
            <div>Attendance</div>
            <div style={{
              color:
                attendance>80?"green":
                attendance>60?"orange":"red"
            }}>
              {attendance}%
            </div>

            <div>Trainings</div>
            <div>{total}</div>
          </div>

          <StatsChart data={[3,5,2,6,8,4,7]} />
        </div>

        {/* ZONES */}

        <div className="card">

          <div
            className="zones-header"
            ref={dropdownRef}
          >

            <div
              className="zones-title"
              onClick={()=>setOpenDropdown(prev=>!prev)}
            >
              <h3>
                {sport === "run" && "Running Zones"}
                {sport === "bike" && "Cycling Zones"}
                {sport === "swim" && "Swimming Zones"}
                {sport === "gym" && "Gym Zones"}
              </h3>

              <span className={`arrow ${openDropdown?"open":""}`}>
                ▼
              </span>
            </div>

            {openDropdown && (
              <div className="zones-dropdown">
                <div onClick={()=>{setSport("run");setOpenDropdown(false)}}>🏃 Running</div>
                <div onClick={()=>{setSport("bike");setOpenDropdown(false)}}>🚴 Cycling</div>
                <div onClick={()=>{setSport("swim");setOpenDropdown(false)}}>🏊 Swimming</div>
                <div onClick={()=>{setSport("gym");setOpenDropdown(false)}}>🏋️ Gym</div>
              </div>
            )}

          </div>

          <ZonesTable zones={athlete.zones} sport={sport} />

        </div>

      </div>

      {/* RIGHT */}

      <div className="right">

        <div className="card">

          <div className="header-row">
            <h3>Tests</h3>
            <button onClick={()=>setShowTestModal(true)}>+</button>
          </div>

          <div className="pb-section">

            <h4>Personal Bests</h4>

            {[...new Set((athlete.tests||[]).map(t=>t.type))]
              .map(type=>{

                const tests =
                  athlete.tests?.filter(t=>t.type===type) || []

                if(!tests.length) return null

                const sport = tests[0].sport

                const pb =
                  sport==="bike"
                    ? Math.max(...tests.map(t=>t.value))
                    : Math.min(...tests.map(t=>t.value))

                return(

                  <div key={type}>

                    <div
                      className="pb-row clickable"
                      onClick={()=>setSelectedPB(
                        selectedPB===type ? null : type
                      )}
                    >

                      <span>
                        {sportIcon(sport)} {type.toUpperCase()}
                      </span>

                      <b>
                        {sport==="bike"
                          ? `${pb}w`
                          : secondsToTime(pb)
                        }
                      </b>

                    </div>

                    {selectedPB===type && (
                      <ProgressChart
                        tests={tests}
                        sport={sport}
                      />
                    )}

                  </div>

                )

            })}

          </div>

        </div>

        <div className="card">

          <div className="header-row">
            <h3>Goals</h3>
            <button onClick={addGoal}>+</button>
          </div>

          {(athlete.goals || []).map(g=>(

            <div key={g.id} className="goal-row">
              <span>{g.title}</span>
              <input type="checkbox" checked={g.done} readOnly />
            </div>

          ))}

        </div>

        <button
          className="calendar-btn"
          onClick={()=>navigate(`/calendar/${athlete.id}`)}
        >
          Open Calendar
        </button>

      </div>

      {showTestModal && (
        <AddTestModal
          onClose={()=>setShowTestModal(false)}
          onAdd={(test)=>{
            addTest(test)
            setShowTestModal(false)
          }}
        />
      )}

    </div>

  )

}