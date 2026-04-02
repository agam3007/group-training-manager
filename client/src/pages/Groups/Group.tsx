import { useEffect,useState } from "react"
import type { Group } from "../../types/group"

import { getGroups } from "../../api/group"

import PageHeader from "../../components/sherd/PageHeader"
import GroupCard from "../../components/groups/GroupCard/GroupCard"
import { useNavigate } from "react-router-dom"


export default function GroupsPage(){

  const [groups,setGroups] =
    useState<Group[]>([])

  const [search,setSearch] =
    useState("")

  const navigate = useNavigate()


  useEffect(()=>{

    load()

  },[])

  const load = async()=>{

    const data = await getGroups()

    setGroups(data)

  }

  const filtered =
    groups.filter(g=>
      g.name
        .toLowerCase()
        .includes(search.toLowerCase())
    )

  return(

    <div>

      <PageHeader
        search={search}
        setSearch={setSearch}
        onAdd={()=>{}}
      />

      <div className="cards-grid">

        {filtered.map(g=>(

          <GroupCard
            key={g.id}
            group={g}
            onClick={()=>{navigate(`/groups/${g.id}`)}}
          />

        ))}

      </div>

    </div>

  )

}