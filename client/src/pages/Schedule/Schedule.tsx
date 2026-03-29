import TrainingCalendar from "../../components/calendar/trainingCalendar"
import type { Training } from "../../types/training"

interface Props{
  trainings: Training[]
  setTrainings: React.Dispatch<
    React.SetStateAction<Training[]>
  >
}

export default function Schedule({
  trainings,
  setTrainings
}:Props){

  return(

    <TrainingCalendar
      trainings={trainings}
      setTrainings={setTrainings}
    />

  )

}