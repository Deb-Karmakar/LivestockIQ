// frontend/src/components/auth/AdminLogin.jsx

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

const AdminLogin = ({ onBack }) => {
    const { login } = useAuth();

    const handleLogin = (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        login(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <CardTitle className="text-2xl">Admin Portal</CardTitle>
                            <CardDescription>Please log in to continue.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="admin@livestockiq.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Login as Admin</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default AdminLogin;