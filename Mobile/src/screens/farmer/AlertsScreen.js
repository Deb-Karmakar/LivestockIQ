// Mobile/src/screens/farmer/AlertsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Modal,
    Dimensions,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTreatments } from '../../services/treatmentService';
import { getMyHighAmuAlerts } from '../../services/farmerService';
import { differenceInDays, format } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');

const SeverityBadge = ({ severity }) => {
    let bg, text, border;
    switch (severity) {
        case 'Low':
            bg = '#dcfce7'; text = '#166534'; border = '#bbf7d0'; break;
        case 'Medium':
            bg = '#fef9c3'; text = '#854d0e'; border = '#fde047'; break;
        case 'High':
            bg = '#ffedd5'; text = '#9a3412'; border = '#fed7aa'; break;
        case 'Critical':
            bg = '#fee2e2'; text = '#991b1b'; border = '#fecaca'; break;
        default:
            bg = '#f3f4f6'; text = '#374151'; border = '#e5e7eb';
    }

    return (
        <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.badgeText, { color: text }]}>{severity}</Text>
        </View>
    );
};

const AlertsScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [treatments, setTreatments] = useState([]);
    const [amuAlerts, setAmuAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('amu');
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const getAmuAlertConfig = (type) => {
        const configs = {
            HISTORICAL_SPIKE: {
                icon: 'trending-up',
                color: '#f97316', // orange-500
                label: t('historical_spike'),
                description: t('historical_spike_desc')
            },
            PEER_COMPARISON_SPIKE: {
                icon: 'pulse',
                color: '#eab308', // yellow-500
                label: t('peer_comparison'),
                description: t('peer_comparison_desc')
            },
            ABSOLUTE_THRESHOLD: {
                icon: 'warning',
                color: '#ef4444', // red-500
                label: t('absolute_limit'),
                description: t('absolute_limit_desc')
            },
            TREND_INCREASE: {
                icon: 'trending-up',
                color: '#3b82f6', // blue-500
                label: t('upward_trend'),
                description: t('upward_trend_desc')
            },
            CRITICAL_DRUG_USAGE: {
                icon: 'shield',
                color: '#a855f7', // purple-500
                label: t('critical_drugs'),
                description: t('critical_drugs_desc')
            },
            SUSTAINED_HIGH_USAGE: {
                icon: 'notifications',
                color: '#ef4444', // red-500
                label: t('sustained_high_use'),
                description: t('sustained_high_use_desc')
            }
        };
        return configs[type] || configs.ABSOLUTE_THRESHOLD;
    };

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [treatmentsData, amuData] = await Promise.all([
                getTreatments(),
                getMyHighAmuAlerts()
            ]);
            setTreatments(Array.isArray(treatmentsData) ? treatmentsData : []);
            setAmuAlerts(Array.isArray(amuData) ? amuData : []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate operational alerts
    const withdrawalAlerts = treatments.filter(t => {
        if (t.status === 'Approved' && t.withdrawalEndDate) {
            const daysLeft = differenceInDays(new Date(t.withdrawalEndDate), new Date());
            return daysLeft >= 0 && daysLeft <= 7;
        }
        return false;
    });

    const pendingTreatments = treatments.filter(t => t.status === 'Pending');

    const stats = {
        totalAmuAlerts: amuAlerts.length,
        criticalAmu: amuAlerts.filter(a => a.severity === 'Critical' || a.severity === 'High').length,
        pendingApprovals: pendingTreatments.length,
        withdrawalEnding: withdrawalAlerts.length
    };

    const handleAlertClick = (alert) => {
        setSelectedAlert(alert);
        setModalVisible(true);
    };

    const renderAmuAlert = (alert) => {
        const config = getAmuAlertConfig(alert.alertType);
        return (
            <TouchableOpacity
                key={alert._id}
                style={[
                    styles.alertCard,
                    { borderLeftColor: config.color }
                ]}
                onPress={() => handleAlertClick(alert)}
            >
                <View style={[styles.alertIconContainer, { backgroundColor: `${config.color}20` }]}>
                    <Ionicons name={config.icon} size={24} color={config.color} />
                </View>
                <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                        <Text style={styles.alertTitle}>{config.label}</Text>
                        <SeverityBadge severity={alert.severity} />
                    </View>
                    <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
                    <Text style={styles.alertDate}>
                        {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
        );
    };

    const renderOperationalAlerts = () => (
        <View style={styles.listContainer}>
            {pendingTreatments.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('pending_approvals')} ({pendingTreatments.length})</Text>
                    {pendingTreatments.map(treatment => (
                        <View key={treatment._id} style={styles.operationalCard}>
                            <View>
                                <Text style={styles.operationalTitle}>{t('animal_label')} {treatment.animalId}</Text>
                                <Text style={styles.operationalSubtitle}>{t('drug_name_label')}: {treatment.drugName}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => navigation.navigate('Treatments')}
                            >
                                <Text style={styles.viewButtonText}>{t('view')}</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {withdrawalAlerts.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('withdrawal_ending')} ({withdrawalAlerts.length})</Text>
                    {withdrawalAlerts.map(treatment => {
                        const daysLeft = differenceInDays(new Date(treatment.withdrawalEndDate), new Date());
                        return (
                            <View key={treatment._id} style={styles.operationalCard}>
                                <View>
                                    <Text style={styles.operationalTitle}>{t('animal_label')} {treatment.animalId}</Text>
                                    <Text style={styles.operationalSubtitle}>
                                        {daysLeft} {daysLeft !== 1 ? t('days_remaining') : t('day_remaining')}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: daysLeft <= 2 ? '#fee2e2' : '#f3f4f6' }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: daysLeft <= 2 ? '#991b1b' : '#374151' }
                                    ]}>
                                        {daysLeft <= 2 ? t('critical') : t('warning')}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {pendingTreatments.length === 0 && withdrawalAlerts.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="shield-checkmark" size={48} color="#10b981" />
                    <Text style={styles.emptyStateTitle}>{t('all_clear')}</Text>
                    <Text style={styles.emptyStateText}>{t('no_operational_tasks')}</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>{t('loading_alerts')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('alerts_title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('alerts_subtitle')}</Text>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{t('amu_alerts')}</Text>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.totalAmuAlerts}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{t('critical')}</Text>
                        <Text style={[styles.statValue, { color: '#f97316' }]}>{stats.criticalAmu}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{t('withdrawal')}</Text>
                        <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.withdrawalEnding}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'amu' && styles.activeTab]}
                        onPress={() => setActiveTab('amu')}
                    >
                        <Text style={[styles.tabText, activeTab === 'amu' && styles.activeTabText]}>
                            {t('amu_alerts')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'operational' && styles.activeTab]}
                        onPress={() => setActiveTab('operational')}
                    >
                        <Text style={[styles.tabText, activeTab === 'operational' && styles.activeTabText]}>
                            {t('operational')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {activeTab === 'amu' ? (
                    <View style={styles.listContainer}>
                        {amuAlerts.length > 0 ? (
                            amuAlerts.map(renderAmuAlert)
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                                <Text style={styles.emptyStateTitle}>{t('no_amu_alerts')}</Text>
                                <Text style={styles.emptyStateText}>{t('no_amu_alerts_desc')}</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    renderOperationalAlerts()
                )}
            </ScrollView>

            {/* Alert Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedAlert && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {getAmuAlertConfig(selectedAlert.alertType)?.label || t('alert_details')}
                                    </Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalBody}>
                                    <View style={styles.modalSection}>
                                        <View style={styles.flexRow}>
                                            <Text style={styles.modalLabel}>{t('severity')}:</Text>
                                            <SeverityBadge severity={selectedAlert.severity} />
                                        </View>
                                        <Text style={styles.modalMessage}>{selectedAlert.message}</Text>
                                        <Text style={styles.modalDate}>
                                            {format(new Date(selectedAlert.createdAt), 'MMM d, yyyy h:mm a')}
                                        </Text>
                                    </View>

                                    {selectedAlert.details?.drugClassBreakdown && (
                                        <View style={styles.modalSection}>
                                            <Text style={styles.modalSectionTitle}>{t('drug_class_breakdown')}</Text>
                                            <View style={styles.breakdownGrid}>
                                                <View style={[styles.breakdownItem, { backgroundColor: '#dcfce7' }]}>
                                                    <Text style={[styles.breakdownLabel, { color: '#166534' }]}>{t('access')}</Text>
                                                    <Text style={[styles.breakdownValue, { color: '#14532d' }]}>
                                                        {selectedAlert.details.drugClassBreakdown.access || 0}
                                                    </Text>
                                                </View>
                                                <View style={[styles.breakdownItem, { backgroundColor: '#ffedd5' }]}>
                                                    <Text style={[styles.breakdownLabel, { color: '#9a3412' }]}>{t('watch')}</Text>
                                                    <Text style={[styles.breakdownValue, { color: '#7c2d12' }]}>
                                                        {selectedAlert.details.drugClassBreakdown.watch || 0}
                                                    </Text>
                                                </View>
                                                <View style={[styles.breakdownItem, { backgroundColor: '#fee2e2' }]}>
                                                    <Text style={[styles.breakdownLabel, { color: '#991b1b' }]}>{t('reserve')}</Text>
                                                    <Text style={[styles.breakdownValue, { color: '#7f1d1d' }]}>
                                                        {selectedAlert.details.drugClassBreakdown.reserve || 0}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
    loadingText: {
        marginTop: 10,
        color: '#6b7280',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#1e293b',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        color: '#94a3b8',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
        marginTop: 10,
        marginHorizontal: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        marginHorizontal: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#f3f4f6',
    },
    tabText: {
        color: '#6b7280',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#1f2937',
    },
    listContainer: {
        padding: 15,
        paddingTop: 0,
    },
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    alertIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
        marginRight: 10,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    alertMessage: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 4,
    },
    alertDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 10,
    },
    operationalCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    operationalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    operationalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    viewButton: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginTop: 16,
    },
    emptyStateText: {
        color: '#6b7280',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    modalBody: {
        padding: 20,
    },
    modalSection: {
        marginBottom: 24,
    },
    flexRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    modalMessage: {
        fontSize: 16,
        color: '#4b5563',
        lineHeight: 24,
        marginBottom: 8,
    },
    modalDate: {
        fontSize: 14,
        color: '#9ca3af',
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12,
    },
    breakdownGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    breakdownItem: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    breakdownLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    breakdownValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default AlertsScreen;