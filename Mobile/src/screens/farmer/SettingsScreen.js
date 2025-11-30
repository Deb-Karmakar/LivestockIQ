// Mobile/src/screens/farmer/SettingsScreen.js
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const SettingsScreen = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const SettingsItem = ({ icon, title, subtitle, onPress, color = '#6b7280' }) => (
        <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color="#10b981" />
                    </View>
                    <Text style={styles.name}>{user?.farmOwner || 'Farmer'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    {user?.farmName && <Text style={styles.farm}>{user.farmName}</Text>}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <SettingsItem
                        icon="person-circle-outline"
                        title="Edit Profile"
                        subtitle="Update your personal information"
                        color="#10b981"
                    />
                    <SettingsItem
                        icon="lock-closed-outline"
                        title="Change Password"
                        subtitle="Update your password"
                        color="#3b82f6"
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    <SettingsItem
                        icon="notifications-outline"
                        title="Notifications"
                        subtitle="Manage notification settings"
                        color="#f59e0b"
                    />
                    <SettingsItem
                        icon="language-outline"
                        title="Language"
                        subtitle="English"
                        color="#8b5cf6"
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.card}>
                    <SettingsItem
                        icon="help-circle-outline"
                        title="Help Center"
                        subtitle="Get help and support"
                        color="#06b6d4"
                    />
                    <SettingsItem
                        icon="document-text-outline"
                        title="Terms & Privacy"
                        subtitle="Read our policies"
                        color="#6b7280"
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    profileSection: {
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    farm: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '500',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingsContent: {
        flex: 1,
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: 2,
    },
    settingsSubtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
        marginLeft: 8,
    },
    version: {
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 12,
        marginBottom: 40,
    },
});

export default SettingsScreen;
