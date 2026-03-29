import "./ZonesTable.css"
type Props = {
  zones:any
  sport:"run"|"bike"|"swim"|"gym"
}

export default function ZonesTable({
  zones,
  sport
}:Props){

  if(!zones || !zones[sport]){
  return <p>Add test to see zones</p>
}

  const rpe = [
    {label:"1-2",emoji:"😴"},
    {label:"3-4",emoji:"🙂"},
    {label:"5-6",emoji:"😐"},
    {label:"7",emoji:"😤"},
    {label:"8",emoji:"🥵"},
    {label:"9",emoji:"🤢"},
    {label:"10",emoji:"💀"},
  ]

  const sportZones = zones?.[sport]
  const getRanges = (arr?:number[])=>{

    if(!arr || arr.length === 0) return []

    const ranges = []

    for(let i=0;i<arr.length;i++){

      const min = i === 0 ? 0 : arr[i-1]
      const max = arr[i]

      ranges.push({
        min:Math.round(min),
        max:Math.round(max)
      })

    }

    return ranges

  }

  const paceRanges = getRanges(sportZones?.pace)
const hrRanges   = getRanges(sportZones?.hr)
const powerRanges= getRanges(sportZones?.power)

  // בחירת נתונים לפי ספורט
  let rows:any[] = []
  let columns:string[] = []

  if(sport==="run"){

    rows = paceRanges
    columns = ["RPE","Pace","HR","Zone"]

  }

  if(sport==="bike"){

    rows = powerRanges
    columns = ["RPE","Power","HR","Zone"]

  }

  if(sport==="swim"){

    rows = paceRanges
    columns = ["RPE","Pace","Zone"]

  }

  if(sport==="gym"){

    return <p>RM zones coming soon</p>

  }

  if(!rows.length){
    return <p>No zones for this sport yet</p>
  }

  return(

    <table className="zones-table">

      <thead>
        <tr>
          {columns.map(c=>(
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>

      <tbody>

        {rows.map((z,i)=>(

          <tr key={i}>

            {/* RPE */}
            <td>
              {rpe[i]?.emoji} {rpe[i]?.label}
            </td>

            {/* RUN */}
            {sport==="run" && (
              <>
                <td>
                  {formatPace(z.min)}-{formatPace(z.max)}
                </td>

                <td>
                  {hrRanges[i]
                    ? `${hrRanges[i].min}-${hrRanges[i].max}`
                    : "-"
                  }
                </td>
              </>
            )}

            {/* BIKE */}
            {sport==="bike" && (
              <>
                <td>
                  {Math.round(z.min)}-{Math.round(z.max)}
                </td>

                <td>
                  {hrRanges[i]
                    ? `${hrRanges[i].min}-${hrRanges[i].max}`
                    : "-"
                  }
                </td>
              </>
            )}

            {/* SWIM */}
            {sport==="swim" && (
              <td>
                {formatPace(z.min)}-{formatPace(z.max)}
              </td>
            )}

            {/* ZONE */}
            <td
              style={{
                color:
                  i<2 ? "green" :
                  i<4 ? "orange" :
                  "red"
              }}
            >
              Z{i+1}
            </td>

          </tr>

        ))}

      </tbody>

    </table>

  )

}


/* -------- FORMAT PACE -------- */

function formatPace(sec:number){

  if(!sec) return "-"

  const minutes = Math.floor(sec / 60)
  const seconds = Math.round(sec % 60)

  return `${minutes}:${seconds.toString().padStart(2,"0")}`
}