// The form: owns its inputs, raises "add this course" through onAdd (CONTRACT.md §4).
import { useState } from "react";

const EMPTY = { code: "", title: "", department: "", credits: "", capacity: "", description: "" };

const FIELDS = [
  { name: "code", label: "Code" },
  { name: "title", label: "Title" },
  { name: "department", label: "Department" },
  { name: "credits", label: "Credits", type: "number" },
  { name: "capacity", label: "Capacity", type: "number" },
  { name: "description", label: "Description", textarea: true },
];

export function AddCourseForm({ onAdd }) {
  const [values, setValues] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function change(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onAdd({
        code: values.code,
        title: values.title,
        department: values.department,
        credits: Number(values.credits),
        capacity: Number(values.capacity),
        description: values.description === "" ? null : values.description,
      });
      setValues(EMPTY);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldErrors = error?.fieldErrors ?? {};

  return (
    <form className="add-course" onSubmit={handleSubmit}>
      <h2>Add a course</h2>
      {FIELDS.map(({ name, label, type, textarea }) => {
        const reason = fieldErrors[name];
        const errorId = `${name}-error`;
        const props = {
          id: name,
          value: values[name],
          onChange: (e) => change(name, e.target.value),
          "aria-invalid": reason ? "true" : undefined,
          "aria-describedby": reason ? errorId : undefined,
        };
        return (
          <div className="field" key={name}>
            <label htmlFor={name}>{label}</label>
            {textarea ? <textarea {...props} /> : <input type={type ?? "text"} {...props} />}
            {reason && (
              <p className="field-error" id={errorId}>
                {reason}
              </p>
            )}
          </div>
        );
      })}
      {error && (
        <p className="form-error" role="alert">
          {error.message}
        </p>
      )}
      <button type="submit" disabled={submitting}>
        Add course
      </button>
    </form>
  );
}
