import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="status">
        This page does not exist. <Link to="/">Back to the main page</Link>
      </p>
    </div>
  );
}
