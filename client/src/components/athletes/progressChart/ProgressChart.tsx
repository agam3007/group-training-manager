import { useState } from "react"
import "./ProgressChart.css"

type Props = {
  tests:any[]
  sport:"run"|"bike"|"swim"
}

function secondsToTime(sec:number){
  const m=Math.floor(sec/60)
  const s=Math.round(sec%60)
  return `${m}:${s.toString().padStart(2,"0")}`
}

export default function ProgressChart({
  tests,
  sport
}:Props){

  const [hovered,setHovered] = useState<number | null>(null)

  if(!tests.length) return null

  const sorted = [...tests].sort(
    (a,b)=>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  )

  const values = sorted.map(t=>t.value)

  const max = Math.max(...values)
  const min = Math.min(...values)

  const isLowerBetter = sport !== "bike"

  const pb =
    isLowerBetter
      ? Math.min(...values)
      : Math.max(...values)

  /* -------- LAYOUT -------- */
  const paddingLeft = 40
  const paddingBottom = 25
  const width = 300
  const height = 150

  const chartWidth = width - paddingLeft
  const chartHeight = height - paddingBottom

  const getX = (i:number)=>
    paddingLeft + (i/(sorted.length-1 || 1)) * (chartWidth-10)

  const getY = (v:number)=>
    ((1 - (v - min) / (max - min || 1)) * (chartHeight-10)) + 5

  const formatValue = (v:number)=>{
    return sport==="bike"
      ? `${Math.round(v)}w`
      : secondsToTime(v)
  }

  return(

    <div className="chart-container">

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >

        {/* Y AXIS */}
        {[0,0.25,0.5,0.75,1].map((p,i)=>{

          const v = min + (max-min)*(1-p)
          const y = getY(v)

          return(
            <g key={i}>

              <line
                x1={paddingLeft}
                x2={width}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
              />

              <text
                x={5}
                y={y+4}
                fontSize="10"
                fill="#64748b"
              >
                {formatValue(v)}
              </text>

            </g>
          )

        })}

        {/* LINE */}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          points={
            sorted.map((t,i)=>
              `${getX(i)},${getY(t.value)}`
            ).join(" ")
          }
        />

        {/* POINTS */}
        {sorted.map((t,i)=>{

          const isPB = t.value === pb

          return(

            <circle
              key={t.id}
              cx={getX(i)}
              cy={getY(t.value)}
              r={isPB ? 5 : 4}
              fill={isPB ? "#16a34a" : "#2563eb"}
              stroke="white"
              strokeWidth="2"
              onMouseEnter={()=>setHovered(i)}
              onMouseLeave={()=>setHovered(null)}
            />

          )

        })}

      </svg>

      {/* TOOLTIP */}
      {hovered !== null && (

        <div className="chart-tooltip">

          <div>
            {formatValue(sorted[hovered].value)}
          </div>

          <div>
            {new Date(sorted[hovered].date).toLocaleDateString()}
          </div>

        </div>

      )}

      {/* X LABELS */}
      <div className="chart-labels">

        {sorted.map((t,i)=>(

          <div
            key={t.id}
            className="chart-label"
            style={{
              left:`calc(${(i/(sorted.length-1 || 1))*100}% + 40px)`
            }}
          >
            {new Date(t.date).toLocaleDateString()}
          </div>

        ))}

      </div>

    </div>

  )

}