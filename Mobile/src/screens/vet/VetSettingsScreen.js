// Mobile/src/screens/vet/VetSettingsScreen.js
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

const VetSettingsScreen = () => {
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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Ionicons name="medical" size={40} color="#3b82f6" />
                    </View>
                    <Text style={styles.name}>Dr. {user?.fullName || 'Veterinarian'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
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
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    profileSection: { alignItems: 'center' },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    name: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    email: { fontSize: 14, color: '#6b7280' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 20, padding: 16, borderRadius: 12, marginTop: 20, marginBottom: 20 },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444', marginLeft: 8 },
    version: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginBottom: 40 },
});

export default VetSettingsScreen;
