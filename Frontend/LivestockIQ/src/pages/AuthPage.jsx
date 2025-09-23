import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoginView from '../components/auth/LoginView';
import RoleSelectionStep from '../components/auth/RoleSelectionStep';
import FarmerSignUpStep from '../components/auth/FarmerSignUpStep';
import VetSignUpStep from '../components/auth/VetSignUpStep';
// NEW: 1. Import the new regulator sign-up component
import RegulatorSignUpStep from '../components/auth/RegulatorSignUpStep';

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
        return <RoleSelectionStep onSelectRole={handleRoleSelect} onToggleView={() => setIsLoginView(true)} />;
    }

    switch (userRole) {
        case 'farmer':
            return <FarmerSignUpStep onBack={handleBackToRoleSelect} />;
        case 'veterinarian':
            return <VetSignUpStep onBack={handleBackToRoleSelect} />;
        // NEW: 2. Add the case for the regulator role
        case 'regulator':
            return <RegulatorSignUpStep onBack={handleBackToRoleSelect} />;
        default:
            return <RoleSelectionStep onSelectRole={handleRoleSelect} onToggleView={() => setIsLoginView(true)} />;
    }
};

export default AuthPage;
