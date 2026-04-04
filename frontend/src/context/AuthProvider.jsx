import { useState } from "react";
import { AuthContext } from "./ContextCreation";

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return Boolean(localStorage.getItem("token"));
    });

    const login = () => {
        setIsLoggedIn(true);
    };

    const logout = () => {
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
        {children}
        </AuthContext.Provider>
    );
};
