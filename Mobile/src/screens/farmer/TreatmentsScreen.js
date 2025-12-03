// Mobile/src/screens/farmer/TreatmentsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTreatments } from '../../services/treatmentService';
import { differenceInDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const TreatmentsScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, active, pending, safe

    useEffect(() => {
        fetchTreatments();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchTreatments();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchTreatments = async () => {
        try {
            setLoading(true);
            const data = await getTreatments();
            setTreatments(Array.isArray(data) ? data : []);
        } catch (error) {
            Alert.alert(t('error'), t('failed_load_treatments'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTreatments();
    };

    const getWithdrawalInfo = (treatment) => {
        if (!treatment.withdrawalEndDate) return { status: 'pending', daysLeft: 'N/A' };
        const endDate = new Date(treatment.withdrawalEndDate);
        const daysLeft = differenceInDays(endDate, new Date());
        let status;
        if (daysLeft < 0) status = 'safe';
        else if (daysLeft <= 5) status = 'ending_soon';
        else status = 'active';
        return { status, daysLeft: daysLeft > 0 ? daysLeft : 0 };
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return theme.success;
            case 'Pending': return theme.warning;
            case 'Rejected': return theme.error;
            default: return theme.subtext;
        }
    };

    const getWithdrawalBadge = (info) => {
        switch (info.status) {
            case 'safe':
                return { color: theme.success, bg: `${theme.success}20`, text: t('safe_for_sale'), icon: 'shield-checkmark' };
            case 'ending_soon':
                return { color: theme.warning, bg: `${theme.warning}20`, text: t('ending_soon'), icon: 'alert-circle' };
            case 'active':
                return { color: theme.error, bg: `${theme.error}20`, text: t('active_withdrawal'), icon: 'shield' };
            default:
                return { color: theme.subtext, bg: theme.background, text: t('pending_vet'), icon: 'time' };
        }
    };

    const filteredTreatments = treatments.filter((t) => {
        if (filter === 'all') return true;
        const info = getWithdrawalInfo(t);
        if (filter === 'active') return info.status === 'active';
        if (filter === 'safe') return info.status === 'safe';
        if (filter === 'pending') return t.status === 'Pending';
        return true;
    });

    const renderTreatment = ({ item }) => {
        const withdrawalInfo = getWithdrawalInfo(item);
        const badge = getWithdrawalBadge(withdrawalInfo);

        return (
            <TouchableOpacity style={[styles.treatmentCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                {/* Header: Drug Name & Approval Status */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}20` }]}>
                            <Ionicons name="medkit" size={20} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.drugName, { color: theme.text }]}>{item.drugName}</Text>
                            <Text style={[styles.animalId, { color: theme.subtext }]}>ID: {item.animalId}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {t(item.status.toLowerCase()) || item.status}
                        </Text>
                    </View>
                </View>

                {/* Withdrawal Banner */}
                {withdrawalInfo.status !== 'pending' && (
                    <View style={[styles.withdrawalBanner, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                        <View style={styles.bannerContent}>
                            <Text style={[styles.daysLeft, { color: badge.color }]}>
                                {withdrawalInfo.daysLeft === 0 ? '✓' : withdrawalInfo.daysLeft}
                            </Text>
                            <Text style={[styles.daysLabel, { color: badge.color }]}>
                                {withdrawalInfo.daysLeft === 0 ? t('withdrawal_complete') : `${t('days_left')}`}
                            </Text>
                        </View>
                        <View style={[styles.badgeContainer, { backgroundColor: badge.color }]}>
                            <Ionicons name={badge.icon} size={12} color="#fff" />
                            <Text style={styles.badgeText}>{badge.text}</Text>
                        </View>
                    </View>
                )}

                {/* Details Grid */}
                <View style={[styles.detailsGrid, { borderTopColor: theme.border }]}>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('dose')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{item.dose || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('route')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{item.route || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('start_date')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                            {new Date(item.startDate).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Vet Notes */}
                {item.vetNotes && (
                    <View style={[styles.vetNotes, { backgroundColor: `${theme.primary}10` }]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.primary} />
                        <Text style={[styles.vetNotesText, { color: theme.primary }]}>
                            <Text style={styles.vetNotesLabel}>{t('vet_label')} </Text>
                            {item.vetNotes}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>{t('treatment_records')}</Text>
                        <Text style={styles.headerSubtitle}>
                            {treatments.length} records • {treatments.filter(t => getWithdrawalInfo(t).status === 'active').length} {t('active_withdrawals')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.exportButton}
                        onPress={() => Alert.alert('Export', t('export_pdf'))}
                    >
                        <Ionicons name="download-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={[styles.filterContainer, { backgroundColor: theme.card }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'active', label: t('active_withdrawal') },
                        { id: 'safe', label: t('safe_for_sale') },
                        { id: 'pending', label: t('pending_approval') }
                    ].map((f) => (
                        <TouchableOpacity
                            key={f.id}
                            style={[
                                styles.filterButton,
                                { backgroundColor: theme.background, borderColor: theme.border },
                                filter === f.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                            onPress={() => setFilter(f.id)}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: theme.subtext },
                                filter === f.id && { color: '#fff' }
                            ]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredTreatments}
                keyExtractor={(item) => item._id}
                renderItem={renderTreatment}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="medical" size={64} color={theme.border} />
                        <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_treatments_found')}</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                onPress={() => navigation.navigate('AddTreatment')}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
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
    header: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    exportButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
    },
    list: {
        padding: 16,
        paddingBottom: 80,
    },
    treatmentCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    drugName: {
        fontSize: 16,
        fontWeight: '700',
    },
    animalId: {
        fontSize: 13,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    withdrawalBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    daysLeft: {
        fontSize: 20,
        fontWeight: '800',
    },
    daysLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    detailsGrid: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingTop: 12,
        gap: 24,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        marginBottom: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    vetNotes: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        gap: 8,
    },
    vetNotesText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    vetNotesLabel: {
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default TreatmentsScreen;
