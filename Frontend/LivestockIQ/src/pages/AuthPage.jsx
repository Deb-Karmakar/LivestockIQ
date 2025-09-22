import React, { useState } from 'react';
// 1. Import useLocation to read the current URL
import { useLocation } from 'react-router-dom';
import LoginView from '../components/auth/LoginView';
import RoleSelectionStep from '../components/auth/RoleSelectionStep';
import FarmerSignUpStep from '../components/auth/FarmerSignUpStep';
import VetSignUpStep from '../components/auth/VetSignUpStep';

const AuthPage = () => {
    // 2. Get the current location object
    const location = useLocation();

    // 3. Set the initial state based on the URL path
    // If the path is '/login', isLoginView will be true. Otherwise, it will be false.
    const [isLoginView, setIsLoginView] = useState(location.pathname === '/login');

    const [userRole, setUserRole] = useState(null);

    const handleRoleSelect = (role) => {
        setUserRole(role);
    };

    const handleBackToRoleSelect = () => {
        setUserRole(null);
    };

    // This logic now works correctly
    if (isLoginView) {
        return <LoginView onToggleView={() => setIsLoginView(false)} />;
    }

    if (!userRole) {
        return <RoleSelectionStep onSelectRole={handleRoleSelect} onToggleView={() => setIsLoginView(true)} />;
    }

    switch (userRole) {
        case 'farmer':
            return <FarmerSignUpStep onBack={handleBackToRoleSelect} />;
        case 'veterinarian':
            return <VetSignUpStep onBack={handleBackToRoleSelect} />;
        default:
            return <RoleSelectionStep onSelectRole={handleRoleSelect} onToggleView={() => setIsLoginView(true)} />;
    }
};

export default AuthPage;