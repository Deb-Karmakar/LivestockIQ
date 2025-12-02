// Mobile/src/screens/farmer/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAnimals } from '../../services/animalService';
import { getTreatments } from '../../services/treatmentService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [animals, setAnimals] = useState([]);
    const [treatments, setTreatments] = useState([]);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [animalsData, treatmentsData] = await Promise.all([
                getAnimals(),
                getTreatments(),
            ]);

            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setTreatments(Array.isArray(treatmentsData) ? treatmentsData : []);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate statistics based on mrlStatus
    const stats = React.useMemo(() => {
        const safeAnimals = animals.filter(a => a.mrlStatus === 'SAFE');
        const withdrawalActive = animals.filter(a => a.mrlStatus === 'WITHDRAWAL_ACTIVE');
        const needingTests = animals.filter(a =>
            a.mrlStatus === 'TEST_REQUIRED' || a.mrlStatus === 'PENDING_VERIFICATION'
        );

        return {
            totalAnimals: animals.length,
            activeTreatments: withdrawalActive.length,
            safeForSale: safeAnimals.length,
            pendingApproval: needingTests.length,
        };
    }, [animals]);

    // Calculate urgent alerts
    const alerts = React.useMemo(() => {
        const alertsList = [];
        const now = new Date();

        treatments.forEach((t) => {
            if (t.status === 'Pending') {
                alertsList.push({
                    id: t._id,
                    severity: 'warning',
                    title: 'Pending Vet Approval',
                    description: `Treatment for ${t.animalId} needs signature`,
                    color: '#f59e0b',
                });
            }

            if (t.status === 'Approved' && t.withdrawalEndDate) {
                const daysLeft = Math.ceil(
                    (new Date(t.withdrawalEndDate) - now) / (1000 * 60 * 60 * 24)
                );
                if (daysLeft >= 0 && daysLeft <= 7) {
                    alertsList.push({
                        id: `${t._id}-wd`,
                        severity: daysLeft <= 2 ? 'critical' : 'warning',
                        title: 'Withdrawal Ending Soon',
                        description: `Animal ${t.animalId} safe in ${daysLeft} days`,
                        color: daysLeft <= 2 ? '#ef4444' : '#f59e0b',
                    });
                }
            }
        });

        return alertsList.slice(0, 4);
    }, [treatments]);

    // Recent activity
    const recentActivity = React.useMemo(() => {
        return treatments
            .filter((t) => t.status === 'Approved')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5)
            .map((t) => ({
                id: t.animalId,
                task: `Treated with ${t.drugName}`,
                type: 'Treatment',
                date: t.updatedAt,
                icon: 'medical',
                color: '#3b82f6',
            }));
    }, [treatments]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerGradient}>
                    <Text style={styles.greeting}>
                        {getGreeting()}, {user?.farmOwner?.split(' ')[0] || 'Farmer'}!
                    </Text>
                    <Text style={styles.farmName}>{user?.farmName || 'Your Farm'}</Text>
                    <Text style={styles.alertsText}>
                        You have <Text style={styles.alertsCount}>{alerts.length} alerts</Text> that need attention
                    </Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#3b82f620' }]}>
                        <Ionicons name="paw" size={20} color="#3b82f6" />
                    </View>
                    <Text style={styles.statValue}>{stats.totalAnimals}</Text>
                    <Text style={styles.statLabel}>Total Animals</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#10b98120' }]}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    </View>
                    <Text style={styles.statValue}>{stats.safeForSale}</Text>
                    <Text style={styles.statLabel}>Safe for Sale</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b20' }]}>
                        <Ionicons name="medical" size={20} color="#f59e0b" />
                    </View>
                    <Text style={styles.statValue}>{stats.activeTreatments}</Text>
                    <Text style={styles.statLabel}>Active Treatments</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#a855f720' }]}>
                        <Ionicons name="time" size={20} color="#a855f7" />
                    </View>
                    <Text style={styles.statValue}>{stats.pendingApproval}</Text>
                    <Text style={styles.statLabel}>Pending Approval</Text>
                </View>
            </View>

            {/* Urgent Alerts */}
            {alerts.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="notifications" size={20} color="#ef4444" />
                        <Text style={styles.sectionTitle}>Urgent Alerts</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{alerts.length}</Text>
                        </View>
                    </View>
                    <View style={styles.card}>
                        {alerts.map((alert, index) => (
                            <View
                                key={alert.id}
                                style={[
                                    styles.alertItem,
                                    index < alerts.length - 1 && styles.alertItemBorder,
                                ]}
                            >
                                <View style={[styles.alertDot, { backgroundColor: alert.color }]} />
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertTitle}>{alert.title}</Text>
                                    <Text style={styles.alertDescription}>{alert.description}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Recent Activity */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="pulse" size={20} color="#3b82f6" />
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                </View>
                <View style={styles.card}>
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                            <View
                                key={`${activity.id}-${index}`}
                                style={[
                                    styles.activityItem,
                                    index < recentActivity.length - 1 && styles.activityItemBorder,
                                ]}
                            >
                                <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
                                    <Ionicons name={activity.icon} size={16} color={activity.color} />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityId}>{activity.id}</Text>
                                    <Text style={styles.activityTask}>{activity.task}</Text>
                                    <Text style={styles.activityTime}>{formatTimeAgo(activity.date)}</Text>
                                </View>
                                <View style={styles.activityBadge}>
                                    <Text style={styles.activityBadgeText}>{activity.type}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="pulse-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyStateText}>No recent activity</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="flash" size={20} color="#10b981" />
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => navigation.navigate('Animals')}
                    >
                        <Ionicons name="paw" size={24} color="#10b981" />
                        <Text style={styles.quickActionText}>Manage Animals</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => navigation.navigate('Treatments')}
                    >
                        <Ionicons name="medical" size={24} color="#3b82f6" />
                        <Text style={styles.quickActionText}>Record Treatment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <Ionicons name="cube" size={24} color="#a855f7" />
                        <Text style={styles.quickActionText}>Record Sale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <Ionicons name="notifications" size={24} color="#f59e0b" />
                        <Text style={styles.quickActionText}>View Alerts</Text>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: '#f3f4f6',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    header: {
        backgroundColor: '#1e293b',
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerGradient: {
        gap: 8,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    farmName: {
        fontSize: 16,
        color: '#10b981',
        fontWeight: '600',
    },
    alertsText: {
        fontSize: 14,
        color: '#cbd5e1',
        marginTop: 4,
    },
    alertsCount: {
        color: '#fbbf24',
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 15,
        gap: 12,
    },
    statCard: {
        width: (width - 42) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 4,
    },
    section: {
        padding: 15,
        paddingTop: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    badge: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    alertItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    alertDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    alertDescription: {
        fontSize: 12,
        color: '#6b7280',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    activityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    activityTask: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    activityTime: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 4,
    },
    activityBadge: {
        backgroundColor: '#3b82f620',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    activityBadgeText: {
        fontSize: 11,
        color: '#3b82f6',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 12,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionButton: {
        width: (width - 42) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        gap: 8,
    },
    quickActionText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default DashboardScreen;
