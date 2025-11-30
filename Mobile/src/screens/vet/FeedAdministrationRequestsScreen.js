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

const FeedAdministrationRequestsScreen = () => {
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
            Alert.alert('Error', 'Failed to load feed requests');
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

    const handleApprove = async () => {
        if (!selectedRequest) return;
        try {
            await approveFeedAdministration(selectedRequest._id, vetNotes);
            setApproveModalVisible(false);
            Alert.alert('Success', 'Feed administration approved');
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to approve request');
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        if (!rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a rejection reason');
            return;
        }
        try {
            await rejectFeedAdministration(selectedRequest._id, rejectionReason);
            setRejectModalVisible(false);
            Alert.alert('Success', 'Feed administration rejected');
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to reject request');
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
            case 'Active': return '#10b981';
            case 'Rejected': return '#ef4444';
            default: return '#f59e0b';
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
                    <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status === 'Pending Approval' ? 'Pending' : item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Feed:</Text>
                        <Text style={styles.detailValue}>{item.feedId?.feedName || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Antimicrobial:</Text>
                        <Text style={styles.detailValue}>{item.feedId?.antimicrobialName || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Group/Animals:</Text>
                        <Text style={styles.detailValue}>{item.groupName || `${animalCount} animal(s)`}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantity:</Text>
                        <Text style={styles.detailValue}>{item.feedQuantityUsed} {item.feedId?.unit || 'kg'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Start Date:</Text>
                        <Text style={styles.detailValue}>
                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Withdrawal End:</Text>
                        <Text style={styles.detailValue}>
                            {item.withdrawalEndDate ? new Date(item.withdrawalEndDate).toLocaleDateString() : 'TBD'}
                        </Text>
                    </View>
                </View>

                {item.notes && (
                    <View style={styles.notesBox}>
                        <Text style={styles.notesLabel}>Farmer Notes:</Text>
                        <Text style={styles.notesText}>{item.notes}</Text>
                    </View>
                )}

                {item.animals && item.animals.length > 0 && (
                    <View style={styles.animalsList}>
                        <Text style={styles.animalsLabel}>Animals in this Request:</Text>
                        <View style={styles.tagsContainer}>
                            {item.animals.map(animal => (
                                <TouchableOpacity
                                    key={animal.tagId}
                                    style={styles.animalTag}
                                    onPress={() => navigation.navigate('AnimalHistory', { animalId: animal.tagId })}
                                >
                                    <Text style={styles.animalTagText}>{animal.tagId}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {isPending && (
                    <View style={styles.actionFooter}>
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
                    </View>
                )}
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
                        <Ionicons name="nutrition" size={16} color="#a78bfa" />
                        <Text style={styles.headerLabel}>Feed Verification</Text>
                    </View>
                    <Text style={styles.headerTitle}>Feed Requests</Text>
                    <Text style={styles.headerSubtitle}>
                        Review and manage <Text style={styles.highlightText}>{requests.filter(r => r.status === 'Pending Approval').length} pending</Text> feed administrations.
                    </Text>
                </View>
            </LinearGradient>

            <View style={styles.tabBar}>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'Pending Approval', label: 'Pending' },
                    { key: 'Active', label: 'Approved' },
                    { key: 'Rejected', label: 'Rejected' }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                            {tab.label}
                        </Text>
                        {activeTab === tab.key && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
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
                            <Ionicons name="nutrition-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>No requests found</Text>
                        </View>
                    }
                />
            )}

            {/* Approve Modal */}
            <Modal
                visible={approveModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setApproveModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Approve Feed Administration</Text>
                        <Text style={styles.modalSubtitle}>
                            Add optional notes for the farmer.
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Vet Notes..."
                            value={vetNotes}
                            onChangeText={setVetNotes}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setApproveModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmApproveBtn]}
                                onPress={handleApprove}
                            >
                                <Text style={styles.confirmApproveBtnText}>Approve</Text>
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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Request</Text>
                        <Text style={styles.modalSubtitle}>
                            Please provide a reason for rejection. This will restore inventory.
                        </Text>
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
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerContent: {},
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    headerLabel: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    headerSubtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
    highlightText: { color: '#fb923c', fontWeight: '600' },
    tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTab: {},
    tabText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    activeTabText: { color: '#8b5cf6', fontWeight: '600' },
    activeIndicator: { position: 'absolute', bottom: 0, width: '100%', height: 2, backgroundColor: '#8b5cf6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    farmerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 16, fontWeight: 'bold', color: '#7e22ce' },
    farmerName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    farmName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: '600' },
    detailsSection: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    detailLabel: { fontSize: 13, color: '#6b7280' },
    detailValue: { fontSize: 13, fontWeight: '500', color: '#1f2937' },
    notesBox: { backgroundColor: '#fff7ed', padding: 12, borderRadius: 8, marginBottom: 12 },
    notesLabel: { fontSize: 12, fontWeight: '600', color: '#c2410c', marginBottom: 4 },
    notesText: { fontSize: 13, color: '#9a3412' },
    animalsList: { marginBottom: 16 },
    animalsLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    animalTag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#dbeafe' },
    animalTagText: { fontSize: 12, color: '#2563eb', fontWeight: '500' },
    actionFooter: { flexDirection: 'row', gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    approveBtn: { backgroundColor: '#10b981' },
    rejectBtn: { backgroundColor: '#ef4444' },
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
    confirmApproveBtn: { backgroundColor: '#10b981' },
    confirmRejectBtn: { backgroundColor: '#ef4444' },
    cancelBtnText: { color: '#4b5563', fontWeight: '600' },
    confirmApproveBtnText: { color: '#fff', fontWeight: '600' },
    confirmRejectBtnText: { color: '#fff', fontWeight: '600' },
});

export default FeedAdministrationRequestsScreen;
