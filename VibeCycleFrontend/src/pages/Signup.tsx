import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

type NewUserFormData = {
  username: string;
  password: string;
};

const Signup: React.FC = () => {
  const auth = useAuth();
  if (!auth) return null;
  const { setToken } = auth as { setToken: (token: string | null) => void };
  const navigate = useNavigate();

  const [formData, setFormData] = useState<NewUserFormData>({ username: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // client-side validation
    if (!formData.username.trim() || !formData.password) {
      alert("Username and password are required");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Status ${res.status}`);
      }

      // automatically log in after successful signup
      const tokenRes = await fetch("http://localhost:8000/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: formData.username, password: formData.password }).toString(),
      });
      if (!tokenRes.ok) throw new Error("Signup succeeded but login failed");
      const tokenData = await tokenRes.json();
      setToken(tokenData.access_token);
      navigate("/home", { replace: true });
    } catch (err: any) {
      alert(err?.message ?? "Signup error");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div className="bg-gray-900 p-8 rounded-lg">
        <h2 className="text-2xl text-white mb-4">Create an account</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
          <Input name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
          <Input name="password" placeholder="Password" value={formData.password} onChange={handleChange} />
          <div className="flex justify-center">
            <Button type="submit" className="bg-cyan-500">
              Sign Up
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
