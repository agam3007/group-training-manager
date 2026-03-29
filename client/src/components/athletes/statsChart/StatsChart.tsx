import "./StatsChart.css"
type Props = {
  data:number[]
}

export default function StatsChart({data}:Props){

  const max = Math.max(...data,1)

  return(

    <div className="chart">

      {data.map((d,i)=>(

        <div key={i} className="bar">

          <div
            className="fill"
            style={{
              height:`${(d/max)*100}%`
            }}
          />

        </div>

      ))}

    </div>

  )

}