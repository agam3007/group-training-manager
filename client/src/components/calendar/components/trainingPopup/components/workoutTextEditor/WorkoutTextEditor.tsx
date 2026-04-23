import { useState, useRef, useEffect } from "react";
import type { WorkoutStep, TrainingType } from "@/shared/types";
import { parseWorkoutText, workoutStepsToText } from "../../utils/";
import "./WorkoutTextEditor.css";

interface Props {
  steps: WorkoutStep[];
  setSteps: React.Dispatch<React.SetStateAction<WorkoutStep[]>>;
  sport: TrainingType;
}

export default function WorkoutTextEditor({ steps, setSteps, sport }: Props) {
  const [text, setText] = useState<string>(() => workoutStepsToText(steps as any));
  const [errors, setErrors] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Update text when steps change externally
useEffect(() => {
  const currentText = workoutStepsToText(steps as any);

  // אל תדרוס אם המשתמש באמצע עריכה
  if (isTyping) return;

  // אל תעדכן אם זה אותו דבר
  if (currentText === text) return;

  setText(currentText);
}, [steps]);
const handleParse = (value: string) => {
  if (!value.trim()) {
    setSteps([]);
    setErrors([]);
    setIsTyping(false);
    return;
  }

  try {
    const { blocks, errors: parseErrors } = parseWorkoutText(value, sport);
    setErrors(parseErrors);

// רק אם אין שגיאות → תעדכני steps
if (parseErrors.length === 0) {
  setSteps(blocks as any);
}
  } catch (error) {
    if (error instanceof Error) {
      setErrors([error.message]);
    }
  }

  setIsTyping(false);
};

useEffect(() => {
  return () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
  };
}, []);

  const handleAddLine = () => {
    const newText = text ? text + "\n" : "";
    setText(newText);
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.selectionStart = newText.length;
      }
    }, 0);
  };

  return (
    <div className="workout-text-editor">
      <div className="editor-header">
        <h4>Workout Text</h4>
      </div>

      <div className="editor-input-container">
      <textarea
  ref={textAreaRef}
  value={text}
  onChange={(e) => {
    setText(e.target.value);
    setIsTyping(true);
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      handleParse(text);
    }
  }}
  onBlur={() => handleParse(text)}
  className="editor-textarea"
/>
      </div>

      {errors.length > 0 && (
        <div className="error-box">
          <div className="error-title">⚠️ Parsing Issues:</div>
          {errors.map((error, idx) => (
            <div key={idx} className="error-item">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="editor-tips">
        <details>
          <summary>📝 Format Help</summary>
          <div className="tips-content">
            <p>
              <strong>Distance:</strong> 100m, 1km, 10*100m
            </p>
            <p>
              <strong>Time:</strong> 5min, 10*3min
            </p>
            <p>
              <strong>Zones:</strong> Z1, Z2, Z3, Z4, Z5
            </p>
            <p>
              <strong>Rest:</strong> R:30s, R:2min
            </p>
            <p className="example">
              Example: <code>10*100m Z3 R:30</code>
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
