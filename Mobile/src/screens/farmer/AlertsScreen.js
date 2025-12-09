
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
import { LinearGradient } from 'expo-linear-gradient';
import { getTreatments } from '../../services/treatmentService';
import { getMyHighAmuAlerts } from '../../services/farmerService';
import { differenceInDays, format } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';

const { width } = Dimensions.get('window');

const SeverityBadge = ({ severity, theme }) => {
    let bg, text, border;
    switch (severity) {
        case 'Low':
            bg = theme.success + '20'; text = theme.success; border = theme.success + '40'; break;
        case 'Medium':
            bg = theme.warning + '20'; text = theme.warning; border = theme.warning + '40'; break;
        case 'High':
            bg = theme.error + '20'; text = theme.error; border = theme.error + '40'; break;
        case 'Critical':
            bg = theme.error + '30'; text = theme.error; border = theme.error + '50'; break;
        default:
            bg = theme.background; text = theme.subtext; border = theme.border;
    }

    return (
        <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.badgeText, { color: text }]}>{severity}</Text>
        </View>
    );
};

const AlertsScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { isConnected } = useNetwork();
    const [treatments, setTreatments] = useState([]);
    const [amuAlerts, setAmuAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const getAmuAlertConfig = (type) => {
        const configs = {
            HISTORICAL_SPIKE: {
                icon: 'trending-up',
                color: theme.warning, // orange-500
                label: t('historical_spike'),
                description: t('historical_spike_desc')
            },
            PEER_COMPARISON_SPIKE: {
                icon: 'pulse',
                color: theme.warning, // yellow-500
                label: t('peer_comparison'),
                description: t('peer_comparison_desc')
            },
            ABSOLUTE_THRESHOLD: {
                icon: 'warning',
                color: theme.error, // red-500
                label: t('absolute_limit'),
                description: t('absolute_limit_desc')
            },
            TREND_INCREASE: {
                icon: 'trending-up',
                color: theme.info, // blue-500
                label: t('upward_trend'),
                description: t('upward_trend_desc')
            },
            CRITICAL_DRUG_USAGE: {
                icon: 'shield',
                color: theme.primary, // purple-500
                label: t('critical_drugs'),
                description: t('critical_drugs_desc')
            },
            SUSTAINED_HIGH_USAGE: {
                icon: 'notifications',
                color: theme.error, // red-500
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
            if (error.response) {
                console.error('Error response:', error.response.status, error.response.data);
            }
        } finally {
            console.log('Fetched treatments:', treatments.length);
            console.log('Fetched AMU alerts:', amuAlerts.length);
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
                    { backgroundColor: theme.card, borderLeftColor: config.color, shadowColor: theme.text }
                ]}
                onPress={() => handleAlertClick(alert)}
            >
                <View style={[styles.alertIconContainer, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon} size={24} color={config.color} />
                </View>
                <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                        <Text style={[styles.alertTitle, { color: theme.text }]}>{config.label}</Text>
                        <SeverityBadge severity={alert.severity} theme={theme} />
                    </View>
                    <Text style={[styles.alertMessage, { color: theme.subtext }]} numberOfLines={2}>{alert.message}</Text>
                    <Text style={[styles.alertDate, { color: theme.subtext }]}>
                        {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </TouchableOpacity>
        );
    };

    const renderOperationalAlerts = () => (
        <View style={styles.listContainer}>
            {pendingTreatments.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('pending_approvals')} ({pendingTreatments.length})</Text>
                    {pendingTreatments.map(treatment => (
                        <View key={treatment._id} style={[styles.operationalCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                            <View>
                                <Text style={[styles.operationalTitle, { color: theme.text }]}>{t('animal_label')} {treatment.animalId}</Text>
                                <Text style={[styles.operationalSubtitle, { color: theme.subtext }]}>{t('drug_name_label')}: {treatment.drugName}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.viewButton, { backgroundColor: theme.background }]}
                                onPress={() => navigation.navigate('Treatments')}
                            >
                                <Text style={[styles.viewButtonText, { color: theme.text }]}>{t('view')}</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {withdrawalAlerts.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('withdrawal_ending')} ({withdrawalAlerts.length})</Text>
                    {withdrawalAlerts.map(treatment => {
                        const daysLeft = differenceInDays(new Date(treatment.withdrawalEndDate), new Date());
                        return (
                            <View key={treatment._id} style={[styles.operationalCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                                <View>
                                    <Text style={[styles.operationalTitle, { color: theme.text }]}>{t('animal_label')} {treatment.animalId}</Text>
                                    <Text style={[styles.operationalSubtitle, { color: theme.subtext }]}>
                                        {daysLeft} {daysLeft !== 1 ? t('days_remaining') : t('day_remaining')}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: daysLeft <= 2 ? theme.error + '20' : theme.background }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: daysLeft <= 2 ? theme.error : theme.subtext }
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
                    <Ionicons name="shield-checkmark" size={48} color={theme.success} />
                    <Text style={[styles.emptyStateTitle, { color: theme.text }]}>{t('all_clear')}</Text>
                    <Text style={[styles.emptyStateText, { color: theme.subtext }]}>{t('no_operational_tasks')}</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.subtext }]}>{t('loading_alerts')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchData(true)}
                        tintColor={theme.primary}
                        enabled={isConnected}
                    />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    style={styles.header}
                >
                    <Text style={[styles.headerTitle, { color: '#fff' }]}>{t('alerts_title')}</Text>
                    <Text style={[styles.headerSubtitle, { color: '#94a3b8' }]}>{t('alerts_subtitle')}</Text>
                </LinearGradient>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('amu_alerts')}</Text>
                        <Text style={[styles.statValue, { color: theme.error }]}>{stats.totalAmuAlerts}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('critical')}</Text>
                        <Text style={[styles.statValue, { color: theme.warning }]}>{stats.criticalAmu}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('withdrawal')}</Text>
                        <Text style={[styles.statValue, { color: theme.success }]}>{stats.withdrawalEnding}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'all' && { backgroundColor: theme.background }]}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text style={[styles.tabText, { color: theme.subtext }, activeTab === 'all' && { color: theme.text, fontWeight: 'bold' }]}>
                            {t('all')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'amu' && { backgroundColor: theme.background }]}
                        onPress={() => setActiveTab('amu')}
                    >
                        <Text style={[styles.tabText, { color: theme.subtext }, activeTab === 'amu' && { color: theme.text, fontWeight: 'bold' }]}>
                            {t('amu_alerts')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'operational' && { backgroundColor: theme.background }]}
                        onPress={() => setActiveTab('operational')}
                    >
                        <Text style={[styles.tabText, { color: theme.subtext }, activeTab === 'operational' && { color: theme.text, fontWeight: 'bold' }]}>
                            {t('operational')}
                        </Text>
                    </TouchableOpacity>
                </View>


                {/* Content */}
                {activeTab === 'all' ? (
                    <View style={styles.listContainer}>
                        {/* AMU Alerts Section */}
                        {amuAlerts.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('amu_alerts')}</Text>
                                {amuAlerts.map(renderAmuAlert)}
                            </View>
                        )}

                        {/* Operational Alerts Section */}
                        {(pendingTreatments.length > 0 || withdrawalAlerts.length > 0) && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('operational')}</Text>
                                {pendingTreatments.length > 0 && (
                                    <View style={{ marginBottom: 10 }}>
                                        <Text style={[styles.operationalSubtitle, { color: theme.subtext, marginBottom: 8 }]}>{t('pending_approvals')}</Text>
                                        {pendingTreatments.map(treatment => (
                                            <View key={treatment._id} style={[styles.operationalCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                                                <View>
                                                    <Text style={[styles.operationalTitle, { color: theme.text }]}>{t('animal_label')} {treatment.animalId}</Text>
                                                    <Text style={[styles.operationalSubtitle, { color: theme.subtext }]}>{t('drug_name_label')}: {treatment.drugName}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={[styles.viewButton, { backgroundColor: theme.background }]}
                                                    onPress={() => navigation.navigate('Treatments')}
                                                >
                                                    <Text style={[styles.viewButtonText, { color: theme.text }]}>{t('view')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                {withdrawalAlerts.map(treatment => {
                                    const daysLeft = differenceInDays(new Date(treatment.withdrawalEndDate), new Date());
                                    return (
                                        <View key={treatment._id} style={[styles.operationalCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                                            <View>
                                                <Text style={[styles.operationalTitle, { color: theme.text }]}>{t('animal_label')} {treatment.animalId}</Text>
                                                <Text style={[styles.operationalSubtitle, { color: theme.subtext }]}>
                                                    {daysLeft} {daysLeft !== 1 ? t('days_remaining') : t('day_remaining')}
                                                </Text>
                                            </View>
                                            <View style={[
                                                styles.statusBadge,
                                                { backgroundColor: daysLeft <= 2 ? theme.error + '20' : theme.background }
                                            ]}>
                                                <Text style={[
                                                    styles.statusText,
                                                    { color: daysLeft <= 2 ? theme.error : theme.subtext }
                                                ]}>
                                                    {daysLeft <= 2 ? t('critical') : t('warning')}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Empty State */}
                        {amuAlerts.length === 0 && pendingTreatments.length === 0 && withdrawalAlerts.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-circle" size={48} color={theme.success} />
                                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>{t('all_clear')}</Text>
                                <Text style={[styles.emptyStateText, { color: theme.subtext }]}>{t('no_active_alerts')}</Text>
                            </View>
                        )}
                    </View>
                ) : activeTab === 'amu' ? (
                    <View style={styles.listContainer}>
                        {amuAlerts.length > 0 ? (
                            amuAlerts.map(renderAmuAlert)
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-circle" size={48} color={theme.success} />
                                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>{t('no_amu_alerts')}</Text>
                                <Text style={[styles.emptyStateText, { color: theme.subtext }]}>{t('no_amu_alerts_desc')}</Text>
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
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        {selectedAlert && (
                            <>
                                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                                        {getAmuAlertConfig(selectedAlert.alertType)?.label || t('alert_details')}
                                    </Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close" size={24} color={theme.subtext} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalBody}>
                                    <View style={styles.modalSection}>
                                        <View style={styles.flexRow}>
                                            <Text style={[styles.modalLabel, { color: theme.text }]}>{t('severity')}:</Text>
                                            <SeverityBadge severity={selectedAlert.severity} theme={theme} />
                                        </View>
                                        <Text style={[styles.modalMessage, { color: theme.subtext }]}>{selectedAlert.message}</Text>
                                        <Text style={[styles.modalDate, { color: theme.subtext }]}>
                                            {format(new Date(selectedAlert.createdAt), 'MMM d, yyyy h:mm a')}
                                        </Text>
                                    </View>

                                    {selectedAlert.details?.drugClassBreakdown && (
                                        <View style={styles.modalSection}>
                                            <Text style={[styles.modalSectionTitle, { color: theme.text }]}>{t('drug_class_breakdown')}</Text>
                                            <View style={styles.breakdownGrid}>
                                                <View style={[styles.breakdownItem, { backgroundColor: theme.success + '20' }]}>
                                                    <Text style={[styles.breakdownLabel, { color: theme.success }]}>{t('access')}</Text>
                                                    <Text style={[styles.breakdownValue, { color: theme.success }]}>
                                                        {selectedAlert.details.drugClassBreakdown.access || 0}
                                                    </Text>
                                                </View>
                                                <View style={[styles.breakdownItem, { backgroundColor: theme.warning + '20' }]}>
                                                    <Text style={[styles.breakdownLabel, { color: theme.warning }]}>{t('watch')}</Text>
                                                    <Text style={[styles.breakdownValue, { color: theme.warning }]}>
                                                        {selectedAlert.details.drugClassBreakdown.watch || 0}
                                                    </Text>
                                                </View>
                                                <View style={[styles.breakdownItem, { backgroundColor: theme.error + '20' }]}>
                                                    <Text style={[styles.breakdownLabel, { color: theme.error }]}>{t('reserve')}</Text>
                                                    <Text style={[styles.breakdownValue, { color: theme.error }]}>
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
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
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 15,
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
    tabText: {
        fontWeight: '600',
    },
    listContainer: {
        padding: 15,
        paddingTop: 0,
    },
    alertCard: {
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
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
    },
    alertMessage: {
        fontSize: 14,
        marginBottom: 4,
    },
    alertDate: {
        fontSize: 12,
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
        marginBottom: 10,
    },
    operationalCard: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    operationalTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    operationalSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    viewButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: '600',
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
        marginTop: 16,
    },
    emptyStateText: {
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
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
    },
    modalMessage: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 8,
    },
    modalDate: {
        fontSize: 14,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
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
