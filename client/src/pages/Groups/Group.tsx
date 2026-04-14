import { useEffect, useState } from "react";
import type { Group } from "@/shared/types";

import { createGroup, getGroups } from "@/api/group";

import {GroupCard} from "@/components/groups";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);

  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await getGroups();

    setGroups(data);
  };

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        search={search}
        setSearch={setSearch}
        onAdd={async () => {
          const emptyGroup: Group = {
            id: "",
            name: "",
            schedule: [],
            coach: "",
            sport: "",
            level: "",
            maxAthletes: 5,
            color: "#ec3232",
            notes: [],
            goals: [],
          };

          const created = await createGroup(emptyGroup);
          navigate(`/groups/${created.id}`);
        }}
      />

      <div className="cards-grid">
        {filtered.map((g) => (
          <GroupCard
            key={g.id}
            group={g}
            onClick={() => {
              navigate(`/groups/${g.id}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
