import { createPortal } from "react-dom"
import { useState } from "react"

export default function GoalActionModal({goal,mode,onClose,onSave}:any){

const [data,setData] = useState({
  pacing:"",
  nutritionPre:"",
  nutritionDuring:"",
  hydration:"",
  gear:"",
  schedule:"",
  notes:""
})

const [review,setReview] = useState({
  actualPacing:"",
  actualNutrition:"",
  feeling:"",
  whatWorked:"",
  whatNot:"",
  notes:""
})

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal">

        {/* PLAN */}
        {mode==="plan" && (
          <>
<h3>🏁 Race Plan</h3>

<div className="section">
  <h4>🏃 Pacing Strategy</h4>
  <input
    placeholder="Target pace / watts..."
    onChange={e=>setData({...data,pacing:e.target.value})}
  />
</div>

<div className="section">
  <h4>🍌 Nutrition</h4>

  <input
    placeholder="Before race..."
    onChange={e=>setData({...data,nutritionPre:e.target.value})}
  />

  <input
    placeholder="During race..."
    onChange={e=>setData({...data,nutritionDuring:e.target.value})}
  />

  <input
    placeholder="Hydration..."
    onChange={e=>setData({...data,hydration:e.target.value})}
  />
</div>

<div className="section">
  <h4>🎒 Gear</h4>
  <input
    placeholder="Shoes / bike setup / kit..."
    onChange={e=>setData({...data,gear:e.target.value})}
  />
</div>

<div className="section">
  <h4>🗓 Race Day Plan</h4>
  <textarea
    placeholder="Wake up / warm up / start..."
    onChange={e=>setData({...data,schedule:e.target.value})}
  />
</div>
          </>
        )}

        {/* REVIEW */}
        {mode==="review" && (
          <>
           <h3>📊 Race Review</h3>

<div className="section compare">

  <h4>Pacing</h4>

  <div className="compare-row">
    <div className="planned">
      <b>Planned:</b> {goal.plan?.pacing || "-"}
    </div>

    <input
      placeholder="Actual pacing..."
      onChange={e=>setReview({...review,actualPacing:e.target.value})}
    />
  </div>

</div>

<div className="section compare">

  <h4>Nutrition</h4>

  <div className="compare-row">
    <div className="planned">
      <b>Planned:</b> {goal.plan?.nutritionDuring || "-"}
    </div>

    <input
      placeholder="What actually happened..."
      onChange={e=>setReview({...review,actualNutrition:e.target.value})}
    />
  </div>

</div>

<div className="section">
  <h4>🧠 Performance</h4>

  <textarea
    placeholder="What worked..."
    onChange={e=>setReview({...review,whatWorked:e.target.value})}
  />

  <textarea
    placeholder="What didn’t..."
    onChange={e=>setReview({...review,whatNot:e.target.value})}
  />

  <textarea
    placeholder="General notes..."
    onChange={e=>setReview({...review,notes:e.target.value})}
  />
</div>
          </>
        )}

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={()=>onSave(goal.id,data)}>Save</button>
        </div>

      </div>
    </div>,
    document.body
  )
}