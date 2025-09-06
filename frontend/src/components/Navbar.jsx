import { Link } from "react-router-dom";
import ThemeToggle from "./ui/ThemeToggle";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold">Gestão Procon</h1>
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="hover:text-blue-400">Dashboard</Link>
        <Link to="/fiscalizacao" className="hover:text-blue-400">Fiscalização</Link>
        <Link to="/juridico" className="hover:text-blue-400">Jurídico</Link>
        <Link to="/multas" className="hover:text-blue-400">Multas</Link>
        <Link to="/protocolo" className="hover:text-blue-400">Protocolo</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
