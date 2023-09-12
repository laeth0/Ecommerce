// import { useCookies } from "react-cookie";
// import { useNavigate } from "react-router-dom"
import { useState } from 'react'
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

export default function Home() {
  // const navigate = useNavigate()
  // const [cookies, setCookie, removeCookie] = useCookies(['user_token']);
  // <button onClick={()=>navigate('/Login')}>navigate</button>

  return (
    <>
        <Navbar />
        <Outlet/>
        <Footer />
        
    </>
  )
}
