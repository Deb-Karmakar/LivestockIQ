// Mobile/src/navigation/FarmerTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import farmer screens
import DashboardScreen from '../screens/farmer/DashboardScreen';
import AnimalsScreen from '../screens/farmer/AnimalsScreen';
import AddAnimalScreen from '../screens/farmer/AddAnimalScreen';
import TreatmentsScreen from '../screens/farmer/TreatmentsScreen';
import SalesScreen from '../screens/farmer/SalesScreen';
import MoreScreen from '../screens/farmer/MoreScreen';

// Secondary screens (accessed from More)
import AlertsScreen from '../screens/farmer/AlertsScreen';
import MRLComplianceScreen from '../screens/farmer/MRLComplianceScreen';
import DrugInventoryScreen from '../screens/farmer/DrugInventoryScreen';
import FeedInventoryScreen from '../screens/farmer/FeedInventoryScreen';
import FeedAdminScreen from '../screens/farmer/FeedAdminScreen';
import ReportsScreen from '../screens/farmer/ReportsScreen';
import SupportScreen from '../screens/farmer/SupportScreen';
import SettingsScreen from '../screens/farmer/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Animals Stack Navigator
const AnimalsStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AnimalsList" component={AnimalsScreen} />
            <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
        </Stack.Navigator>
    );
};

// More Stack Navigator (contains all secondary screens)
const MoreStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#fff',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: '#1f2937',
                },
                headerTintColor: '#10b981',
            }}
        >
            <Stack.Screen
                name="MoreList"
                component={MoreScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Alerts"
                component={AlertsScreen}
                options={{ title: 'Alerts & Notifications' }}
            />
            <Stack.Screen
                name="MRLCompliance"
                component={MRLComplianceScreen}
                options={{ title: 'MRL Compliance' }}
            />
            <Stack.Screen
                name="DrugInventory"
                component={DrugInventoryScreen}
                options={{ title: 'Drug Inventory' }}
            />
            <Stack.Screen
                name="FeedInventory"
                component={FeedInventoryScreen}
                options={{ title: 'Feed Inventory' }}
            />
            <Stack.Screen
                name="FeedAdmin"
                component={FeedAdminScreen}
                options={{ title: 'Feed Administration' }}
            />
            <Stack.Screen
                name="Reports"
                component={ReportsScreen}
                options={{ title: 'Reports' }}
            />
            <Stack.Screen
                name="Support"
                component={SupportScreen}
                options={{ title: 'Support' }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Settings' }}
            />
        </Stack.Navigator>
    );
};

const FarmerTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'Animals') {
                        iconName = focused ? 'paw' : 'paw-outline';
                    } else if (route.name === 'Treatments') {
                        iconName = focused ? 'medical' : 'medical-outline';
                    } else if (route.name === 'Sales') {
                        iconName = focused ? 'cart' : 'cart-outline';
                    } else if (route.name === 'More') {
                        iconName = focused ? 'menu' : 'menu-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#10b981',
                tabBarInactiveTintColor: '#6b7280',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Animals" component={AnimalsStack} />
            <Tab.Screen name="Treatments" component={TreatmentsScreen} />
            <Tab.Screen name="Sales" component={SalesScreen} />
            <Tab.Screen name="More" component={MoreStack} />
        </Tab.Navigator>
    );
};

export default FarmerTabNavigator;
