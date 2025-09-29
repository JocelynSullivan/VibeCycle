import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

type NewUserFormData = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const auth = useAuth();
  if (!auth) {
    return null;
  }

  // Type assertion to ensure setToken exists
  const { setToken } = auth as { setToken: (token: string) => void };

  const navigate = useNavigate();

  const [newUserFormData, setNewUserFormData] = useState<NewUserFormData>({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewUserFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setToken("this is a test token");
    navigate("/", { replace: true });
  };

  return (
    <>
      <div className=" bg-linear-to-t from-cyan-800 to-black to-99% h-screen">
        <div className="flex justify-center items-center"></div>
        <div>
          <p className="flex justify-center text-cyan-700 text-5xl pt-30">Vibe Cycle</p>
        </div>
        <div className="flex justify-center pt-20">
          <div className="flex items-center bg-black px-60 pb-9 rounded-3xl">
            <div className="flex justify-center pb-1"></div>
            <form onSubmit={handleSubmit}>
              <div className="pt-15">
                <Input
                  id="username"
                  name="username"
                  placeholder="Username"
                  onChange={handleChange}
                  value={newUserFormData.username}
                  className="flex justify-center border-2 border-cyan rounded-sm text-gray-400 p-1.5"
                />
              </div>
              <div className="pt-7">
                <Input
                  id="password"
                  name="password"
                  placeholder="Password"
                  value={newUserFormData.password}
                  onChange={handleChange}
                  className="flex justify-center border-2 border-cyan rounded-sm text-gray-400 p-1.5"
                />
              </div>
              <div className="pt-10 px-1">
                <div className="flex justify-center">
                  <Button type="submit" className="bg-cyan-500 rounded-full text-black p-1.5 px-10">
                    Log In
                  </Button>
                </div>
                <div className="flex justify-center pt-15">
                  <p className="text-gray-400">Don't have an account? </p>
                  <p className="text-cyan-500"> Sign up here.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
