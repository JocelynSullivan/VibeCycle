import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/Login";
import Home from "../pages/Home";
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
      path: "/",
      element: (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      ),
    },
  ];

  const routesForNotAuthenticatedOnly = [
    {
      path: "/login",
      element: <Login />,
    },
  ];

  const router = createBrowserRouter([
    ...routesForPublic,
    ...(token ? routesForNotAuthenticatedOnly : []),
    ...routesForAuthenticatedOnly,
  ]);

  return <RouterProvider router={router} />;
};

export default Routes;
