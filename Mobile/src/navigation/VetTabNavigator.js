import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import VetDashboardScreen from '../screens/vet/VetDashboardScreen';
import TreatmentRequestsScreen from '../screens/vet/TreatmentRequestsScreen';
import FarmerDirectoryScreen from '../screens/vet/FarmerDirectoryScreen';
import VetMoreScreen from '../screens/vet/VetMoreScreen';
import VetSettingsScreen from '../screens/vet/VetSettingsScreen';
import AnimalHistoryScreen from '../screens/farmer/AnimalHistoryScreen';
import FeedAdministrationRequestsScreen from '../screens/vet/FeedAdministrationRequestsScreen';
import RaiseTicketScreen from '../screens/shared/RaiseTicketScreen';
import TicketHistoryScreen from '../screens/shared/TicketHistoryScreen';
import VetReportsScreen from '../screens/vet/VetReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stacks for tabs that might need navigation
const DashboardStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="VetDashboard" component={VetDashboardScreen} />
    </Stack.Navigator>
);

const RequestsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TreatmentRequests" component={TreatmentRequestsScreen} />
        <Stack.Screen name="AnimalHistory" component={AnimalHistoryScreen} />
    </Stack.Navigator>
);

const MoreStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="VetMore" component={VetMoreScreen} />
        <Stack.Screen name="Settings" component={VetSettingsScreen} />
        <Stack.Screen name="Reports" component={VetReportsScreen} />
        <Stack.Screen name="FeedRequests" component={VetPlaceholderScreen} />
        <Stack.Screen name="RaiseTicket" component={RaiseTicketScreen} />
        <Stack.Screen name="TicketHistory" component={TicketHistoryScreen} />
    </Stack.Navigator>
);

const FeedStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FeedRequests" component={FeedAdministrationRequestsScreen} />
        <Stack.Screen name="AnimalHistory" component={AnimalHistoryScreen} />
    </Stack.Navigator>
);

const VetTabNavigator = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'Requests') {
                        iconName = focused ? 'clipboard' : 'clipboard-outline';
                    } else if (route.name === 'Feed') {
                        iconName = focused ? 'nutrition' : 'nutrition-outline';
                    } else if (route.name === 'Farmers') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'More') {
                        iconName = focused ? 'menu' : 'menu-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.subtext,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                },
                headerShown: false,
                tabBarLabel: (() => {
                    switch (route.name) {
                        case 'Dashboard': return t('nav_dashboard');
                        case 'Requests': return t('nav_requests');
                        case 'Feed': return t('nav_feed');
                        case 'Farmers': return t('nav_farmers');
                        case 'More': return t('nav_more');
                        default: return route.name;
                    }
                })(),
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardStack} />
            <Tab.Screen name="Requests" component={RequestsStack} />
            <Tab.Screen name="Feed" component={FeedStack} />
            <Tab.Screen name="Farmers" component={FarmerDirectoryScreen} />
            <Tab.Screen name="More" component={MoreStack} />
        </Tab.Navigator>
    );
};

export default VetTabNavigator;
