import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Phone, Mail } from 'lucide-react';
import { axiosInstance } from '../../contexts/AuthContext'; // Import the axios instance

// --- Main Farmer Directory Page Component ---
const FarmerDirectoryPage = () => {
    const [farmers, setFarmers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFarmers = async () => {
            try {
                setLoading(true);
                const { data } = await axiosInstance.get('vets/my-farmers');
                setFarmers(data);
            } catch (error) {
                console.error("Failed to fetch farmers:", error);
                // Optionally, show a toast or error message
            } finally {
                setLoading(false);
            }
        };

        fetchFarmers();
    }, []); // Empty dependency array means this runs once when the page loads

    const filteredFarmers = useMemo(() => farmers.filter(f =>
        f.farmOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.farmName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [farmers, searchTerm]);

    if (loading) {
        return <div>Loading farmers...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Farmer Directory</h1>
                    <p className="mt-1 text-gray-600">A directory of all farmers under your supervision.</p>
                </div>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input placeholder="Search by farmer or farm name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFarmers.map(farmer => (
                    <Card key={farmer._id} className="flex flex-col">
                        <CardHeader className="flex flex-col items-center text-center">
                            <Avatar className="h-20 w-20 mb-4">
                                <AvatarFallback>{farmer.farmOwner.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{farmer.farmOwner}</CardTitle>
                            <CardDescription>{farmer.farmName}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                             <div className="flex justify-center gap-2 border-t pt-4">
                                <Button asChild variant="outline" size="sm">
                                    <a href={`tel:${farmer.phoneNumber}`}>
                                        <Phone className="mr-2 h-4 w-4" /> Call
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <a href={`mailto:${farmer.email}`}>
                                        <Mail className="mr-2 h-4 w-4" /> Email
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
             {filteredFarmers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>No farmers found.</p>
                    <p className="text-sm">Farmers will appear here after they sign up using your Vet ID.</p>
                </div>
            )}
        </div>
    );
};

export default FarmerDirectoryPage;