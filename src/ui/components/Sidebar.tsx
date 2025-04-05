// src/components/Sidebar.tsx
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <ul>
        <li>
          <Link href="/dashboard">Inicio Cliente</Link>
        </li>
        <li>
          <Link href="/admin">Inicio Admin</Link>
        </li>
      </ul>
    </aside>
  );
}
