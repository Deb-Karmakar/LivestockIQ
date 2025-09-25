// frontend/src/pages/AuthPage.jsx

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoginView from '../components/auth/LoginView';
import RoleSelectionStep from '../components/auth/RoleSelectionStep';
import FarmerSignUpStep from '../components/auth/FarmerSignUpStep';
import VetSignUpStep from '../components/auth/VetSignUpStep';
import RegulatorSignUpStep from '../components/auth/RegulatorSignUpStep';
import AdminLogin from '../components/auth/AdminLogin'; // 1. Import the new AdminLogin component

const AuthPage = () => {
    const location = useLocation();
    const [isLoginView, setIsLoginView] = useState(location.pathname === '/login');
    const [userRole, setUserRole] = useState(null);

    const handleRoleSelect = (role) => {
        setUserRole(role);
    };

    const handleBackToRoleSelect = () => {
        setUserRole(null);
    };

    if (isLoginView) {
        return <LoginView onToggleView={() => setIsLoginView(false)} />;
    }

    if (!userRole) {
        // Your RoleSelectionStep is perfect as is, no changes needed there.
        return <RoleSelectionStep onSelectRole={handleRoleSelect} onToggleView={() => setIsLoginView(true)} />;
    }

    // 2. Add the 'admin' case to the switch statement
    switch (userRole) {
        case 'farmer':
            return <FarmerSignUpStep onBack={handleBackToRoleSelect} />;
        case 'veterinarian':
            return <VetSignUpStep onBack={handleBackToRoleSelect} />;
        case 'regulator':
            return <RegulatorSignUpStep onBack={handleBackToRoleSelect} />;
        case 'admin':
            return <AdminLogin onBack={handleBackToRoleSelect} />; // This shows the admin login
        default:
            return <RoleSelectionStep onSelectRole={handleRoleSelect} onToggleView={() => setIsLoginView(true)} />;
    }
};

export default AuthPage;