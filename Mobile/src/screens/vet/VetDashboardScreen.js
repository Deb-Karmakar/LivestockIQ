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
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { getVetDashboardData } from '../../services/vetService';

const StatCard = ({ title, value, color, subtitle, icon, theme }) => (
    <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.subtext }]}>{title}</Text>
        <Text style={[styles.statSubtitle, { color: theme.subtext }]}>{subtitle}</Text>
    </View>
);

const VetDashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { isConnected } = useNetwork();
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
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>{t('no_data')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
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
                {!isConnected && (
                    <Text style={{ textAlign: 'center', color: theme.warning, marginTop: 8, fontSize: 12 }}>
                        {t('offline_mode_cached_data')}
                    </Text>
                )}
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} enabled={isConnected} />}
            >
                {/* Vet ID Card */}
                <View style={[styles.idCard, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }]}>
                    <View style={styles.idCardHeader}>
                        <View style={[styles.idIconContainer, { backgroundColor: `${theme.primary}20` }]}>
                            <Ionicons name="share-social" size={20} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.idCardTitle, { color: theme.primary }]}>{t('unique_vet_id')}</Text>
                            <Text style={[styles.idCardSubtitle, { color: theme.subtext }]}>{t('share_connect')}</Text>
                        </View>
                    </View>
                    <View style={[styles.idCardContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.vetIdText, { color: theme.primary }]}>{user?.vetId || 'Loading...'}</Text>
                        <TouchableOpacity style={[styles.copyButton, { backgroundColor: theme.primary }]} onPress={handleCopyVetId}>
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
                        color={theme.warning}
                        subtitle={t('awaiting_approval')}
                        icon="clipboard"
                        theme={theme}
                    />
                    <StatCard
                        title={t('total_prescriptions')}
                        value={data.stats.totalPrescriptions}
                        color={theme.success}
                        subtitle={t('approved_treatments')}
                        icon="medical"
                        theme={theme}
                    />
                    <StatCard
                        title={t('supervised_farms')}
                        value={data.stats.supervisedFarmsCount}
                        color={theme.info}
                        subtitle={t('active_farms')}
                        icon="business"
                        theme={theme}
                    />
                </View>

                {/* High Priority Reviews */}
                <View style={[styles.section, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                    <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
                        <View style={[styles.sectionIcon, { backgroundColor: `${theme.warning}20` }]}>
                            <Ionicons name="list" size={20} color={theme.warning} />
                        </View>
                        <View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('high_priority_reviews')}</Text>
                            <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>{t('recent_treatments_attention')}</Text>
                        </View>
                    </View>

                    {data.highPriorityRequests.length > 0 ? (
                        data.highPriorityRequests.map((req) => (
                            <View key={req._id} style={[styles.requestCard, { borderBottomColor: theme.border }]}>
                                <View>
                                    <Text style={[styles.requestFarmer, { color: theme.text }]}>{req.farmerId.farmOwner}</Text>
                                    <Text style={[styles.requestAnimal, { color: theme.subtext }]}>{t('animal_id', { id: req.animalId })}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.reviewButton, { backgroundColor: theme.background }]}
                                    onPress={() => navigation.navigate('Requests')}
                                >
                                    <Text style={[styles.reviewButtonText, { color: theme.text }]}>{t('review')}</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={48} color={theme.subtext} />
                            <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_pending_requests')}</Text>
                            <Text style={[styles.emptySubtext, { color: theme.subtext }]}>{t('all_caught_up')}</Text>
                        </View>
                    )}
                </View>

                {/* Compliance Card */}
                <View style={[styles.section, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                    <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
                        <View style={[styles.sectionIcon, { backgroundColor: `${theme.success}20` }]}>
                            <Ionicons name="shield-checkmark" size={20} color={theme.success} />
                        </View>
                        <View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('approval_rate')}</Text>
                            <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>{t('approval_stats')}</Text>
                        </View>
                    </View>
                    <View style={styles.complianceContent}>
                        <View style={styles.complianceRow}>
                            <Text style={[styles.complianceValue, { color: theme.success }]}>{data.approvalRate}%</Text>
                            <Ionicons name="checkmark-circle" size={32} color={`${theme.success}50`} />
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.background }]}>
                            <View style={[styles.progressBarFill, { width: `${data.approvalRate}%`, backgroundColor: theme.success }]} />
                        </View>
                        <Text style={[styles.complianceNote, { color: theme.subtext }]}>{t('approval_note')}</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    idCard: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
    idCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    idIconContainer: { padding: 8, borderRadius: 8 },
    idCardTitle: { fontSize: 16, fontWeight: 'bold' },
    idCardSubtitle: { fontSize: 12 },
    idCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8 },
    vetIdText: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    copyButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
    copyButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    statCard: { width: '48%', padding: 16, borderRadius: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    statIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    statTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
    statSubtitle: { fontSize: 10, marginTop: 2 },
    section: { borderRadius: 12, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1 },
    sectionIcon: { padding: 8, borderRadius: 8 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold' },
    sectionSubtitle: { fontSize: 12 },
    requestCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    requestFarmer: { fontSize: 14, fontWeight: '600' },
    requestAnimal: { fontSize: 12 },
    reviewButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    reviewButtonText: { fontSize: 12, fontWeight: '600' },
    emptyState: { alignItems: 'center', padding: 24 },
    emptyText: { marginTop: 12, fontSize: 16, fontWeight: '600' },
    emptySubtext: { fontSize: 12 },
    complianceContent: {},
    complianceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    complianceValue: { fontSize: 32, fontWeight: 'bold' },
    progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%' },
    complianceNote: { fontSize: 12 },
});

export default VetDashboardScreen;
