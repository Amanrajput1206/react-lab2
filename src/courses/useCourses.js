// The hook: fetch and logic for the Courses page (CONTRACT.md §4).
import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";

const byCode = (a, b) => a.code.localeCompare(b.code);

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // Load the list once, when the page appears. The cleanup drops a stale answer
  // (StrictMode runs this effect twice in development).
  useEffect(() => {
    let ignore = false;
    apiFetch("/api/courses")
      .then((data) => {
        if (ignore) return;
        setCourses(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
        setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, []);

  // POST the course, then insert the 201 body in code order — a new array, no reload.
  // Errors are not caught here: they reach the form, which shows them.
  async function addCourse(courseRequest) {
    const created = await apiFetch("/api/courses", { method: "POST", body: courseRequest });
    setCourses((prev) => [...prev, created].sort(byCode));
    return created;
  }

  return { courses, status, error, addCourse };
}
