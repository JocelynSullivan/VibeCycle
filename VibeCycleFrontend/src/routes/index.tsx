import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Logout from "../pages/Logout";
import Home from "../pages/Home";
import TasksPage from "../pages/TasksPage";
import Saved from "../pages/Saved";
import SavedDetail from "../pages/SavedDetail";
import Routines from "../pages/Routines";

const Routes = () => {
  const auth = useAuth();
  if (!auth) {
    return null;
  }

  const { token } = auth as { token?: string };

  const routesForPublic = [{ path: "/login", element: <Login /> }];

  const routesForAuthenticatedOnly = [
    {
      path: "/tasks",
      element: (
        <ProtectedRoute>
          <TasksPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/home",
      element: (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      ),
    },
    {
      path: "/routines",
      element: (
        <ProtectedRoute>
          <Routines />
        </ProtectedRoute>
      ),
    },
  ];

  // Make sure logout is available for authenticated users
  routesForAuthenticatedOnly.push({
    path: "/logout",
    element: (
      <ProtectedRoute>
        <Logout />
      </ProtectedRoute>
    ),
  });

  routesForAuthenticatedOnly.push({
    path: "/saved",
    element: (
      <ProtectedRoute>
        <Saved />
      </ProtectedRoute>
    ),
  });

  routesForAuthenticatedOnly.push({
    path: "/saved/:id",
    element: (
      <ProtectedRoute>
        <SavedDetail />
      </ProtectedRoute>
    ),
  });

  const routesForNotAuthenticatedOnly = [
    {
      path: "/",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
  ];

  const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    ...routesForPublic,
    ...(!token ? routesForNotAuthenticatedOnly : []),
    ...routesForAuthenticatedOnly,
  ]);

  return <RouterProvider router={router} />;
};

export default Routes;
