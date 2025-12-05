import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// Screens
import DashboardScreen from '../screens/farmer/DashboardScreen';
import AnimalsScreen from '../screens/farmer/AnimalsScreen';
import AddAnimalScreen from '../screens/farmer/AddAnimalScreen';
import AnimalHistoryScreen from '../screens/farmer/AnimalHistoryScreen';
import TreatmentsScreen from '../screens/farmer/TreatmentsScreen';
import AddTreatmentScreen from '../screens/farmer/AddTreatmentScreen';
import AlertsScreen from '../screens/farmer/AlertsScreen';
import ReportsScreen from '../screens/farmer/ReportsScreen';
import MoreScreen from '../screens/farmer/MoreScreen';
import MRLComplianceScreen from '../screens/farmer/MRLComplianceScreen';
import InventoryScreen from '../screens/farmer/InventoryScreen';
import FeedInventoryScreen from '../screens/farmer/FeedInventoryScreen';
import FeedAdministrationScreen from '../screens/farmer/FeedAdministrationScreen';
import RaiseTicketScreen from '../screens/shared/RaiseTicketScreen';
import TicketHistoryScreen from '../screens/shared/TicketHistoryScreen';
import SettingsScreen from '../screens/farmer/SettingsScreen';
import SalesScreen from '../screens/farmer/SalesScreen';
import ChatbotScreen from '../screens/farmer/ChatbotScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AnimalsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AnimalsList" component={AnimalsScreen} />
        <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
        <Stack.Screen name="AnimalHistory" component={AnimalHistoryScreen} />
    </Stack.Navigator>
);

const TreatmentsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TreatmentsList" component={TreatmentsScreen} />
        <Stack.Screen name="AddTreatment" component={AddTreatmentScreen} />
    </Stack.Navigator>
);

const MoreStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MoreList" component={MoreScreen} />
        <Stack.Screen name="Treatments" component={TreatmentsStack} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="MRLCompliance" component={MRLComplianceScreen} />
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        <Stack.Screen name="FeedInventory" component={FeedInventoryScreen} />
        <Stack.Screen name="FeedAdmin" component={FeedAdministrationScreen} />
        <Stack.Screen name="RaiseTicket" component={RaiseTicketScreen} />
        <Stack.Screen name="TicketHistory" component={TicketHistoryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Sales" component={SalesScreen} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />
    </Stack.Navigator>
);

const FarmerTabNavigator = () => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Animals') {
                        iconName = focused ? 'paw' : 'paw-outline';
                    } else if (route.name === 'Alerts') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
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
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t('home') }} />
            <Tab.Screen name="Animals" component={AnimalsStack} options={{ tabBarLabel: t('animals') }} />
            <Tab.Screen name="Alerts" component={AlertsScreen} options={{ tabBarLabel: t('alerts') }} />
            <Tab.Screen name="More" component={MoreStack} options={{ tabBarLabel: t('menu') }} />
        </Tab.Navigator>
    );
};

export default FarmerTabNavigator;