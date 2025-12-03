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
import { useLanguage } from '../../contexts/LanguageContext';
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
    const { t } = useLanguage();
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
            Alert.alert(t('error'), t('failed_load_dashboard'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

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
            Alert.alert(t('success'), t('id_copied', { id: user.vetId }));
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
                <Text>{t('no_data')}</Text>
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
                            <Text style={styles.headerLabel}>{t('vet_dashboard')}</Text>
                        </View>
                        <Text style={styles.welcomeText}>{t('welcome_vet', { name: user?.fullName || 'Doctor' })}</Text>
                        <Text style={styles.subText}>
                            {t('dashboard_summary', { pendingCount: data.stats.pendingReviewCount, farmCount: data.stats.supervisedFarmsCount }).split(/<bold>(.*?)<\/bold>|<blue>(.*?)<\/blue>/).map((part, index) => {
                                if (!part) return null;
                                if (index === 1 || index === 4) return <Text key={index} style={styles.highlightText}>{part}</Text>;
                                if (index === 2 || index === 5) return <Text key={index} style={styles.highlightTextBlue}>{part}</Text>;
                                return <Text key={index}>{part}</Text>;
                            })}
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
                            <Text style={styles.idCardTitle}>{t('unique_vet_id')}</Text>
                            <Text style={styles.idCardSubtitle}>{t('share_connect')}</Text>
                        </View>
                    </View>
                    <View style={styles.idCardContent}>
                        <Text style={styles.vetIdText}>{user?.vetId || 'Loading...'}</Text>
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopyVetId}>
                            <Ionicons name="copy-outline" size={18} color="#fff" />
                            <Text style={styles.copyButtonText}>{t('copy_id')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title={t('pending_reviews')}
                        value={data.stats.pendingReviewCount}
                        color="#f97316"
                        subtitle={t('awaiting_approval')}
                        icon="clipboard"
                    />
                    <StatCard
                        title={t('total_prescriptions')}
                        value={data.stats.totalPrescriptions}
                        color="#10b981"
                        subtitle={t('approved_treatments')}
                        icon="medical"
                    />
                    <StatCard
                        title={t('supervised_farms')}
                        value={data.stats.supervisedFarmsCount}
                        color="#3b82f6"
                        subtitle={t('active_farms')}
                        icon="business"
                    />
                </View>

                {/* High Priority Reviews */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: '#ffedd5' }]}>
                            <Ionicons name="list" size={20} color="#ea580c" />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>{t('high_priority_reviews')}</Text>
                            <Text style={styles.sectionSubtitle}>{t('recent_treatments_attention')}</Text>
                        </View>
                    </View>

                    {data.highPriorityRequests.length > 0 ? (
                        data.highPriorityRequests.map((req) => (
                            <View key={req._id} style={styles.requestCard}>
                                <View>
                                    <Text style={styles.requestFarmer}>{req.farmerId.farmOwner}</Text>
                                    <Text style={styles.requestAnimal}>{t('animal_id', { id: req.animalId })}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.reviewButton}
                                    onPress={() => navigation.navigate('Requests')}
                                >
                                    <Text style={styles.reviewButtonText}>{t('review')}</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>{t('no_pending_requests')}</Text>
                            <Text style={styles.emptySubtext}>{t('all_caught_up')}</Text>
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
                            <Text style={styles.sectionTitle}>{t('approval_rate')}</Text>
                            <Text style={styles.sectionSubtitle}>{t('approval_stats')}</Text>
                        </View>
                    </View>
                    <View style={styles.complianceContent}>
                        <View style={styles.complianceRow}>
                            <Text style={styles.complianceValue}>{data.approvalRate}%</Text>
                            <Ionicons name="checkmark-circle" size={32} color="#bbf7d0" />
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${data.approvalRate}%` }]} />
                        </View>
                        <Text style={styles.complianceNote}>{t('approval_note')}</Text>
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
