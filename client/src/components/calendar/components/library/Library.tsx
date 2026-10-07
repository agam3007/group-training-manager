import { useEffect, useMemo, useState } from "react";
import type { Training, Folder } from "@/shared/types";
import { getFolders, createFolder } from "@/api/folder";
import { updateTraining } from "@/api/training";
import "./Library.css";

interface Props {
  trainings: Training[];
  onAdd: () => void;
  onSelect: (training: Training) => void;
  onUpdateTraining?: (training: Training) => void;
}

export default function Library({ trainings, onAdd, onSelect, onUpdateTraining }: Props) {
  const [search, setSearch] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingNewFolder, setEditingNewFolder] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState("");

  const getIcon = (type: string) => {
    switch (type) {
      case "swim":
        return "🏊";
      case "bike":
        return "🚴";
      case "run":
        return "🏃";
      case "strength":
        return "🏋️";
      default:
        return "📋";
    }
  };

  useEffect(() => {
    // Load folders from API
    (async () => {
      try {
        const foldersData = await getFolders();
        setFolders(foldersData);

        // Open all folders by default
        const initialOpenGroups: Record<string, boolean> = { __unsorted: true };
        foldersData.forEach((folder) => {
          initialOpenGroups[folder.id] = true;
        });
        setOpenGroups(initialOpenGroups);
      } catch (err) {
        console.error("Failed to load folders:", err);
      }
    })();
  }, []);

  const filteredTrainings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return trainings;

    return trainings.filter((training) => {
      const title = training.title?.toLowerCase() || "";
      const description = training.description?.toLowerCase() || "";
      return (
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        training.type.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [trainings, search]);

  const trainingsByFolder = useMemo(() => {
    const grouped: Record<string, Training[]> = { __unsorted: [] };
    folders.forEach((folder) => {
      grouped[folder.id] = [];
    });

    filteredTrainings.forEach((training) => {
      if (training.folderId && grouped[training.folderId]) {
        grouped[training.folderId].push(training);
        return;
      }

      grouped.__unsorted.push(training);
    });

    return grouped;
  }, [filteredTrainings, folders]);

  const handleNewTraining = () => {
    setShowAddMenu(false);
    onAdd();
  };

  const handleNewFolder = () => {
    setShowAddMenu(false);
    setEditingNewFolder(true);
    setNewFolderInput("");
  };

  const saveNewFolder = async () => {
    const trimmedName = newFolderInput.trim();
    if (!trimmedName) {
      setEditingNewFolder(false);
      return;
    }

    const exists = folders.some(
      (folder) => folder.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (exists) {
      setEditingNewFolder(false);
      return;
    }

    try {
      const newFolder = await createFolder(trimmedName);
      setFolders((prev) => [...prev, newFolder]);
      setOpenGroups((prev) => ({
        ...prev,
        [newFolder.id]: true,
      }));
      setEditingNewFolder(false);
      setNewFolderInput("");
    } catch (err) {
      console.error("Failed to create folder:", err);
      setEditingNewFolder(false);
    }
  };

  const toggleGroup = (type: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div className="calendar-library">
      <div className="library-header">
        <div className="library-top">
          <input
            className="library-search"
            placeholder="Search training..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="library-add-wrapper">
            <button className="library-add" onClick={() => setShowAddMenu(!showAddMenu)} title="Create training or folder">
              +
            </button>
            {showAddMenu && (
              <div className="library-add-menu">
                <button className="library-add-menu-item" onClick={handleNewTraining}>
                  📋 New Training
                </button>
                <button className="library-add-menu-item" onClick={handleNewFolder}>
                  📁 New Folder
                </button>
              </div>
            )}
          </div>
        </div>

        {editingNewFolder && (
          <div className="library-folder-create">
            <input
              autoFocus
              className="library-folder-input"
              placeholder="Folder name"
              value={newFolderInput}
              onChange={(e) => setNewFolderInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNewFolder();
                if (e.key === "Escape") setEditingNewFolder(false);
              }}
              onBlur={() => setEditingNewFolder(false)}
            />
          </div>
        )}
      </div>

      <div className="library-list">
        {[
          {
            key: "__unsorted",
            label: "Unsorted",
            list: trainingsByFolder.__unsorted,
            isFolder: false,
          },
          ...folders.map((folder) => ({
            key: folder.id,
            label: folder.name,
            list: trainingsByFolder[folder.id] || [],
            isFolder: true,
          })),
        ].map((group) => {
          const isOpen = openGroups[group.key] ?? true;
          const dropKey = group.key;

          return (
            <div key={group.key} className="library-group">
              <div
                className={`library-group-header ${dragOverTarget === dropKey ? "is-drop-target" : ""}`}
                onClick={() => toggleGroup(group.key)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverTarget(dropKey);
                }}
                onDragLeave={() => {
                  if (dragOverTarget === dropKey) {
                    setDragOverTarget(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const trainingId = e.dataTransfer.getData("trainingId");
                  if (!trainingId) return;

                  const training = trainings.find((t) => t.id === trainingId);
                  if (!training) return;

                  // Update training with new folderId
                  let updatedTraining = { ...training };
                  if (group.isFolder) {
                    updatedTraining.folderId = group.key;
                  } else {
                    delete updatedTraining.folderId;
                  }

                  // Update via API
                  (async () => {
                    try {
                      const result = await updateTraining(trainingId, updatedTraining);
                      if (onUpdateTraining) {
                        onUpdateTraining(result);
                      }
                    } catch (err) {
                      console.error("Failed to update training:", err);
                    }
                  })();

                  setDragOverTarget(null);
                }}
              >
                <span>
                  {group.isFolder ? "📁" : "🗂️"} {group.label} ({group.list.length})
                </span>

                <span>{isOpen ? "▾" : "▸"}</span>
              </div>
              {isOpen && (
                <div className="library-group-items">
                  {group.list.map((t) => (
                    <div
                      key={t.id}
                      className="library-item"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "copyMove";
                        e.dataTransfer.setData("dragType", "training");
                        e.dataTransfer.setData("trainingId", t.id);
                        e.dataTransfer.setData("training", JSON.stringify(t));
                      }}
                      onDragEnd={() => setDragOverTarget(null)}
                      onClick={() => onSelect(t)}
                    >
                      <span className="library-icon">{getIcon(t.type)}</span>

                      <span>{t.title || "Untitled"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
