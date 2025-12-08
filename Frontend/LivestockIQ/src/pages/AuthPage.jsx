import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import LoginView from '../components/auth/LoginView';
import RoleSelectionStep from '../components/auth/RoleSelectionStep';
import FarmerSignUpStep from '../components/auth/FarmerSignUpStep';
import VetSignUpStep from '../components/auth/VetSignUpStep';
import RegulatorSignUpStep from '../components/auth/RegulatorSignUpStep';
import AdminLogin from '../components/auth/AdminLogin';

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

    // Render content based on current state
    const renderContent = () => {
        if (isLoginView) {
            return <LoginView onToggleView={() => setIsLoginView(false)} />;
        }

        if (!userRole) {
            return <RoleSelectionStep onSelectRole={handleRoleSelect} onToggleView={() => setIsLoginView(true)} />;
        }

        // Handle different user roles
        switch (userRole) {
            case 'farmer':
                return <FarmerSignUpStep onBack={handleBackToRoleSelect} />;
            case 'veterinarian':
                return <VetSignUpStep onBack={handleBackToRoleSelect} />;
            case 'regulator':
                return <RegulatorSignUpStep onBack={handleBackToRoleSelect} />;
            case 'admin':
                return <AdminLogin onBack={handleBackToRoleSelect} />;
            default:
                return <RoleSelectionStep onSelectRole={handleRoleSelect} onToggleView={() => setIsLoginView(true)} />;
        }
    };

    return (
        <div className="min-h-screen relative">
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Content with proper z-index to appear above background */}
            <div className="relative z-10">
                {renderContent()}
            </div>
        </div>
    );
};

export default AuthPage;