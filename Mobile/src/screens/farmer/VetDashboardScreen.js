import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getVetDashboardData } from '../../services/vetService';

const StatCard = ({ title, value, color, subtitle, icon }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
);

const VetDashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const dashboardData = await getVetDashboardData();
            setData(dashboardData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            Alert.alert('Error', 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleCopyVetId = () => {
        if (user?.vetId) {
            Clipboard.setString(user.vetId);
            Alert.alert('Success', `Vet ID (${user.vetId}) copied to clipboard`);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.container}>
                <Text>No data available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <View style={styles.headerTopRow}>
                            <Ionicons name="medkit" size={16} color="#60a5fa" />
                            <Text style={styles.headerLabel}>Veterinary Dashboard</Text>
                        </View>
                        <Text style={styles.welcomeText}>Welcome, {user?.fullName || 'Doctor'}!</Text>
                        <Text style={styles.subText}>
                            You have <Text style={styles.highlightText}>{data.stats.pendingReviewCount} pending reviews</Text> from <Text style={styles.highlightTextBlue}>{data.stats.assignedFarmersCount} assigned farmers</Text>.
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Vet ID Card */}
                <View style={styles.idCard}>
                    <View style={styles.idCardHeader}>
                        <View style={styles.idIconContainer}>
                            <Ionicons name="share-social" size={20} color="#2563eb" />
                        </View>
                        <View>
                            <Text style={styles.idCardTitle}>Your Unique Vet ID</Text>
                            <Text style={styles.idCardSubtitle}>Share with farmers to connect</Text>
                        </View>
                    </View>
                    <View style={styles.idCardContent}>
                        <Text style={styles.vetIdText}>{user?.vetId || 'Loading...'}</Text>
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopyVetId}>
                            <Ionicons name="copy-outline" size={18} color="#fff" />
                            <Text style={styles.copyButtonText}>Copy ID</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Pending Reviews"
                        value={data.stats.pendingReviewCount}
                        color="#f97316"
                        subtitle="Awaiting approval"
                        icon="clipboard"
                    />
                    <StatCard
                        title="Active Alerts"
                        value={data.stats.activeFarmAlertsCount}
                        color="#ef4444"
                        subtitle="Compliance issues"
                        icon="alert-circle"
                    />
                    <StatCard
                        title="Assigned Farmers"
                        value={data.stats.assignedFarmersCount}
                        color="#3b82f6"
                        subtitle="Under supervision"
                        icon="people"
                    />
                </View>

                {/* High Priority Reviews */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: '#ffedd5' }]}>
                            <Ionicons name="list" size={20} color="#ea580c" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>High-Priority Reviews</Text>
                            <Text style={styles.sectionSubtitle}>Recent treatments requiring attention</Text>
                        </View>
                    </View>

                    {data.highPriorityRequests.length > 0 ? (
                        data.highPriorityRequests.map((req) => (
                            <View key={req._id} style={styles.requestCard}>
                                <View>
                                    <Text style={styles.requestFarmer}>{req.farmerId.farmOwner}</Text>
                                    <Text style={styles.requestAnimal}>Animal ID: {req.animalId}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.reviewButton}
                                    onPress={() => navigation.navigate('Requests')}
                                >
                                    <Text style={styles.reviewButtonText}>Review</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>No pending requests</Text>
                            <Text style={styles.emptySubtext}>All caught up!</Text>
                        </View>
                    )}
                </View>

                {/* Compliance Card */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Overall Farm Compliance</Text>
                            <Text style={styles.sectionSubtitle}>Approval rate across assigned farms</Text>
                        </View>
                    </View>
                    <View style={styles.complianceContent}>
                        <View style={styles.complianceRow}>
                            <Text style={styles.complianceValue}>{data.complianceRate}%</Text>
                            <Ionicons name="checkmark-circle" size={32} color="#bbf7d0" />
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${data.complianceRate}%` }]} />
                        </View>
                        <Text style={styles.complianceNote}>Based on approved treatment records.</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerContent: {},
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    headerLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
    welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    subText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
    highlightText: { color: '#fb923c', fontWeight: '600' },
    highlightTextBlue: { color: '#60a5fa', fontWeight: '600' },
    content: { padding: 16 },
    idCard: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#dbeafe' },
    idCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    idIconContainer: { backgroundColor: '#dbeafe', padding: 8, borderRadius: 8 },
    idCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
    idCardSubtitle: { fontSize: 12, color: '#64748b' },
    idCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 8 },
    vetIdText: { fontSize: 18, fontWeight: 'bold', color: '#1e40af', letterSpacing: 1 },
    copyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
    copyButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    statCard: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    statIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    statTitle: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    statSubtitle: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    sectionIcon: { padding: 8, borderRadius: 8 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    sectionSubtitle: { fontSize: 12, color: '#6b7280' },
    requestCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    requestFarmer: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
    requestAnimal: { fontSize: 12, color: '#6b7280' },
    reviewButton: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    reviewButtonText: { fontSize: 12, fontWeight: '600', color: '#1f2937' },
    emptyState: { alignItems: 'center', padding: 24 },
    emptyText: { marginTop: 12, fontSize: 16, fontWeight: '600', color: '#4b5563' },
    emptySubtext: { fontSize: 12, color: '#9ca3af' },
    complianceContent: {},
    complianceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    complianceValue: { fontSize: 32, fontWeight: 'bold', color: '#16a34a' },
    progressBarBg: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%', backgroundColor: '#16a34a' },
    complianceNote: { fontSize: 12, color: '#9ca3af' },
});

export default VetDashboardScreen;
