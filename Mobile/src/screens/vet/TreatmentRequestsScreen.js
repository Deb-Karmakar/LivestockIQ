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
    ScrollView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTreatmentRequests, approveTreatment, rejectTreatment } from '../../services/treatmentService';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSync } from '../../contexts/SyncContext';

const TreatmentRequestsScreen = () => {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { isConnected } = useNetwork();
    const { addToQueue } = useSync();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Pending'); // 'All', 'Pending', 'Approved', 'Rejected'

    // Reject Modal State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Approve Modal State
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [approvalForm, setApprovalForm] = useState({
        drugName: '',
        dose: '',
        route: '',
        vetNotes: '',
        startDate: new Date(),
        withdrawalEndDate: new Date(),
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTreatmentRequests();
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
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

    // --- Approval Logic ---
    const openApproveModal = (request) => {
        setSelectedRequest(request);
        setApprovalForm({
            drugName: request.drugName || '',
            dose: request.dose || '',
            route: request.route || '',
            vetNotes: '',
            startDate: request.startDate ? new Date(request.startDate) : new Date(),
            withdrawalEndDate: request.withdrawalEndDate ? new Date(request.withdrawalEndDate) : new Date(),
        });
        setApproveModalVisible(true);
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setApprovalForm(prev => ({
                ...prev,
                [datePickerMode === 'start' ? 'startDate' : 'withdrawalEndDate']: selectedDate
            }));
        }
    };

    const showDatepicker = (mode) => {
        setDatePickerMode(mode);
        setShowDatePicker(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedRequest) return;

        try {
            // Calculate withdrawal days if needed, or pass dates directly
            // The backend updateTreatmentByVet likely accepts startDate and withdrawalEndDate directly based on web code
            const updateData = {
                ...approvalForm,
                status: 'Approved'
            };

            if (!isConnected) {
                await addToQueue({
                    type: 'APPROVE_TREATMENT',
                    payload: { id: selectedRequest._id, data: updateData }
                });
                setApproveModalVisible(false);
                Alert.alert(t('offline'), t('approval_queued'));
                // Optimistic update
                setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
                return;
            }

            await approveTreatment(selectedRequest._id, updateData);
            setApproveModalVisible(false);
            Alert.alert(t('success'), t('treatment_approved'));
            fetchRequests();
        } catch (error) {
            console.error('Approve error:', error);
            Alert.alert(t('error'), t('failed_approve'));
        }
    };

    // --- Rejection Logic ---
    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setRejectModalVisible(true);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert(t('error'), t('provide_reason_error'));
            return;
        }

        try {
            if (!isConnected) {
                await addToQueue({
                    type: 'REJECT_TREATMENT',
                    payload: { id: selectedRequest._id, reason: rejectionReason }
                });
                setRejectModalVisible(false);
                Alert.alert(t('offline'), t('rejection_queued'));
                // Optimistic update
                setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
                return;
            }

            await rejectTreatment(selectedRequest._id, rejectionReason);
            setRejectModalVisible(false);
            Alert.alert(t('success'), t('treatment_rejected'));
            fetchRequests();
        } catch (error) {
            Alert.alert(t('error'), t('failed_reject'));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return theme.success;
            case 'Rejected': return theme.error;
            default: return theme.warning;
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeTab === 'All') return true;
        return (req.status || 'Pending') === activeTab;
    });

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const diff = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(diff);
        const years = Math.abs(ageDate.getUTCFullYear() - 1970);
        const months = ageDate.getUTCMonth();
        return years > 0 ? `${years}y ${months}m` : `${months}m`;
    };

    const renderRequest = ({ item }) => {
        const isPending = (item.status || 'Pending') === 'Pending';
        const age = calculateAge(item.animal?.dob);

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
                    <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status || 'Pending') }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status || 'Pending') }]}>
                            {item.status || 'Pending'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.animalSection, { backgroundColor: theme.background }]}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="paw" size={14} color={theme.subtext} />
                        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>{t('animal_details')}</Text>
                    </View>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.subtext }]}>ID</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{item.animalId}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('species')}</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{item.animal?.species || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('gender')}</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{item.animal?.gender || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('age')}</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{age}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.drugSection}>
                    <Text style={[styles.drugLabel, { color: theme.subtext }]}>{t('drug_used')}</Text>
                    <Text style={[styles.drugName, { color: theme.text }]}>{item.drugName}</Text>
                    <View style={styles.drugDetails}>
                        <Text style={[styles.drugDetailText, { color: theme.subtext }]}>{t('dosage', { amount: item.dosageAmount, unit: item.dosageUnit })}</Text>
                        <Text style={[styles.drugDetailText, { color: theme.subtext }]}>•</Text>
                        <Text style={[styles.drugDetailText, { color: theme.subtext }]}>{t('withdrawal_days', { days: item.withdrawalPeriodDays })}</Text>
                    </View>
                </View>

                {item.reason && (
                    <View style={[styles.reasonBox, { backgroundColor: `${theme.error}10` }]}>
                        <Text style={[styles.reasonLabel, { color: theme.error }]}>{t('rejection_reason')}</Text>
                        <Text style={[styles.reasonText, { color: theme.error }]}>{item.reason}</Text>
                    </View>
                )}

                <View style={[styles.actionFooter, { borderTopColor: theme.border }]}>
                    {isPending && (
                        <>
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
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.historyBtn, { backgroundColor: theme.background, borderColor: theme.border }, !isPending && { flex: 1 }]}
                        onPress={() => navigation.navigate('AnimalHistory', { animalId: item.animalId })}
                    >
                        <Ionicons name="document-text" size={18} color={theme.subtext} />
                        <Text style={[styles.actionBtnText, { color: theme.subtext }]}>{t('history')}</Text>
                    </TouchableOpacity>
                </View>
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
                        <Ionicons name="clipboard" size={16} color="#60a5fa" />
                        <Text style={styles.headerLabel}>{t('verification_requests')}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{t('treatment_requests')}</Text>
                    <Text style={styles.headerSubtitle}>
                        {t('review_manage_pending', { count: requests.filter(r => (r.status || 'Pending') === 'Pending').length }).split(/<bold>(.*?)<\/bold>/).map((part, index) => {
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
                {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: theme.subtext },
                            activeTab === tab && { color: theme.primary, fontWeight: '600' }
                        ]}>
                            {t(`tab_${tab.toLowerCase()}`)}
                        </Text>
                        {activeTab === tab && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
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
                                <Ionicons name="file-tray-outline" size={64} color={theme.border} />
                                <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_requests', { status: activeTab !== 'All' ? activeTab.toLowerCase() : '' })}</Text>
                            </View>
                        }
                    />
                )
            }

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
                        <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>{t('provide_rejection_reason')}</Text>
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

            {/* Approve Modal */}
            <Modal
                visible={approveModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setApproveModalVisible(false)}
            >
                <View style={[styles.fullScreenModal, { backgroundColor: theme.background }]}>
                    <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalHeaderTitle, { color: theme.text }]}>{t('review_approve')}</Text>
                        <TouchableOpacity onPress={() => setApproveModalVisible(false)}>
                            <Text style={[styles.closeButtonText, { color: theme.primary }]}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Animal Summary */}
                        <View style={[styles.summaryCard, { backgroundColor: `${theme.primary}20` }]}>
                            <Text style={[styles.summaryTitle, { color: theme.primary }]}>{t('animal_summary')}</Text>
                            <Text style={[styles.summaryText, { color: theme.text }]}>
                                ID: {selectedRequest?.animalId} • {selectedRequest?.animal?.species}
                            </Text>
                            <Text style={[styles.summarySubtext, { color: theme.primary }]}>
                                {calculateAge(selectedRequest?.animal?.dob)} • {selectedRequest?.animal?.gender}
                            </Text>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            <Text style={[styles.label, { color: theme.text }]}>{t('drug_name')}</Text>
                            <TextInput
                                style={[styles.inputField, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                                value={approvalForm.drugName}
                                onChangeText={(text) => setApprovalForm({ ...approvalForm, drugName: text })}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
                                <Text style={[styles.label, { color: theme.text }]}>{t('dose')}</Text>
                                <TextInput
                                    style={[styles.inputField, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                                    value={approvalForm.dose}
                                    onChangeText={(text) => setApprovalForm({ ...approvalForm, dose: text })}
                                />
                            </View>
                            <View style={[styles.formSection, { flex: 1, marginLeft: 8 }]}>
                                <Text style={[styles.label, { color: theme.text }]}>{t('route')}</Text>
                                <TextInput
                                    style={[styles.inputField, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                                    value={approvalForm.route}
                                    onChangeText={(text) => setApprovalForm({ ...approvalForm, route: text })}
                                />
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={[styles.label, { color: theme.text }]}>{t('withdrawal_start')}</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                                onPress={() => showDatepicker('start')}
                            >
                                <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                                <Text style={[styles.dateButtonText, { color: theme.text }]}>
                                    {approvalForm.startDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={[styles.label, { color: theme.text }]}>{t('withdrawal_end')}</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                                onPress={() => showDatepicker('end')}
                            >
                                <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                                <Text style={[styles.dateButtonText, { color: theme.text }]}>
                                    {approvalForm.withdrawalEndDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={[styles.label, { color: theme.text }]}>{t('farmer_notes')}</Text>
                            <View style={[styles.readOnlyBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <Text style={[styles.readOnlyText, { color: theme.subtext }]}>
                                    {selectedRequest?.notes || t('no_notes')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={[styles.label, { color: theme.text }]}>{t('vet_notes_instructions')}</Text>
                            <TextInput
                                style={[styles.inputField, styles.textArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                                value={approvalForm.vetNotes}
                                onChangeText={(text) => setApprovalForm({ ...approvalForm, vetNotes: text })}
                                placeholder={t('add_instructions')}
                                placeholderTextColor={theme.subtext}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.confirmApproveButton, { backgroundColor: theme.success }]}
                            onPress={handleConfirmApprove}
                        >
                            <Text style={styles.confirmApproveButtonText}>{t('save_approve')}</Text>
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    {showDatePicker && (
                        <DateTimePicker
                            value={datePickerMode === 'start' ? approvalForm.startDate : approvalForm.withdrawalEndDate}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                        />
                    )}
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
    headerLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    headerSubtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
    highlightText: { color: '#fb923c', fontWeight: '600' },
    tabBar: { flexDirection: 'row', paddingHorizontal: 10, borderBottomWidth: 1 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTab: {},
    tabText: { fontSize: 14, fontWeight: '500' },
    activeTabText: { fontWeight: '600' },
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
    animalSection: { borderRadius: 8, padding: 12, marginBottom: 12 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
    sectionTitle: { fontSize: 12, fontWeight: '600' },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    detailItem: {},
    detailLabel: { fontSize: 10, marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '500' },
    drugSection: { marginBottom: 16 },
    drugLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
    drugName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    drugDetails: { flexDirection: 'row', gap: 8 },
    drugDetailText: { fontSize: 13 },
    reasonBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
    reasonLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    reasonText: { fontSize: 13 },
    actionFooter: { flexDirection: 'row', gap: 8, paddingTop: 16, borderTopWidth: 1 },
    actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    approveBtn: {},
    rejectBtn: {},
    historyBtn: { borderWidth: 1 },
    actionBtnText: { fontSize: 13, fontWeight: '600' },
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
    confirmRejectBtn: {},
    cancelBtnText: { fontWeight: '600' },
    confirmRejectBtnText: { color: '#fff', fontWeight: '600' },

    // Full Screen Modal
    fullScreenModal: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1 },
    modalHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
    closeButtonText: { fontSize: 16, fontWeight: '600' },
    modalBody: { padding: 20 },
    summaryCard: { padding: 16, borderRadius: 8, marginBottom: 20 },
    summaryTitle: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    summaryText: { fontSize: 16, fontWeight: 'bold' },
    summarySubtext: { fontSize: 14, marginTop: 2 },
    formSection: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    inputField: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { height: 100 },
    row: { flexDirection: 'row' },
    dateButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12, gap: 10 },
    dateButtonText: { fontSize: 16 },
    readOnlyBox: { padding: 12, borderRadius: 8, borderWidth: 1 },
    readOnlyText: { fontSize: 14 },
    confirmApproveButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 20 },
    confirmApproveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default TreatmentRequestsScreen;
