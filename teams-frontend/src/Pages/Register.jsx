import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import InputField from "../Components/InputField";
import Button from "../Components/Button";
import { registerUser } from "../api/authApi";

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        department: "",
        jobTitle: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleRegister = async () => {

        try {

            setLoading(true);

            const response = await registerUser(formData);

            alert("Registration Successful");

            console.log(response.data);

            navigate("/");

        } catch (error) {
             
                console.log(error.response);
                console.log(error.response.data);
                console.log(error.response.status);
            console.error(error);
            
            if (error.response) {
                alert(error.response.data.message);
            } else {
                alert("Registration Failed");
            }


        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="flex justify-center items-center min-h-screen bg-gray-100">

            <div className="bg-white shadow-lg rounded-lg p-8 w-[450px]">

                <h1 className="text-3xl font-bold text-center mb-6">
                    Register
                </h1>

                <InputField
                    label="First Name"
                    name="firstName"
                    type="text"
                    placeholder="Enter First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                />

                <InputField
                    label="Last Name"
                    name="lastName"
                    type="text"
                    placeholder="Enter Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                />

                <InputField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="Enter Email"
                    value={formData.email}
                    onChange={handleChange}
                />

                <InputField
                    label="Phone Number"
                    name="phoneNumber"
                    type="text"
                    placeholder="Enter Phone Number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                />

                <InputField
                    label="Department"
                    name="department"
                    type="text"
                    placeholder="Enter Department"
                    value={formData.department}
                    onChange={handleChange}
                />

                <InputField
                    label="Job Title"
                    name="jobTitle"
                    type="text"
                    placeholder="Enter Job Title"
                    value={formData.jobTitle}
                    onChange={handleChange}
                />

                <InputField
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter Password"
                    value={formData.password}
                    onChange={handleChange}
                />

                <Button
                    text={loading ? "Registering..." : "Register"}
                    onClick={handleRegister}
                />

                <p className="text-center mt-5">
                    Already have an account?

                    <Link
                        to="/"
                        className="text-blue-600 ml-2"
                    >
                        Login
                    </Link>

                </p>

            </div>

        </div>

    );

}

export default Register;