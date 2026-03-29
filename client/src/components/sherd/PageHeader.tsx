import "./PageHeader.css"

interface Props{

  search:string

  setSearch:(value:string)=>void

  onAdd:()=>void

}

export default function PageHeader({

  search,
  setSearch,
  onAdd

}:Props){

  return(

    <div className="page-header">

      <input
        className="search-input"
        placeholder="Search..."
        value={search}
        onChange={e=>setSearch(e.target.value)}
      />

      <div className="header-actions">

        <button className="filter-btn">
          ⚙
        </button>

        <button
          className="add-btn"
          onClick={onAdd}
        >
          +
        </button>

      </div>

    </div>

  )

}