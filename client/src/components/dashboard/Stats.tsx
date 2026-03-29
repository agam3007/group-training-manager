interface Props{

  athletes:number

  groups:number

  trainingsToday:number

  callsPending:number

}

export default function Stats({
  athletes,
  groups,
  trainingsToday,
  callsPending
}:Props){

  return(

    <div className="dashboard-card">

      <h3>Stats</h3>

      <div>Athletes: {athletes}</div>

      <div>Groups: {groups}</div>

      <div>Trainings today: {trainingsToday}</div>

      <div>Calls pending: {callsPending}</div>

    </div>

  )

}
