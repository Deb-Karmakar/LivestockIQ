import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '../../contexts/AuthContext';

const LoginView = ({ onToggleView }) => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    // 1. Add state to hold the form input values
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 2. Update the sign-in handler to be async and use the state values
    const handleSignIn = async (e) => {
        e.preventDefault(); // Prevent default form submission
        await login(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-sm">
                {/* 3. Wrap the content in a form with an onSubmit handler */}
                <form onSubmit={handleSignIn}>
                    <CardHeader>
                        <Button
                            variant="link"
                            className="p-0 h-auto justify-start text-sm text-gray-500 hover:text-gray-700 mb-4 no-underline hover:no-underline"
                            onClick={() => navigate('/')}
                            type="button" // Important to prevent form submission
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Home
                        </Button>
                        <CardTitle className="text-2xl">Login to LivestockIQ</CardTitle>
                        <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            {/* 4. Connect the input to the email state */}
                            <Input
                                id="email"
                                type="email"
                                placeholder="myemail@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                             {/* 5. Connect the input to the password state */}
                            <Input
                                id="password"
                                placeholder="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Sign In</Button>
                        <p className="text-sm text-center text-gray-600">
                            Don't have an account?{' '}
                            <Button
                                variant="link"
                                className="p-0 h-auto no-underline hover:no-underline"
                                onClick={onToggleView}
                                type="button" // Important to prevent form submission
                            >
                                Sign Up
                            </Button>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginView;