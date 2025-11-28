import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Corrected import path
import { Button } from "@/components/ui/button"; // Added missing Button import
import { useSync } from '../../contexts/SyncContext';
import {
    LayoutDashboard,
    PawPrint,
    HeartPulse,
    ShoppingCart,
    Bell,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Package,
    ClipboardCheck,
    ShieldCheck
} from 'lucide-react';

// --- Navigation Links Configuration ---

// Links for the main sidebar (Desktop) and primary mobile nav
const primaryNavLinks = [
    { name: 'Dashboard', path: '/farmer/dashboard', icon: LayoutDashboard },
    { name: 'Animals', path: '/farmer/animals', icon: PawPrint },
    { name: 'Treatments', path: '/farmer/treatments', icon: HeartPulse },
    { name: 'Sales', path: '/farmer/sales', icon: ShoppingCart },
    { name: 'Alerts', path: '/farmer/alerts', icon: Bell },
];

// Links for the secondary mobile drawer menu
const secondaryNavLinks = [
    { name: 'MRL Compliance', path: '/farmer/mrl-compliance', icon: ShieldCheck },
    { name: 'Inventory', path: '/farmer/inventory', icon: Package },
    { name: 'Feed Inventory', path: '/farmer/feed-inventory', icon: Package },
    { name: 'Feed Admin', path: '/farmer/feed-administration', icon: ClipboardCheck },
    { name: 'Reports', path: '/farmer/reports', icon: FileText },
    { name: 'Settings', path: '/farmer/settings', icon: Settings },
];

// Combine all links for the desktop sidebar
const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks];


// --- Main Layout Component ---

const AppLayout = () => {
    const { isOnline, isSyncing } = useSync();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Offline/Sync Banner */}
                {!isOnline && (
                    <div className="bg-yellow-500 text-white text-center py-1 px-4 text-sm font-medium">
                        You are currently offline. Changes will be saved locally and synced when you reconnect.
                    </div>
                )}
                {isSyncing && (
                    <div className="bg-blue-500 text-white text-center py-1 px-4 text-sm font-medium">
                        Syncing data...
                    </div>
                )}

                {/* Mobile Header */}
                <MobileHeader />

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
};


// --- Sub-components ---

const Sidebar = () => {
    const { logout } = useAuth();

    return (
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r">
            <div className="px-6 py-4">
                <h1 className="text-2xl font-bold text-green-700">LivestockIQ</h1>
            </div>
            <nav className="flex-1 px-4 py-2 space-y-2">
                {allNavLinks.map(link => (
                    <NavLink
                        key={link.name}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2 text-gray-700 rounded-lg transition-colors duration-200 ${isActive ? 'bg-green-100 text-green-700 font-semibold' : 'hover:bg-gray-100'
                            }`
                        }
                    >
                        <link.icon className="w-5 h-5 mr-3" />
                        {link.name}
                    </NavLink>
                ))}
            </nav>
            <div className="px-4 py-4 border-t">

            </div>
        </aside>
    );
};

const MobileHeader = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { logout } = useAuth();
    const location = useLocation();

    // Close the drawer whenever the route changes
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location]);

    return (
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-40">
            <h1 className="text-xl font-bold text-green-700">LivestockIQ</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(true)}>
                <Menu className="w-6 h-6" />
            </Button>

            {/* Drawer Menu */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsDrawerOpen(false)}></div>
            <div className={`fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-lg transform transition-transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold">Menu</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}>
                        <X className="w-6 h-6" />
                    </Button>
                </div>
                <nav className="p-4 space-y-2">
                    {secondaryNavLinks.map(link => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-gray-700 rounded-lg ${isActive ? 'bg-green-100 text-green-700 font-semibold' : 'hover:bg-gray-100'
                                }`
                            }
                        >
                            <link.icon className="w-5 h-5 mr-3" />
                            {link.name}
                        </NavLink>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">

                </div>
            </div>
        </header>
    );
}

const BottomNav = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30">
            <div className="flex justify-around">
                {primaryNavLinks.map(link => (
                    <NavLink
                        key={link.name}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full py-2 text-xs transition-colors duration-200 ${isActive ? 'text-green-600' : 'text-gray-500'
                            }`
                        }
                    >
                        <link.icon className="w-6 h-6 mb-1" />
                        <span>{link.name}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default AppLayout;

