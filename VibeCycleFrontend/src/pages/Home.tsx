import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Tasks from "../components/Tasks";
import RoutineResponse from "../components/Routine";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    navigate("/logout");
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const toggleMenu = () => setMenuOpen((s) => !s);
  return (
    <div className="bg-black h-full">
      <div className="flex justify-center items-center p-7 bg-gradient-to-t from-cyan-600 to-cyan-900">
        <h1 className="text-5xl font-stretch-50% text-black">Welcome to Vibe Cycle!</h1>
        <div className="flex items-center absolute top-8 right-5 gap-3">
          <div className="relative" ref={menuRef}>
            <button onClick={toggleMenu} className="bg-gray-700 text-white px-3 py-1 rounded-md" aria-haspopup="true" aria-expanded={menuOpen}>
              Menu
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded shadow-lg z-50">
                <ul>
                  <li>
                    <Link to="/saved" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>
                      Saved Routines
                    </Link>
                  </li>
                  <li>
                    <button onClick={() => { setMenuOpen(false); handleLogoutClick(); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-center pt-10">
        <p className="text-cyan-500 text-2xl">Your personalized task manager</p>
      </div>
      <div className="flex justify-center pt-7">
        <p className="text-gray-400 text-lg px-60">
          Enter your tasks and energy levels and let Vibe Cycle do the rest!
        </p>
      </div>
      <div className="flex justify-center">
        <Tasks />
      </div>
      <div>
        <RoutineResponse />
      </div>
    </div>
  );
};

export default Home;
