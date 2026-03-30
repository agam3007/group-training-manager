import { useEffect,useState } from "react"
import { useNavigate } from "react-router-dom"

import type { Athlete } from "../../types/athlete"

import { createAthlete, getAthletes } from "../../api/athlete"

import PageHeader from "../../components/sherd/PageHeader"
import AthleteCard from "../../components/athletes/athleteCard/AthleteCard"

export default function AthletesPage(){

  const [athletes,setAthletes] =
    useState<Athlete[]>([])

  const [search,setSearch] =
    useState("")

  const navigate = useNavigate()

  useEffect(()=>{

    load()

  },[])

  const load = async()=>{

    const data = await getAthletes()

    setAthletes(data)

  }

  const filtered =
    athletes.filter(a=>
      a.name
        .toLowerCase()
        .includes(search.toLowerCase())
    )

  return(

    <div>

      <PageHeader
        search={search}
        setSearch={setSearch}
        onAdd={async ()=>{
              const emptyAthlete:Athlete = {
                id:"",
                name:"",
                level:"",
                groups:[],
          
                tests:[],
                goals:[],
                zones:{},
          
                age: undefined,
                height: undefined,
                weight: undefined,
              }
          
              const created = await createAthlete(emptyAthlete)
          
              navigate(`/athletes/${created.id}`)}}      />

      <div className="cards-grid">

        {filtered.map(a=>(

          <AthleteCard
            key={a.id}
            athlete={a}
            onClick={()=>navigate(`/athletes/${a.id}`)}
          />

        ))}

      </div>

    </div>

  )

}