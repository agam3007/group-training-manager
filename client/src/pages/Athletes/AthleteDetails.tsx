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

/* -------- FIELD -------- */

function Field({label,value,editMode,onChange}:any){

  const [val,setVal] = useState(value)

  useEffect(()=>{
    setVal(value)
  },[value])

  const handleChange = (newVal:any)=>{
    setVal(newVal)
    onChange && onChange(newVal) // 🔥 זה מה שהיה חסר
  }

  return(
    <div className="field">
      <span>{label}:</span>

      {editMode ? (
        <input
          value={val || ""}
          onChange={e=>handleChange(e.target.value)}
          className="input"
        />
      ) : (
        <span>{value || "-"}</span>
      )}
    </div>
  )
}

/* -------- COMPONENT -------- */

export default function AthleteDetails(){

  const { id } = useParams()
  const navigate = useNavigate()

  const [athlete,setAthlete] =
    useState<Athlete | null>(null)

  const [events,setEvents] =
    useState<DayEvent[]>([])

  const [sport,setSport] =
    useState<SportType>("run")

  const [showTestModal,setShowTestModal] =
    useState(false)

  const [openDropdown,setOpenDropdown] =
    useState(false)

  const [selectedPB,setSelectedPB] =
    useState<string | null>(null)

  const [activeTab,setActiveTab] =
    useState<"overview"|"contacts"|"health"|"groups">("overview")

  const [editMode,setEditMode] = useState(false)

    const [editData,setEditData] = useState<any>(null)


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

    setEditData(data)
  }

    const saveEdit = ()=>{
    setAthlete(editData)
    setEditMode(false)
  }

if(!athlete || !editData) return <div>Loading...</div>

const isDirty = JSON.stringify(editData) !== JSON.stringify(athlete)
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

        <div className={`profile ${athlete.injuries ? "injured" : ""}`}>
          <div className="avatar"/>
          <h1>{athlete.name}</h1>
          <p>{athlete.level}</p>
        </div>

        <div className="card">

          {/* TABS */}
          <div className="tabs">

            {["overview","contacts","health","groups"].map(tab=>{

  const isHealth = tab === "health"
  const hasInjury = !!editData.injuries

  return(
    <div
      key={tab}
      className={`tab ${activeTab===tab?"active":""} ${isHealth && hasInjury ? "alert" : ""}`}
      onClick={()=>setActiveTab(tab as any)}
    >
      {tab.toUpperCase()}

      {/* 🔥 אינדיקציה */}
      {isHealth && hasInjury && (
  <span className="tab-alert-icon">⚠️</span>
      )}

    </div>
  )

})}

            {!editMode ? (
              <button
                className="icon-btn"
                onClick={()=>{
  setEditData({...athlete})
  setEditMode(true)
}}
              >
                ✏️
              </button>
            ) : (
              <button
  className="icon-btn save"
  onClick={saveEdit}
  disabled={!isDirty}
>
  💾
</button>
            )}

          </div>

          <div className="tab-content">

            {/* OVERVIEW */}
            {activeTab==="overview" && (
              <>
                <Field label="Age" value={editData.age} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,age:v})}/>
                <Field label="Height" value={editData.height} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,height:v})}/>
                <Field label="Weight" value={editData.weight} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,weight:v})}/>
                <Field label="Rest HR" value={editData.restingHR} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,restingHR:v})}/>
                <Field label="Max HR" value={editData.maxHR} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,maxHR:v})}/>
                <Field label="Experience" value={editData.experience} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,experience:v})}/>
              </>
            )}

            {/* CONTACTS */}
            {activeTab==="contacts" && (
              <>
                <Field label="Phone" value={editData.phone} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,phone:v})}/>
                <Field label="Email" value={editData.email} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,email:v})}/>
<Field
  label="Emergency Name"
  value={editData.emergencyName}
  editMode={editMode}
  onChange={(v:any)=>setEditData({...editData,emergencyName:v})}
/>

<Field
  label="Emergency Phone"
  value={editData.emergencyPhone}
  editMode={editMode}
  onChange={(v:any)=>setEditData({...editData,emergencyPhone:v})}
/>

<Field
  label="Emergency Email"
  value={editData.emergencyEmail}
  editMode={editMode}
  onChange={(v:any)=>setEditData({...editData,emergencyEmail:v})}
/>
              </>
            )}

            {/* HEALTH */}
            {activeTab==="health" && (
              <>

                <div className="field">
  <span>Injury:</span>

  {editMode ? (
    <label className="switch">
      <input
        type="checkbox"
        checked={!!editData.injuries}
        onChange={(e)=>{
          const val = e.target.checked

          setEditData({
            ...editData,
            injuries: val ? "" : null,
            injuryDate: val
              ? new Date().toISOString().slice(0,10)
              : null
          })
        }}
      />
      <span className="slider"/>
    </label>
  ) : (
    <span>{editData.injuries ? "Yes" : "No"}</span>
  )}
</div>

                {editData.injuries && (
                  <div className="alert-box">
                    ⚠️ {editData.injuries || "Injury"}
                  </div>
                )}

                {editData.injuries !== null && (
                  <>
                    <Field label="Injury Type" value={editData.injuries} editMode={editMode}
                      onChange={(v:any)=>setEditData({...editData,injuries:v})}/>
                    <Field label="Limitations" value={editData.limitations} editMode={editMode}
                      onChange={(v:any)=>setEditData({...editData,limitations:v})}/>
                    <Field label="Focus" value={editData.focus} editMode={editMode}
                      onChange={(v:any)=>setEditData({...editData,focus:v})}/>
                        <Field
    label="Injury Date"
    value={editData.injuryDate}
    editMode={editMode}
    onChange={(v:any)=>setEditData({...editData,injuryDate:v})}
  />
                  </>
                )}

                <Field label="Allergies" value={editData.allergies} editMode={editMode}
                  onChange={(v:any)=>setEditData({...editData,allergies:v})}/>

              </>
            )}

            {/* GROUPS */}
            {activeTab==="groups" && (
              <>
                {(athlete.groups || []).map(g=>(
                  <div key={g}>{g}</div>
                ))}
              </>
            )}

          </div>

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

      {/* RIGHT נשאר ללא שינוי */}

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