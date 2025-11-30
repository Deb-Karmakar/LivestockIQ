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
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTreatmentRequests, approveTreatment, rejectTreatment } from '../../services/treatmentService';
import { useNavigation } from '@react-navigation/native';

const TreatmentRequestsScreen = () => {
    const navigation = useNavigation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Pending'); // 'All', 'Pending', 'Approved', 'Rejected'
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

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

    const handleApprove = (request) => {
        Alert.alert(
            'Approve Treatment',
            `Approve treatment for ${request.animalId}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await approveTreatment(request._id, {
                                withdrawalPeriodDays: request.withdrawalPeriodDays || 0,
                            });
                            Alert.alert('Success', 'Treatment approved');
                            fetchRequests();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve treatment');
                        }
                    },
                },
            ]
        );
    };

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

    const renderRequest = ({ item }) => {
        const isPending = (item.status || 'Pending') === 'Pending';
        const age = item.animal?.dob ? (() => {
            const diff = Date.now() - new Date(item.animal.dob).getTime();
            const ageDate = new Date(diff);
            const years = Math.abs(ageDate.getUTCFullYear() - 1970);
            const months = ageDate.getUTCMonth();
            return years > 0 ? `${years}y ${months}m` : `${months}m`;
        })() : 'N/A';

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
                                onPress={() => handleApprove(item)}
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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Treatment Requests</Text>
                <Text style={styles.headerSubtitle}>Review and manage verification requests</Text>
            </View>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 10 },
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
});

export default TreatmentRequestsScreen;
