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

const TreatmentsScreen = ({ navigation }) => {
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
            Alert.alert('Error', 'Failed to load treatments');
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
            case 'Approved': return '#10b981';
            case 'Pending': return '#f59e0b';
            case 'Rejected': return '#ef4444';
            default: return '#9ca3af';
        }
    };

    const getWithdrawalBadge = (info) => {
        switch (info.status) {
            case 'safe':
                return { color: '#10b981', bg: '#d1fae5', text: 'Safe for Sale', icon: 'shield-checkmark' };
            case 'ending_soon':
                return { color: '#f59e0b', bg: '#fef3c7', text: 'Ending Soon', icon: 'alert-circle' };
            case 'active':
                return { color: '#ef4444', bg: '#fee2e2', text: 'Active Withdrawal', icon: 'shield' };
            default:
                return { color: '#6b7280', bg: '#f3f4f6', text: 'Pending Vet', icon: 'time' };
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
            <TouchableOpacity style={styles.treatmentCard}>
                {/* Header: Drug Name & Approval Status */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="medkit" size={20} color="#3b82f6" />
                        </View>
                        <View>
                            <Text style={styles.drugName}>{item.drugName}</Text>
                            <Text style={styles.animalId}>ID: {item.animalId}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status}
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
                                {withdrawalInfo.daysLeft === 0 ? 'Withdrawal Complete' : `Day${withdrawalInfo.daysLeft > 1 ? 's' : ''} Left`}
                            </Text>
                        </View>
                        <View style={[styles.badgeContainer, { backgroundColor: badge.color }]}>
                            <Ionicons name={badge.icon} size={12} color="#fff" />
                            <Text style={styles.badgeText}>{badge.text}</Text>
                        </View>
                    </View>
                )}

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Dose</Text>
                        <Text style={styles.detailValue}>{item.dose || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Route</Text>
                        <Text style={styles.detailValue}>{item.route || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Start Date</Text>
                        <Text style={styles.detailValue}>
                            {new Date(item.startDate).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Vet Notes */}
                {item.vetNotes && (
                    <View style={styles.vetNotes}>
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#3b82f6" />
                        <Text style={styles.vetNotesText}>
                            <Text style={styles.vetNotesLabel}>Vet: </Text>
                            {item.vetNotes}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Treatment Records</Text>
                        <Text style={styles.headerSubtitle}>
                            {treatments.length} records • {treatments.filter(t => getWithdrawalInfo(t).status === 'active').length} active withdrawals
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.exportButton}
                        onPress={() => Alert.alert('Export', 'PDF Export feature coming soon!')}
                    >
                        <Ionicons name="download-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'active', label: 'Active Withdrawal' },
                        { id: 'safe', label: 'Safe for Sale' },
                        { id: 'pending', label: 'Pending Approval' }
                    ].map((f) => (
                        <TouchableOpacity
                            key={f.id}
                            style={[styles.filterButton, filter === f.id && styles.filterButtonActive]}
                            onPress={() => setFilter(f.id)}
                        >
                            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="medical" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No treatments found</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
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
        backgroundColor: '#f3f4f6',
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
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterButtonActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    filterText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#fff',
    },
    list: {
        padding: 16,
        paddingBottom: 80,
    },
    treatmentCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
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
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    drugName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    animalId: {
        fontSize: 13,
        color: '#6b7280',
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
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
        gap: 24,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    vetNotes: {
        marginTop: 12,
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        gap: 8,
    },
    vetNotesText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
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
        color: '#9ca3af',
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default TreatmentsScreen;
