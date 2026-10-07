import { useState, useRef, useEffect } from "react";
import type { WorkoutStep, TrainingType } from "@/shared/types";
import { parseWorkoutText, workoutStepsToText } from "../../utils/"; // Update path as needed
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

  useEffect(() => {
    const currentText = workoutStepsToText(steps as any);
    if (isTyping) return;
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
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

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
          placeholder="WU:\n10*100m Z2 R:30\n\nMAIN:\n3*5*100m Z4 R:15 paddles (fast turns)"
        />
      </div>

      {errors.length > 0 && (
        <div className="error-box">
          <div className="error-title">⚠️ Parsing Issues:</div>
          {errors.map((error, idx) => (
            <div key={idx} className="error-item">{error}</div>
          ))}
        </div>
      )}

      <div className="editor-tips">
        <details>
          <summary>📝 Format Help</summary>
          <div className="tips-content">
            <p><strong>Blocks:</strong> WU, CD, Main Set, Technique</p>
            <p><strong>Sets & Reps:</strong> <code>10*100m</code> or <code>3*5*100m</code></p>
            <p><strong>Zones & Rest:</strong> Z1-Z5, R:30s, R:2min</p>
            <p><strong>Equipment:</strong> Add words like <code>paddles</code>, <code>fins</code>, <code>pullbuoy</code> anywhere.</p>
            <p><strong>Notes:</strong> Any extra text is saved as a note automatically.</p>
            <p className="example">
              Example:<br/>
              <code>WU:</code><br/>
              <code>400m Z1</code><br/>
              <code>MAIN:</code><br/>
              <code>3 * 5 * 100m Z4 R:15 paddles (focus on breathing)</code>
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}