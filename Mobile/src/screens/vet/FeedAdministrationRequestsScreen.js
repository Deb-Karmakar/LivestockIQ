import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
    getFeedAdministrationRequests,
    approveFeedAdministration,
    rejectFeedAdministration
} from '../../services/vetService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSync } from '../../contexts/SyncContext';

const FeedAdministrationRequestsScreen = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { isConnected } = useNetwork();
    const { addToQueue } = useSync();
    const navigation = useNavigation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Pending Approval'); // 'all', 'Pending Approval', 'Active', 'Rejected'

    // Modals
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [vetNotes, setVetNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getFeedAdministrationRequests();
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching feed requests:', error);
            Alert.alert(t('error'), t('failed_load_dashboard'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        try {
            if (!isConnected) {
                await addToQueue({
                    type: 'APPROVE_FEED',
                    payload: { id: selectedRequest._id, notes: vetNotes }
                });
                setApproveModalVisible(false);
                Alert.alert(t('offline'), t('approval_queued'));
                // Optimistic update
                setRequests(prev => prev.map(r =>
                    r._id === selectedRequest._id ? { ...r, status: 'Active' } : r
                ));
                return;
            }

            await approveFeedAdministration(selectedRequest._id, vetNotes);
            setApproveModalVisible(false);
            Alert.alert(t('success'), t('feed_approved'));
            fetchRequests();
        } catch (error) {
            Alert.alert(t('error'), t('failed_approve'));
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        if (!rejectionReason.trim()) {
            Alert.alert(t('error'), t('provide_reason_error'));
            return;
        }
        try {
            if (!isConnected) {
                await addToQueue({
                    type: 'REJECT_FEED',
                    payload: { id: selectedRequest._id, reason: rejectionReason }
                });
                setRejectModalVisible(false);
                Alert.alert(t('offline'), t('rejection_queued'));
                // Optimistic update
                setRequests(prev => prev.map(r =>
                    r._id === selectedRequest._id ? { ...r, status: 'Rejected' } : r
                ));
                return;
            }

            await rejectFeedAdministration(selectedRequest._id, rejectionReason);
            setRejectModalVisible(false);
            Alert.alert(t('success'), t('feed_rejected'));
            fetchRequests();
        } catch (error) {
            Alert.alert(t('error'), t('failed_reject'));
        }
    };

    const openApproveModal = (request) => {
        setSelectedRequest(request);
        setVetNotes('');
        setApproveModalVisible(true);
    };

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setRejectModalVisible(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return theme.success;
            case 'Rejected': return theme.error;
            default: return theme.warning;
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeTab === 'all') return true;
        return req.status === activeTab;
    });

    const renderRequest = ({ item }) => {
        const isPending = item.status === 'Pending Approval';
        const animalCount = item.animalIds?.length || 0;

        return (
            <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.farmerInfo}>
                        <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                            <Text style={[styles.avatarText, { color: theme.primary }]}>
                                {item.farmerId?.farmOwner?.charAt(0) || 'F'}
                            </Text>
                        </View>
                        <View>
                            <Text style={[styles.farmerName, { color: theme.text }]}>{item.farmerId?.farmOwner || 'Unknown Farmer'}</Text>
                            <Text style={[styles.farmName, { color: theme.subtext }]}>
                                <Ionicons name="location" size={12} color={theme.subtext} /> {item.farmerId?.farmName || 'Unknown Farm'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status === 'Pending Approval' ? t('tab_pending') : item.status}
                        </Text>
                    </View>
                </View>

                <View style={[styles.detailsSection, { backgroundColor: theme.background }]}>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('feed')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{item.feedId?.feedName || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('antimicrobial')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{item.feedId?.antimicrobialName || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('group_animals')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{item.groupName || `${animalCount} animal(s)`}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('quantity')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{item.feedQuantityUsed} {item.feedId?.unit || 'kg'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('start_date')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('withdrawal_end_short')}</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                            {item.withdrawalEndDate ? new Date(item.withdrawalEndDate).toLocaleDateString() : 'TBD'}
                        </Text>
                    </View>
                </View>

                {item.notes && (
                    <View style={[styles.notesBox, { backgroundColor: `${theme.warning}10` }]}>
                        <Text style={[styles.notesLabel, { color: theme.warning }]}>{t('farmer_notes')}</Text>
                        <Text style={[styles.notesText, { color: theme.text }]}>{item.notes}</Text>
                    </View>
                )}

                {item.animals && item.animals.length > 0 && (
                    <View style={styles.animalsList}>
                        <Text style={[styles.animalsLabel, { color: theme.subtext }]}>{t('animals_in_request')}</Text>
                        <View style={styles.tagsContainer}>
                            {item.animals.map(animal => (
                                <TouchableOpacity
                                    key={animal.tagId}
                                    style={[styles.animalTag, { backgroundColor: `${theme.info}10`, borderColor: `${theme.info}30` }]}
                                    onPress={() => navigation.navigate('AnimalHistory', { animalId: animal.tagId })}
                                >
                                    <Text style={[styles.animalTagText, { color: theme.info }]}>{animal.tagId}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {isPending && (
                    <View style={[styles.actionFooter, { borderTopColor: theme.border }]}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.approveBtn, { backgroundColor: theme.success }]}
                            onPress={() => openApproveModal(item)}
                        >
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <Text style={styles.actionBtnText}>{t('approve')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn, { backgroundColor: theme.error }]}
                            onPress={() => openRejectModal(item)}
                        >
                            <Ionicons name="close-circle" size={18} color="#fff" />
                            <Text style={styles.actionBtnText}>{t('reject')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <Ionicons name="nutrition" size={16} color="#a78bfa" />
                        <Text style={styles.headerLabel}>{t('feed_verification')}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{t('feed_requests')}</Text>
                    <Text style={styles.headerSubtitle}>
                        {t('review_manage_feed', { count: requests.filter(r => r.status === 'Pending Approval').length }).split(/<bold>(.*?)<\/bold>/).map((part, index) => {
                            if (index === 1) return <Text key={index} style={styles.highlightText}>{part}</Text>;
                            return <Text key={index}>{part}</Text>;
                        })}
                    </Text>
                </View>
                {
                    !isConnected && (
                        <Text style={{ textAlign: 'center', color: theme.warning, marginTop: 8, fontSize: 12 }}>
                            {t('offline_mode_cached_data')}
                        </Text>
                    )
                }
            </LinearGradient >

            <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                {[
                    { key: 'all', label: t('tab_all') },
                    { key: 'Pending Approval', label: t('tab_pending') },
                    { key: 'Active', label: t('tab_approved') },
                    { key: 'Rejected', label: t('tab_rejected') }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: theme.subtext },
                            activeTab === tab.key && { color: theme.primary, fontWeight: '600' }
                        ]}>
                            {tab.label}
                        </Text>
                        {activeTab === tab.key && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
                    </TouchableOpacity>
                ))}
            </View>

            {
                loading ? (
                    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredRequests}
                        keyExtractor={(item) => item._id}
                        renderItem={renderRequest}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} enabled={isConnected} />}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="nutrition-outline" size={64} color={theme.border} />
                                <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_requests', { status: '' })}</Text>
                            </View>
                        }
                    />
                )
            }

            {/* Approve Modal */}
            <Modal
                visible={approveModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setApproveModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('approve_feed')}</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                            {t('add_optional_notes')}
                        </Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                            placeholder={t('vet_notes')}
                            placeholderTextColor={theme.subtext}
                            value={vetNotes}
                            onChangeText={setVetNotes}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: theme.background }]}
                                onPress={() => setApproveModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: theme.subtext }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmApproveBtn, { backgroundColor: theme.success }]}
                                onPress={handleApprove}
                            >
                                <Text style={styles.confirmApproveBtnText}>{t('approve')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal
                visible={rejectModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('reject_request')}</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                            {t('restore_inventory_note')}
                        </Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                            placeholder={t('reason_placeholder')}
                            placeholderTextColor={theme.subtext}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: theme.background }]}
                                onPress={() => setRejectModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: theme.subtext }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmRejectBtn, { backgroundColor: theme.error }]}
                                onPress={handleReject}
                            >
                                <Text style={styles.confirmRejectBtnText}>{t('reject')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerContent: {},
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    headerLabel: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    headerSubtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
    highlightText: { color: '#fb923c', fontWeight: '600' },
    tabBar: { flexDirection: 'row', paddingHorizontal: 10, borderBottomWidth: 1 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTab: {},
    tabText: { fontSize: 14, fontWeight: '500' },
    activeIndicator: { position: 'absolute', bottom: 0, width: '100%', height: 2 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { borderRadius: 12, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    farmerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 16, fontWeight: 'bold' },
    farmerName: { fontSize: 16, fontWeight: '600' },
    farmName: { fontSize: 12, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: '600' },
    detailsSection: { borderRadius: 8, padding: 12, marginBottom: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    detailLabel: { fontSize: 13 },
    detailValue: { fontSize: 13, fontWeight: '500' },
    notesBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
    notesLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    notesText: { fontSize: 13 },
    animalsList: { marginBottom: 16 },
    animalsLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    animalTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    animalTagText: { fontSize: 12, fontWeight: '500' },
    actionFooter: { flexDirection: 'row', gap: 8, paddingTop: 16, borderTopWidth: 1 },
    actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    approveBtn: {},
    rejectBtn: {},
    actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 16 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, marginBottom: 16 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 16, fontSize: 14 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    cancelBtn: {},
    confirmApproveBtn: {},
    confirmRejectBtn: {},
    cancelBtnText: { fontWeight: '600' },
    confirmApproveBtnText: { color: '#fff', fontWeight: '600' },
    confirmRejectBtnText: { color: '#fff', fontWeight: '600' },
});

export default FeedAdministrationRequestsScreen;
