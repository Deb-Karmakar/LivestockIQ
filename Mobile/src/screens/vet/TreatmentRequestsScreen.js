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

const TreatmentRequestsScreen = () => {
    const navigation = useNavigation();
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
            Alert.alert('Error', 'Failed to load treatment requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

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

            await approveTreatment(selectedRequest._id, updateData);
            setApproveModalVisible(false);
            Alert.alert('Success', 'Treatment approved successfully');
            fetchRequests();
        } catch (error) {
            console.error('Approve error:', error);
            Alert.alert('Error', 'Failed to approve treatment');
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
            Alert.alert('Error', 'Please provide a reason for rejection');
            return;
        }

        try {
            await rejectTreatment(selectedRequest._id, rejectionReason);
            setRejectModalVisible(false);
            Alert.alert('Success', 'Treatment rejected');
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to reject treatment');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return '#10b981';
            case 'Rejected': return '#ef4444';
            default: return '#f59e0b';
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
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.farmerInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {item.farmerId?.farmOwner?.charAt(0) || 'F'}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.farmerName}>{item.farmerId?.farmOwner || 'Unknown Farmer'}</Text>
                            <Text style={styles.farmName}>
                                <Ionicons name="location" size={12} color="#6b7280" /> {item.farmerId?.farmName || 'Unknown Farm'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status || 'Pending') }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status || 'Pending') }]}>
                            {item.status || 'Pending'}
                        </Text>
                    </View>
                </View>

                <View style={styles.animalSection}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="paw" size={14} color="#4b5563" />
                        <Text style={styles.sectionTitle}>Animal Details</Text>
                    </View>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>ID</Text>
                            <Text style={styles.detailValue}>{item.animalId}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Species</Text>
                            <Text style={styles.detailValue}>{item.animal?.species || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Gender</Text>
                            <Text style={styles.detailValue}>{item.animal?.gender || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Age</Text>
                            <Text style={styles.detailValue}>{age}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.drugSection}>
                    <Text style={styles.drugLabel}>DRUG USED</Text>
                    <Text style={styles.drugName}>{item.drugName}</Text>
                    <View style={styles.drugDetails}>
                        <Text style={styles.drugDetailText}>Dosage: {item.dosageAmount} {item.dosageUnit}</Text>
                        <Text style={styles.drugDetailText}>•</Text>
                        <Text style={styles.drugDetailText}>Withdrawal: {item.withdrawalPeriodDays} days</Text>
                    </View>
                </View>

                {item.reason && (
                    <View style={styles.reasonBox}>
                        <Text style={styles.reasonLabel}>Rejection Reason:</Text>
                        <Text style={styles.reasonText}>{item.reason}</Text>
                    </View>
                )}

                <View style={styles.actionFooter}>
                    {isPending && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.approveBtn]}
                                onPress={() => openApproveModal(item)}
                            >
                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                <Text style={styles.actionBtnText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => openRejectModal(item)}
                            >
                                <Ionicons name="close-circle" size={18} color="#fff" />
                                <Text style={styles.actionBtnText}>Reject</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.historyBtn, !isPending && { flex: 1 }]}
                        onPress={() => navigation.navigate('AnimalHistory', { animalId: item.animalId })}
                    >
                        <Ionicons name="document-text" size={18} color="#4b5563" />
                        <Text style={[styles.actionBtnText, { color: '#4b5563' }]}>History</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <Ionicons name="clipboard" size={16} color="#60a5fa" />
                        <Text style={styles.headerLabel}>Verification Requests</Text>
                    </View>
                    <Text style={styles.headerTitle}>Treatment Requests</Text>
                    <Text style={styles.headerSubtitle}>
                        Review and manage <Text style={styles.highlightText}>{requests.filter(r => (r.status || 'Pending') === 'Pending').length} pending</Text> verification requests.
                    </Text>
                </View>
            </LinearGradient>

            <View style={styles.tabBar}>
                {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab}
                        </Text>
                        {activeTab === tab && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={filteredRequests}
                    keyExtractor={(item) => item._id}
                    renderItem={renderRequest}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="file-tray-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} requests found</Text>
                        </View>
                    }
                />
            )}

            {/* Reject Modal */}
            <Modal
                visible={rejectModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Request</Text>
                        <Text style={styles.modalSubtitle}>Please provide a reason for rejection:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Reason..."
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setRejectModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmRejectBtn]}
                                onPress={handleReject}
                            >
                                <Text style={styles.confirmRejectBtnText}>Reject</Text>
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
                <View style={styles.fullScreenModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderTitle}>Review & Approve</Text>
                        <TouchableOpacity onPress={() => setApproveModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Animal Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Animal Summary</Text>
                            <Text style={styles.summaryText}>
                                ID: {selectedRequest?.animalId} • {selectedRequest?.animal?.species}
                            </Text>
                            <Text style={styles.summarySubtext}>
                                {calculateAge(selectedRequest?.animal?.dob)} • {selectedRequest?.animal?.gender}
                            </Text>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            <Text style={styles.label}>Drug Name</Text>
                            <TextInput
                                style={styles.inputField}
                                value={approvalForm.drugName}
                                onChangeText={(text) => setApprovalForm({ ...approvalForm, drugName: text })}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Dose</Text>
                                <TextInput
                                    style={styles.inputField}
                                    value={approvalForm.dose}
                                    onChangeText={(text) => setApprovalForm({ ...approvalForm, dose: text })}
                                />
                            </View>
                            <View style={[styles.formSection, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Route</Text>
                                <TextInput
                                    style={styles.inputField}
                                    value={approvalForm.route}
                                    onChangeText={(text) => setApprovalForm({ ...approvalForm, route: text })}
                                />
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.label}>Withdrawal Start Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => showDatepicker('start')}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#4b5563" />
                                <Text style={styles.dateButtonText}>
                                    {approvalForm.startDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.label}>Withdrawal End Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => showDatepicker('end')}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#4b5563" />
                                <Text style={styles.dateButtonText}>
                                    {approvalForm.withdrawalEndDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.label}>Farmer's Notes</Text>
                            <View style={styles.readOnlyBox}>
                                <Text style={styles.readOnlyText}>
                                    {selectedRequest?.notes || "No notes provided."}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.label}>Vet's Notes & Instructions</Text>
                            <TextInput
                                style={[styles.inputField, styles.textArea]}
                                value={approvalForm.vetNotes}
                                onChangeText={(text) => setApprovalForm({ ...approvalForm, vetNotes: text })}
                                placeholder="Add instructions for the farmer..."
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.confirmApproveButton}
                            onPress={handleConfirmApprove}
                        >
                            <Text style={styles.confirmApproveButtonText}>Save Changes & Approve</Text>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerContent: {},
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    headerLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    headerSubtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
    highlightText: { color: '#fb923c', fontWeight: '600' },
    tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTab: {},
    tabText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    activeTabText: { color: '#3b82f6', fontWeight: '600' },
    activeIndicator: { position: 'absolute', bottom: 0, width: '100%', height: 2, backgroundColor: '#3b82f6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    farmerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 16, fontWeight: 'bold', color: '#166534' },
    farmerName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    farmName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: '600' },
    animalSection: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
    sectionTitle: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    detailItem: {},
    detailLabel: { fontSize: 10, color: '#9ca3af', marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '500', color: '#1f2937' },
    drugSection: { marginBottom: 16 },
    drugLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
    drugName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    drugDetails: { flexDirection: 'row', gap: 8 },
    drugDetailText: { fontSize: 13, color: '#4b5563' },
    reasonBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 },
    reasonLabel: { fontSize: 12, fontWeight: '600', color: '#b91c1c', marginBottom: 4 },
    reasonText: { fontSize: 13, color: '#7f1d1d' },
    actionFooter: { flexDirection: 'row', gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    approveBtn: { backgroundColor: '#10b981' },
    rejectBtn: { backgroundColor: '#ef4444' },
    historyBtn: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
    actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 16, fontSize: 14 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    cancelBtn: { backgroundColor: '#f3f4f6' },
    confirmRejectBtn: { backgroundColor: '#ef4444' },
    cancelBtnText: { color: '#4b5563', fontWeight: '600' },
    confirmRejectBtnText: { color: '#fff', fontWeight: '600' },

    // Full Screen Modal
    fullScreenModal: { flex: 1, backgroundColor: '#f3f4f6' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    closeButtonText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
    modalBody: { padding: 20 },
    summaryCard: { backgroundColor: '#dbeafe', padding: 16, borderRadius: 8, marginBottom: 20 },
    summaryTitle: { fontSize: 12, fontWeight: '600', color: '#1e40af', marginBottom: 4, textTransform: 'uppercase' },
    summaryText: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
    summarySubtext: { fontSize: 14, color: '#60a5fa', marginTop: 2 },
    formSection: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    inputField: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#1f2937' },
    textArea: { height: 100 },
    row: { flexDirection: 'row' },
    dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, gap: 10 },
    dateButtonText: { fontSize: 16, color: '#1f2937' },
    readOnlyBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    readOnlyText: { color: '#6b7280', fontSize: 14 },
    confirmApproveButton: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 20 },
    confirmApproveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default TreatmentRequestsScreen;
