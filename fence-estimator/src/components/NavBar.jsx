import { Link, NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <div className="topbar no-print">
      <Link to="/" className="brand">
        <div className="brand-mark">GF</div>
        <div className="brand-text">
          <div className="name">Galloway Fence &amp; Gate</div>
          <div className="tag">Tallahassee, FL</div>
        </div>
      </Link>
      <nav className="topnav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        <NavLink to="/estimate/measurements" className={({ isActive }) => (isActive ? "active" : "")}>
          Build My Fence
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
          Business Dashboard
        </NavLink>
      </nav>
    </div>
  );
}
