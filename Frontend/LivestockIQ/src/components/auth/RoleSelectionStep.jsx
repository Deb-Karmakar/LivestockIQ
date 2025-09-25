import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// 1. Remove Tractor from the import
import { Stethoscope, Building, UserCog, ArrowLeft } from 'lucide-react';

// 2. Import your video file
// Note: Adjust the path if your file structure is different.
// This path assumes RoleSelectionStep.jsx is in src/components/auth/
import farmerVideo from '../../assets/generated_images/farmer.mp4';
import doctorVideo from '../../assets/generated_images/doctor.mp4';
import regulatorVideo from '../../assets/generated_images/regulator.mp4';
import adminVideo from '../../assets/generated_images/admin.mp4';


const RoleSelectionStep = ({ onSelectRole, onToggleView }) => {
    const navigate = useNavigate();

    const roles = [
        // 3. Replace the Lucide icon with a <video> element for the farmer
        {
            id: 'farmer',
            name: 'Farmer',
            icon: (
                <video
                    src={farmerVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-12 h-12" // Adjusted size for the video, feel free to change
                />
            )
        },
        {
            id: 'veterinarian',
            name: 'Veterinarian',
            icon: (
                <video
                    src={doctorVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-12 h-12" // Adjusted size for the video, feel free to change
                />
            )
        },
        {
            id: 'regulator',
            name: 'Regulator',
            icon: (
                <video
                    src={regulatorVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-12 h-12" // Adjusted size for the video, feel free to change
                />
            )
        },
        {
            id: 'admin',
            name: 'Admin',
            icon: (
                <video
                    src={adminVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-12 h-12" // Adjusted size for the video, feel free to change
                />
            )
        },
        
    ];

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
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