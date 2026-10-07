import { useState, useEffect, useCallback } from "react";
import type { Note, NoteTargetType, NoteCategory } from "@/shared/types/note";
import {
  getNotesByTarget,
  createNote as apiCreateNote,
  deleteNote as apiDeleteNote,
} from "@/api/notes";
import "./NotesPanel.css";

interface NotesPanelProps {
  targetType: NoteTargetType;
  targetId: string;
  maxNotes?: number;
  collapsible?: boolean;
  onNoteAdded?: (note: Note) => void;
  onNoteDeleted?: (noteId: string) => void;
}

export default function NotesPanel({
  targetType,
  targetId,
  maxNotes = 10,
  collapsible = true,
  onNoteAdded,
  onNoteDeleted,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General" as NoteCategory,
    flagForWorkoutSelection: false,
  });

  const categories: NoteCategory[] = [
    "Technical",
    "Injury",
    "Next-Session-Focus",
    "General",
    "Athlete",
    "Group",
    "Check-In",
    "Other",
  ];

  // Fetch notes on mount or when target changes
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedNotes = await getNotesByTarget(targetType, targetId);
        setNotes(fetchedNotes.slice(0, maxNotes));
      } catch (err) {
        setError("Failed to load notes");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [targetType, targetId, maxNotes]);

  const handleAddNote = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.title.trim() || !formData.description.trim()) {
        setError("Title and description are required");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const newNote = await apiCreateNote({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          targetType,
          targetId,
          flagForWorkoutSelection: formData.flagForWorkoutSelection,
        });

        // Add to the beginning of the list
        setNotes((prev) => [newNote, ...prev].slice(0, maxNotes));
        setSuccess("Note added successfully");

        // Reset form
        setFormData({
          title: "",
          description: "",
          category: "General",
          flagForWorkoutSelection: false,
        });
        setShowForm(false);

        // Notify parent
        onNoteAdded?.(newNote);

        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(null), 2000);
      } catch (err) {
        setError("Failed to add note");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, targetType, targetId, maxNotes, onNoteAdded]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      if (!confirm("Delete this note?")) return;

      setIsLoading(true);
      setError(null);

      try {
        await apiDeleteNote(noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        onNoteDeleted?.(noteId);
        setSuccess("Note deleted successfully");
        setTimeout(() => setSuccess(null), 2000);
      } catch (err) {
        setError("Failed to delete note");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [onNoteDeleted]
  );

  const getCategoryColor = (category: NoteCategory): string => {
    const colors: Record<NoteCategory, string> = {
      Technical: "#3b82f6",
      Injury: "#ef4444",
      "Next-Session-Focus": "#f59e0b",
      General: "#8b5cf6",
      Athlete: "#06b6d4",
      Group: "#10b981",
      "Check-In": "#ec4899",
      Other: "#6b7280",
    };
    return colors[category] || "#6b7280";
  };

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <div className="notes-title-section">
          {collapsible && (
            <button
              className="expand-button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          <h3>Notes ({notes.length})</h3>
        </div>
        {isExpanded && (
          <button
            className="add-note-button"
            onClick={() => setShowForm(!showForm)}
            disabled={isLoading}
          >
            {showForm ? "Cancel" : "+ Add Note"}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="notes-content">
          {/* Add Note Form */}
          {showForm && (
            <form className="add-note-form" onSubmit={handleAddNote}>
              <input
                type="text"
                placeholder="Note title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                disabled={isLoading}
                required
              />

              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as NoteCategory })
                }
                disabled={isLoading}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Note details..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isLoading}
                rows={3}
                required
              />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.flagForWorkoutSelection}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      flagForWorkoutSelection: e.target.checked,
                    })
                  }
                  disabled={isLoading}
                />
                Flag for workout selection
              </label>

              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Note"}
              </button>
            </form>
          )}

          {/* Success/Error Messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Notes List */}
          {isLoading && !notes.length ? (
            <div className="loading">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes yet</p>
              <p className="hint">Add one to get started</p>
            </div>
          ) : (
            <div className="notes-list">
              {notes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <div className="note-meta">
                      <span
                        className="category-badge"
                        style={{
                          backgroundColor: getCategoryColor(note.category),
                        }}
                      >
                        {note.category}
                      </span>
                      <span className="note-date">
                        {new Date(note.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={isLoading}
                      title="Delete note"
                    >
                      ×
                    </button>
                  </div>

                  <h4 className="note-title">{note.title}</h4>
                  <p className="note-description">{note.description}</p>

                  {note.flagForWorkoutSelection && (
                    <div className="workout-selection-flag">
                      📋 Flagged for workout selection
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
