"use client"

import { useState, useEffect, createContext, useContext } from "react"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = (userData) => {
    setUser(userData)
    sessionStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem("user")
  }

  const value = {
    user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
