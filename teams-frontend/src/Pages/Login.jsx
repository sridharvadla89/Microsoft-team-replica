import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import InputField from "../Components/InputField";
import Button from "../Components/Button";
import { loginUser } from "../api/authApi";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {

        try {

            setLoading(true);

            const response = await loginUser({

                email,
                password

            });

            console.log(response.data);

            localStorage.setItem(
                "token",
                response.data.accessToken
            );

            alert("Login Successful");

            navigate("/dashboard");

        } catch (error) {

            console.error(error);

            if (error.response) {

                alert(error.response.data.message);

            } else {

                alert("Login Failed");

            }

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="flex justify-center items-center min-h-screen bg-gray-100">

            <div className="bg-white shadow-lg rounded-lg p-8 w-96">

                <h1 className="text-3xl font-bold text-center mb-6">

                    Microsoft Teams Clone

                </h1>

                <InputField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <InputField
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                    text={loading ? "Logging In..." : "Login"}
                    onClick={handleLogin}
                />

                <p className="text-center mt-5">

                    Don't have an account?

                    <Link
                        to="/register"
                        className="text-blue-600 ml-2"
                    >
                        Register
                    </Link>

                </p>

            </div>

        </div>

    );

}

export default Login;