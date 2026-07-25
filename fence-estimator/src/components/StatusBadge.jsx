import { STATUS_LABEL } from "../context/ProjectContext.jsx";

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status] || status}</span>;
}
