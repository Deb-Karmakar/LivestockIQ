import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const menuItems = [
        { label: 'Products', hasDropdown: true },
        { label: 'Solutions', hasDropdown: true },
        { label: 'Resources', hasDropdown: true },
        { label: 'Pricing', hasDropdown: false },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <div 
                            className="flex-shrink-0 cursor-pointer" 
                            onClick={() => navigate('/')}
                        >
                            <h1 className="text-2xl font-bold text-primary" data-testid="logo">
                                LivestockIQ
                            </h1>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            {menuItems.map((item) => (
                                <button
                                    key={item.label}
                                    className="flex items-center text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors hover-elevate"
                                    data-testid={`nav-${item.label.toLowerCase()}`}
                                    onClick={() => console.log(`${item.label} clicked`)}
                                >
                                    {item.label}
                                    {item.hasDropdown && <ChevronDown className="ml-1 h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Button variant="ghost" data-testid="button-login" onClick={() => navigate('/login')}>
                            Log In
                        </Button>
                        <Button data-testid="button-join" onClick={() => navigate('/register')}>
                            Join Now
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            data-testid="button-mobile-menu"
                        >
                            {/* THIS LINE IS NOW FIXED */}
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border">
                            {menuItems.map((item) => (
                                <button
                                    key={item.label}
                                    className="flex items-center justify-between text-gray-700 hover:text-primary block px-3 py-2 text-base font-medium w-full text-left transition-colors hover-elevate"
                                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                                    onClick={() => console.log(`${item.label} clicked`)}
                                >
                                    {item.label}
                                    {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                                </button>
                            ))}
                            <div className="pt-4 pb-3 border-t border-border">
                                <div className="flex flex-col space-y-3">
                                    <Button
                                        variant="ghost"
                                        className="justify-start"
                                        data-testid="mobile-button-login"
                                        onClick={() => navigate('/login')}
                                    >
                                        Log In
                                    </Button>
                                    <Button
                                        className="justify-start"
                                        data-testid="mobile-button-join"
                                        onClick={() => navigate('/register')}
                                    >
                                        Join Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navigation;