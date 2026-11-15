// The View: renders the course list from its props alone (CONTRACT.md §4).
function seats(seatsLeft) {
  if (seatsLeft === 0) return "Full";
  if (seatsLeft === 1) return "1 seat left";
  return `${seatsLeft} seats left`;
}

export function CoursesView({ courses, status, error }) {
  if (status === "loading") return <p>Loading courses…</p>;
  if (status === "error") return <p role="alert">{`Couldn't load courses: ${error}`}</p>;
  if (courses.length === 0) return <p>No courses yet.</p>;

  return (
    <ul className="courses">
      {courses.map((course) => (
        <li key={course.id}>
          <strong>{`${course.code} · ${course.title}`}</strong>
          <span>{`${course.credits} credits · ${course.department} · ${seats(course.seatsLeft)}`}</span>
        </li>
      ))}
    </ul>
  );
}
