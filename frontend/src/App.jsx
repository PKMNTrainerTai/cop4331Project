import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
//import ProtectedRoutes from '../components/ProtectedRoutes';
import LoginPage from '../pages/LoginPage'
import SignUpPage from '../pages/SignUpPage'
import HomePage from '../pages/HomePage'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'


function App() {

  return (
    <Router>

      <Routes>
        <Route path="/login" element ={<LoginPage/>}/>
        <Route path="/signup" element ={<SignUpPage/>}/>
        <Route path="/verify-email" element ={<VerifyEmailPage/>}/>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/home" element ={<HomePage/>}/>
      </Routes>

    </Router>

  )
}

export default App
