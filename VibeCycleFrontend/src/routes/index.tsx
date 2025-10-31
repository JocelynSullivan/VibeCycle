import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Logout from "../pages/Logout";
import Home from "../pages/Home";
import Saved from "../pages/Saved";
import SavedDetail from "../pages/SavedDetail";

// import App from "../App";

const Routes = () => {
  const auth = useAuth();
  if (!auth) {
    return null;
  }

  const { token } = auth as { token?: string };

  const routesForPublic = [{ path: "/login", element: <Login /> }];

  const routesForAuthenticatedOnly = [
    {
      path: "/home",
      element: (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      ),
      // children: [
      //   {
      //     path: "/logout",
      //     element: <Logout />,
      //   },
      // ],
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
    ...routesForPublic,
    // only include public-not-auth routes when the user is NOT authenticated
    ...(!token ? routesForNotAuthenticatedOnly : []),
    ...routesForAuthenticatedOnly,
  ]);

  return <RouterProvider router={router} />;
};

export default Routes;
