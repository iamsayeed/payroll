import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { AlertCircle } from "lucide-react";
import logo from "../assets/Login_Page/fresco_logo_black.png";
import leaf_1 from "../assets/Login_Page/leaf-1.png";
import leaf_2 from "../assets/Login_Page/leaf-2.png";
import leaf_3 from "../assets/Login_Page/leaf-3.png";

function ResetPasswordError({ message }) {
  const navigate = useNavigate();

  return (
    <div className="flex w-full items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full text-center bg-white shadow-lg rounded-lg p-6">
        <div className="text-red-500 flex items-center justify-center gap-2 text-xl font-bold">
          <AlertCircle className="w-6 h-6" /> {message || "Invalid or Expired Link"}
        </div>
        <p className="text-gray-700 mt-2">Your password reset link is invalid or has expired.</p>
        <p className="text-gray-700 mt-2">Please request a new one.</p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full py-2 bg-blue-600 text-white rounded-md"
          >
            Request New Link
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2 border border-gray-300 text-gray-700 rounded-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/validate-reset-password-token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Invalid or expired token.");
          setIsTokenValid(false);
        } else {
          setIsTokenValid(true);
        }
      } catch (error) {
        setError("An error occurred while validating the token.");
        setIsTokenValid(false);
      }
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!isTokenValid) {
      setError("Invalid or expired token. Please request a new reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: password, confirm_password: confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password successfully reset. Redirecting to login...");
        setTimeout(() => navigate("/"), 3000);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again later.");
    }
  };

  if (isTokenValid === false) {
    return <ResetPasswordError message={error} />;
  }

  return (
    <div className="min-h-screen w-full relative bg-white p-4 sm:p-6 overflow-hidden">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <img src={logo} alt="Fresco Logo" className="w-40 sm:w-60 object-contain" />
      </div>
      <img src={leaf_1} alt="Decorative Leaf" className="absolute bottom-0 left-0 w-1/4 opacity-70" />
      <img src={leaf_3} alt="Decorative Leaf" className="absolute top-0 right-0 w-1/4 opacity-70" />
      <img src={leaf_2} alt="Decorative Leaf" className="absolute bottom-0 right-0 w-1/5 opacity-70" />
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-4">Reset Password</h2>
          {error && <p className="text-red-600 text-center">{error}</p>}
          {isTokenValid ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              {message && <p className="text-green-600">{message}</p>}
              <button type="submit" className="w-full py-2 bg-gray-800 text-white rounded-md">Reset Password</button>
            </form>
          ) : (
            <p className="text-center text-red-600">Validating token...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
