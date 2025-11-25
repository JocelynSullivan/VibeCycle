import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import RoutineResponse from "../components/Routine";
import { useAuth } from "../provider/AuthProvider";

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
  const { username } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="bg-black h-full">
      <div className="flex justify-center items-center p-7 bg-gradient-to-t from-cyan-600 to-cyan-900">
        <div className="absolute top-8 left-5 flex items-center gap-6">
          <Link to="/tasks" className="text-3xl font-stretch-50% text-black hover:underline focus:outline-none">
            Tasks
          </Link>
          <Link to="/routines" className="text-3xl font-stretch-50% text-black hover:underline focus:outline-none">
            Routines
          </Link>
        </div>
        <h1 className="text-5xl font-stretch-50% text-black">
          {username ? `Hey there, ${username}!` : "Welcome to Vibe Cycle!"}
        </h1>
        <div className="flex items-center absolute top-8 right-5 gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleMenu}
              className="bg-gray-700 text-white px-3 py-1 rounded-md"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              Menu
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded shadow-lg z-50">
                <ul>
                  {username && (
                    <li>
                      <div className="px-3 py-2 text-sm text-gray-700">
                        Signed in as
                        <div
                          className="font-medium cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => setProfileOpen((s) => !s)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setProfileOpen((s) => !s);
                          }}
                        >
                          {username}
                        </div>
                      </div>
                    </li>
                  )}
                  <li>
                    <Link
                      to="/saved"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      Saved Routines
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogoutClick();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
            {profileOpen && (
              <div ref={profileRef} className="absolute right-56 top-12 w-56 bg-white rounded shadow-lg z-50 p-4">
                <div className="text-sm text-gray-700">Profile</div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Username</div>
                  <div className="font-medium">{username}</div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                    className="text-sm px-2 py-1 bg-cyan-600 text-white rounded"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Tasks moved to dedicated TasksPage */}
      <div>
        <RoutineResponse />
      </div>
    </div>
  );
};

export default Home;
