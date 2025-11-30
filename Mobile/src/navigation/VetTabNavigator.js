// Mobile/src/navigation/VetTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import vet screens
import VetDashboardScreen from '../screens/vet/VetDashboardScreen';
import TreatmentRequestsScreen from '../screens/vet/TreatmentRequestsScreen';
import FarmerDirectoryScreen from '../screens/vet/FarmerDirectoryScreen';
import VetSettingsScreen from '../screens/vet/VetSettingsScreen';

const Tab = createBottomTabNavigator();

const VetTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'Requests') {
                        iconName = focused ? 'clipboard' : 'clipboard-outline';
                    } else if (route.name === 'Farmers') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#6b7280',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={VetDashboardScreen} />
            <Tab.Screen name="Requests" component={TreatmentRequestsScreen} />
            <Tab.Screen name="Farmers" component={FarmerDirectoryScreen} />
            <Tab.Screen name="Settings" component={VetSettingsScreen} />
        </Tab.Navigator>
    );
};

export default VetTabNavigator;
