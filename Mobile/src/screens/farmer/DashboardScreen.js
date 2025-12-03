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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getAnimals } from '../../services/animalService';
import { getTreatments } from '../../services/treatmentService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
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
                    color: theme.warning,
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
                        color: daysLeft <= 2 ? theme.error : theme.warning,
                    });
                }
            }
        });

        return alertsList.slice(0, 4);
    }, [treatments, theme]);

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
                color: theme.info,
            }));
    }, [treatments, theme]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('good_morning');
        if (hour < 18) return t('good_afternoon');
        return t('good_evening');
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ${t('ago')}`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ${t('ago')}`;
        const days = Math.floor(hours / 24);
        return `${days}d ${t('ago')}`;
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.subtext }]}>{t('loading_dashboard')}</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.primary} />
            }
        >
            {/* Header – now using the same LinearGradient banner as VetDashboard */}
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.headerLinear}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <Ionicons name="paw" size={16} color="#60a5fa" />
                        <Text style={styles.headerLabel}>{t('farmer_dashboard') || 'Farmer Dashboard'}</Text>
                    </View>

                    <Text style={[styles.greeting, { color: '#fff' }]}>
                        {getGreeting()}, {user?.farmOwner?.split(' ')[0] || 'Farmer'}!
                    </Text>
                    <Text style={[styles.farmName, { color: '#60a5fa' }]}>{user?.farmName || t('your_farm')}</Text>
                    <Text style={[styles.alertsTextGradient, { color: '#cbd5e1' }]}>
                        You have <Text style={[styles.alertsCountGradient, { color: theme.warning }]}>{alerts.length} alerts</Text> {t('alerts_attention')}
                    </Text>
                </View>
            </LinearGradient>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${theme.info}20` }]}>
                        <Ionicons name="paw" size={20} color={theme.info} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalAnimals}</Text>
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('total_animals')}</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${theme.success}20` }]}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.safeForSale}</Text>
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('safe_for_sale')}</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${theme.warning}20` }]}>
                        <Ionicons name="medical" size={20} color={theme.warning} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.activeTreatments}</Text>
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('active_treatments')}</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${theme.primary}20` }]}>
                        <Ionicons name="time" size={20} color={theme.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.pendingApproval}</Text>
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('pending_approval')}</Text>
                </View>
            </View>

            {/* Urgent Alerts */}
            {alerts.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="notifications" size={20} color={theme.error} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('urgent_alerts')}</Text>
                        <View style={[styles.badge, { backgroundColor: theme.error }]}>
                            <Text style={styles.badgeText}>{alerts.length}</Text>
                        </View>
                    </View>
                    <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        {alerts.map((alert, index) => (
                            <View
                                key={alert.id}
                                style={[
                                    styles.alertItem,
                                    index < alerts.length - 1 && [styles.alertItemBorder, { borderBottomColor: theme.border }],
                                ]}
                            >
                                <View style={[styles.alertDot, { backgroundColor: alert.color }]} />
                                <View style={styles.alertContent}>
                                    <Text style={[styles.alertTitle, { color: theme.text }]}>{alert.title}</Text>
                                    <Text style={[styles.alertDescription, { color: theme.subtext }]}>{alert.description}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Recent Activity */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="pulse" size={20} color={theme.info} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('recent_activity')}</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                            <View
                                key={`${activity.id}-${index}`}
                                style={[
                                    styles.activityItem,
                                    index < recentActivity.length - 1 && [styles.activityItemBorder, { borderBottomColor: theme.border }],
                                ]}
                            >
                                <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
                                    <Ionicons name={activity.icon} size={16} color={activity.color} />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={[styles.activityId, { color: theme.text }]}>{activity.id}</Text>
                                    <Text style={[styles.activityTask, { color: theme.subtext }]}>{activity.task}</Text>
                                    <Text style={[styles.activityTime, { color: theme.subtext }]}>{formatTimeAgo(activity.date)}</Text>
                                </View>
                                <View style={[styles.activityBadge, { backgroundColor: `${theme.info}20` }]}>
                                    <Text style={[styles.activityBadgeText, { color: theme.info }]}>{activity.type}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="pulse-outline" size={48} color={theme.border} />
                            <Text style={[styles.emptyStateText, { color: theme.subtext }]}>{t('no_recent_activity')}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="flash" size={20} color={theme.success} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('quick_actions')}</Text>
                </View>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickActionButton, { backgroundColor: theme.card, shadowColor: theme.text }]}
                        onPress={() => navigation.navigate('Animals')}
                    >
                        <Ionicons name="paw" size={24} color={theme.success} />
                        <Text style={[styles.quickActionText, { color: theme.text }]}>{t('manage_animals')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickActionButton, { backgroundColor: theme.card, shadowColor: theme.text }]}
                        onPress={() => navigation.navigate('Treatments')}
                    >
                        <Ionicons name="medical" size={24} color={theme.info} />
                        <Text style={[styles.quickActionText, { color: theme.text }]}>{t('record_treatment')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        <Ionicons name="cube" size={24} color={theme.primary} />
                        <Text style={[styles.quickActionText, { color: theme.text }]}>{t('record_sale')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        <Ionicons name="notifications" size={24} color={theme.warning} />
                        <Text style={[styles.quickActionText, { color: theme.text }]}>{t('view_alerts')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },

    /* Header styles now aligned with vet dashboard header */
    headerLinear: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerContent: {},
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    headerLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },

    headerGradient: {
        gap: 8,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    farmName: {
        fontSize: 16,
        fontWeight: '600',
    },
    alertsText: {
        fontSize: 14,
        marginTop: 4,
    },
    alertsTextGradient: {
        fontSize: 14,
        marginTop: 6,
    },
    alertsCount: {
        fontWeight: '600',
    },
    alertsCountGradient: {
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
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
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
    },
    statLabel: {
        fontSize: 12,
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
        flex: 1,
    },
    badge: {
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
        borderRadius: 16,
        padding: 16,
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
        marginBottom: 2,
    },
    alertDescription: {
        fontSize: 12,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    activityItemBorder: {
        borderBottomWidth: 1,
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
    },
    activityTask: {
        fontSize: 12,
        marginTop: 2,
    },
    activityTime: {
        fontSize: 11,
        marginTop: 4,
    },
    activityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    activityBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyStateText: {
        fontSize: 14,
        marginTop: 12,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionButton: {
        width: (width - 42) / 2,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        gap: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default DashboardScreen;
