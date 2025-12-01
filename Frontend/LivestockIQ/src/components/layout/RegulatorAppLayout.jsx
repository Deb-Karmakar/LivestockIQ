import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    ClipboardCheck,
    Map,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    TrendingUp,
    Users2,
    AlertCircle,
    FileCheck,
    HelpCircle,
    Building2,
    Stethoscope,
    BriefcaseMedical,
    ShieldCheck,
    UserCog,
} from 'lucide-react';

// --- Regulator Navigation Links Configuration ---

const primaryNavLinks = [
    { name: 'Dashboard', path: '/regulator/dashboard', icon: LayoutDashboard },
    { name: 'Farms', path: '/regulator/farms', icon: Building2 },
    { name: 'Vets', path: '/regulator/vets', icon: Stethoscope },
    //  { name: 'Compliance', path: '/regulator/compliance', icon: ClipboardCheck },
    { name: 'Trends', path: '/regulator/trends', icon: TrendingUp },
];

const secondaryNavLinks = [
    { name: 'Demographics', path: '/regulator/demographics', icon: Users2 },
    { name: 'Map View', path: '/regulator/map', icon: Map },
    { name: 'Prescriptions', path: '/regulator/prescriptions', icon: BriefcaseMedical },
    { name: 'Audit Trails', path: '/regulator/audit-trails', icon: ShieldCheck },
    { name: 'User Oversight', path: '/regulator/users', icon: UserCog },
    { name: 'Reports', path: '/regulator/reports', icon: FileText },
    { name: 'MRL Verifications', path: '/regulator/mrl-verifications', icon: FileCheck },
    { name: 'Alerts', path: '/regulator/alerts', icon: AlertCircle },
    { name: 'Support', path: '/regulator/support/raise-ticket', icon: HelpCircle },
    { name: 'Settings', path: '/regulator/settings', icon: Settings },
];

const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks];

// --- Main Regulator Layout Component ---
const RegulatorAppLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
                    <Outlet />
                </main>
            </div>
            <BottomNav />
        </div>
    );
};

// --- Sub-components ---
const Sidebar = () => {
    return (
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r">
            <div className="px-6 py-4"><h1 className="text-2xl font-bold text-green-700">LivestockIQ</h1></div>
            <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
                {allNavLinks.map(link => (
                    <NavLink
                        key={link.name}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2 text-gray-700 rounded-lg transition-colors duration-200 ${isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-gray-100'
                            }`
                        }
                    >
                        <link.icon className="w-5 h-5 mr-3" />
                        {link.name}
                    </NavLink>
                ))}
            </nav>
        </aside >
    );
};

const MobileHeader = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { logout } = useAuth();
    const location = useLocation();
    useEffect(() => { setIsDrawerOpen(false); }, [location]);

    return (
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-40">
            <h1 className="text-xl font-bold text-green-700">LivestockIQ</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(true)}><Menu className="w-6 h-6" /></Button>

            {/* Drawer Overlay */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsDrawerOpen(false)}
            ></div>

            {/* Drawer Content */}
            <div className={`fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-lg transform transition-transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold">Menu</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}><X className="w-6 h-6" /></Button>
                </div>
                <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                    {allNavLinks.map(link => (
                        <NavLink key={link.name} to={link.path} className={({ isActive }) => `flex items-center px-4 py-2 text-gray-700 rounded-lg ${isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-gray-100'}`}>
                            <link.icon className="w-5 h-5 mr-3" />{link.name}
                        </NavLink>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                    <button onClick={logout} className="flex items-center w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                        <LogOut className="w-5 h-5 mr-3" />Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

const BottomNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30">
        <div className="flex justify-around">
            {primaryNavLinks.map(link => (
                <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full py-2 text-xs transition-colors duration-200 ${isActive ? 'text-slate-800' : 'text-gray-500'
                        }`
                    }
                >
                    <link.icon className="w-5 h-5 mb-1" />
                    <span className="truncate px-1">{link.name}</span>
                </NavLink>
            ))}
        </div>
    </nav>
);

export default RegulatorAppLayout;