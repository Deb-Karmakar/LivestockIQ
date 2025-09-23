import React from 'react';
// 1. Import useNavigate and ArrowLeft
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tractor, Stethoscope, Building, UserCog, ArrowLeft } from 'lucide-react';

const RoleSelectionStep = ({ onSelectRole, onToggleView }) => {
    // 2. Initialize the navigate function
    const navigate = useNavigate();

    const roles = [
        { id: 'farmer', name: 'Farmer', icon: <Tractor className="w-8 h-8 text-green-700" /> },
        { id: 'veterinarian', name: 'Veterinarian', icon: <Stethoscope className="w-8 h-8 text-blue-700" /> },
        { id: 'regulator', name: 'Regulator', icon: <Building className="w-8 h-8 text-gray-700" /> },
        { id: 'admin', name: 'Admin', icon: <UserCog className="w-8 h-8 text-orange-700" /> },
    ];

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    {/* 3. Add the "Back to Home" button */}
                    <Button
                        variant="link"
                        className="p-0 h-auto justify-start text-sm text-gray-500 hover:text-gray-700 mb-4 no-underline hover:no-underline"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Home
                    </Button>
                    <CardTitle className="text-2xl text-center">Join LivestockIQ</CardTitle>
                    <CardDescription className="text-center">First, tell us who you are.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {roles.map(role => (
                        <div key={role.id} onClick={() => onSelectRole(role.id)} className="p-4 border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all">
                            {role.icon}
                            <span className="font-medium">{role.name}</span>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="flex justify-center mt-4">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        {/* 4. Update the Login button for consistency */}
                        <Button
                            variant="link"
                            className="p-0 h-auto no-underline hover:no-underline"
                            onClick={onToggleView}>
                            Login
                        </Button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RoleSelectionStep;