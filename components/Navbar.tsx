// src/components/Navbar.tsx
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export function Navbar() {
  return (
    <nav className="navbar">
      <Link href="/dashboard">Dashboard Cliente</Link>
      <Link href="/admin">Dashboard Admin</Link>
      <LogoutButton />
    </nav>
  );
}
