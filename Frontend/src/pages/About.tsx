// Open to everyone — also to guests who are not logged in
export default function About() {
  return (
    <div className="page">
      <h1>About</h1>

      <div className="about-card">
        <h3>The system</h3>
        <p>
          Vacations is a vacation-tagging system. Registered users browse the vacations,
          mark the ones they like and filter them. The admin manages the vacations and
          follows their popularity in the reports.
        </p>

        <h3>Features</h3>
        <ul>
          <li>Register and login with a secure token (JWT) and encrypted passwords</li>
          <li>Two roles: user and admin, each with its own menu and permissions</li>
          <li>Vacation cards with likes, filters and pagination</li>
          <li>Admin: add, edit and delete vacations, likes report and CSV download</li>
          <li>AI trip recommendations and questions about the data (MCP)</li>
        </ul>

        <h3>Technologies</h3>
        <ul>
          <li>Frontend: React, TypeScript, React Router</li>
          <li>Backend: Node.js, Express, TypeScript</li>
          <li>Database: MongoDB with Mongoose</li>
          <li>Runs with Docker Compose</li>
        </ul>

        <h3>Developer</h3>
        <p>
          Yusef Abusalah · Full Stack Developer AI course (FS45800), John Bryce · 2026
        </p>
      </div>
    </div>
  );
}
