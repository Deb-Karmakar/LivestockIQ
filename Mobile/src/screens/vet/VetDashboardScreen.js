// Mobile/src/screens/vet/VetDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getTreatmentRequests } from '../../services/treatmentService';

const VetDashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pendingRequests: 0,
        approvedToday: 0,
        totalFarmers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const requests = await getTreatmentRequests();

            setStats({
                pendingRequests: requests.filter(r => r.status === 'Pending').length,
                approvedToday: requests.filter(r =>
                    r.status === 'Approved' &&
                    new Date(r.updatedAt).toDateString() === new Date().toDateString()
                ).length,
                totalFarmers: new Set(requests.map(r => r.farmerId)).size,
            });
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const StatCard = ({ icon, title, value, color, onPress }) => (
        <TouchableOpacity style={styles.statCard} onPress={onPress}>
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome, Dr.</Text>
                    <Text style={styles.vetName}>{user?.fullName || 'Veterinarian'}</Text>
                </View>
                <View style={styles.profileIcon}>
                    <Ionicons name="medical" size={24} color="#3b82f6" />
                </View>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    icon="clipboard"
                    title="Pending Requests"
                    value={stats.pendingRequests}
                    color="#f59e0b"
                    onPress={() => navigation.navigate('Requests')}
                />
                <StatCard
                    icon="checkmark-circle"
                    title="Approved Today"
                    value={stats.approvedToday}
                    color="#10b981"
                />
                <StatCard
                    icon="people"
                    title="Total Farmers"
                    value={stats.totalFarmers}
                    color="#3b82f6"
                    onPress={() => navigation.navigate('Farmers')}
                />
            </View>

            <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Requests')}
                >
                    <Ionicons name="clipboard" size={24} color="#3b82f6" />
                    <Text style={styles.actionText}>Review Treatment Requests</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Farmers')}
                >
                    <Ionicons name="people" size={24} color="#10b981" />
                    <Text style={styles.actionText}>View Farmer Directory</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#fff',
    },
    greeting: {
        fontSize: 16,
        color: '#6b7280',
    },
    vetName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 4,
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        margin: '1%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    quickActions: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 15,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    actionText: {
        fontSize: 16,
        color: '#1f2937',
        marginLeft: 12,
        fontWeight: '500',
    },
});

export default VetDashboardScreen;
