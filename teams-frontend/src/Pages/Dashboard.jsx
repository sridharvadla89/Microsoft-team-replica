import Sidebar from "../Components/SideBar";
import Navbar from "../Components/Navbar";

function Dashboard() {

    return (

        <>

            <Sidebar />

            <Navbar />

            <div
                style={{
                    marginLeft: "250px",
                    marginTop: "80px",
                    padding: "30px"
                }}
            >

                <h1>Dashboard</h1>

                <h3>Welcome to Teams Application</h3>

            </div>

        </>

    );

}

export default Dashboard;