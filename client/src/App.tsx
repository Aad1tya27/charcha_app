// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
// import { Button } from "@/components/ui/button"
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { SignUp } from './components/SignUp' 
import { SignIn } from "./components/SignIn"
import {Messages} from './components/Messages'
import { Posts } from './components/Posts'
import LandingPage from './components/LandingPage'
import NotFound from './components/NotFound'


function App() {
  const router = createBrowserRouter([
    {
     path:'/signup',
     element: <><SignUp/></> 
    },
    {
      path:'/signin',
      element: <><SignIn/></> 
     },
    {
      path:'/messages',
      element: <><Messages/></> 
     },{
      path:'/posts',
      element: <><Posts/></> 
     },{
      path:'/',
      element:<><LandingPage/></>
     },{
      path:"*",
      element:<><NotFound/></>
     }
  ])
  return (
    <>
    
      <RouterProvider router={router}/>
    </>
  )
}

export default App
