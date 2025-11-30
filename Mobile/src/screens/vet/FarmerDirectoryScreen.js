import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    Modal,
    Linking,
    ScrollView,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyFarmers, getAnimalsForFarmer, reportFarmer } from '../../services/vetService';

const FarmerDirectoryScreen = () => {
    const [farmers, setFarmers] = useState([]);
    const [filteredFarmers, setFilteredFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [animalsModalVisible, setAnimalsModalVisible] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [farmerAnimals, setFarmerAnimals] = useState([]);
    const [animalsLoading, setAnimalsLoading] = useState(false);

    // Report Form
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');

    const fetchFarmers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMyFarmers();
            setFarmers(data || []);
            setFilteredFarmers(data || []);
        } catch (error) {
            console.error('Error fetching farmers:', error);
            Alert.alert('Error', 'Failed to load farmers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFarmers();
    }, [fetchFarmers]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredFarmers(farmers);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = farmers.filter(
                f =>
                    f.farmOwner.toLowerCase().includes(lowerTerm) ||
                    f.farmName.toLowerCase().includes(lowerTerm)
            );
            setFilteredFarmers(filtered);
        }
    }, [searchTerm, farmers]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchFarmers();
    };

    const handleViewAnimals = async (farmer) => {
        setSelectedFarmer(farmer);
        setAnimalsModalVisible(true);
        setAnimalsLoading(true);
        try {
            const data = await getAnimalsForFarmer(farmer._id);
            setFarmerAnimals(data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to load animals');
        } finally {
            setAnimalsLoading(false);
        }
    };

    const handleReportPress = (farmer) => {
        setSelectedFarmer(farmer);
        setReportReason('');
        setReportDetails('');
        setReportModalVisible(true);
    };

    const submitReport = async () => {
        if (!reportReason || !reportDetails.trim()) {
            Alert.alert('Error', 'Please select a reason and provide details');
            return;
        }

        try {
            await reportFarmer({
                farmerId: selectedFarmer._id,
                reason: reportReason,
                details: reportDetails
            });
            setReportModalVisible(false);
            Alert.alert('Success', 'Report submitted successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to submit report');
        }
    };

    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        } else {
            Alert.alert('Error', 'No phone number available');
        }
    };

    const handleEmail = (email) => {
        if (email) {
            Linking.openURL(`mailto:${email}`);
        } else {
            Alert.alert('Error', 'No email available');
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const diff = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(diff);
        const years = Math.abs(ageDate.getUTCFullYear() - 1970);
        const months = ageDate.getUTCMonth();
        return years > 0 ? `${years}y ${months}m` : `${months}m`;
    };

    const renderFarmer = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.farmOwner?.charAt(0) || 'F'}
                    </Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.farmerName}>{item.farmOwner}</Text>
                    <Text style={styles.farmName}>{item.farmName}</Text>
                </View>
                <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => handleReportPress(item)}
                >
                    <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.primaryBtn]}
                    onPress={() => handleViewAnimals(item)}
                >
                    <Ionicons name="paw" size={16} color="#2563eb" />
                    <Text style={styles.primaryBtnText}>View Animals</Text>
                </TouchableOpacity>
                <View style={styles.contactActions}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleCall(item.phoneNumber)}
                    >
                        <Ionicons name="call-outline" size={20} color="#4b5563" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleEmail(item.email)}
                    >
                        <Ionicons name="mail-outline" size={20} color="#4b5563" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <Ionicons name="people" size={16} color="#60a5fa" />
                        <Text style={styles.headerLabel}>Farmer Management</Text>
                    </View>
                    <Text style={styles.headerTitle}>Farmer Directory</Text>
                    <Text style={styles.headerSubtitle}>
                        Manage <Text style={styles.highlightText}>{farmers.length} assigned farmers</Text> under your supervision.
                    </Text>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by farmer or farm name..."
                            placeholderTextColor="#9ca3af"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={filteredFarmers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderFarmer}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>No farmers found</Text>
                        </View>
                    }
                />
            )}

            {/* Animals Modal */}
            <Modal
                visible={animalsModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setAnimalsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Livestock Registry</Text>
                        <TouchableOpacity onPress={() => setAnimalsModalVisible(false)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalSubHeader}>
                        <Text style={styles.modalSubtitle}>
                            Animals for {selectedFarmer?.farmName}
                        </Text>
                    </View>

                    {animalsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#2563eb" />
                        </View>
                    ) : (
                        <FlatList
                            data={farmerAnimals}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.animalsList}
                            renderItem={({ item }) => (
                                <View style={styles.animalRow}>
                                    <View>
                                        <Text style={styles.animalId}>{item.tagId}</Text>
                                        <Text style={styles.animalSpecies}>{item.species} • {item.gender}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.animalAge}>{calculateAge(item.dob)}</Text>
                                        <Text style={styles.animalName}>{item.name || 'No Name'}</Text>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No animals found for this farmer.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Modal>

            {/* Report Modal */}
            <Modal
                visible={reportModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setReportModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.reportModalContent}>
                        <Text style={styles.reportTitle}>Report Non-Compliance</Text>
                        <Text style={styles.reportSubtitle}>
                            Report {selectedFarmer?.farmName} to regulatory authority.
                        </Text>

                        <Text style={styles.label}>Reason</Text>
                        <View style={styles.reasonButtons}>
                            {[
                                'Suspected Overuse of Antibiotics',
                                'Poor Record-Keeping',
                                'Failure to Follow Withdrawal Periods',
                                'Other'
                            ].map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[
                                        styles.reasonBtn,
                                        reportReason === reason && styles.activeReasonBtn
                                    ]}
                                    onPress={() => setReportReason(reason)}
                                >
                                    <Text style={[
                                        styles.reasonBtnText,
                                        reportReason === reason && styles.activeReasonBtnText
                                    ]}>
                                        {reason}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Details</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Provide specific details..."
                            value={reportDetails}
                            onChangeText={setReportDetails}
                            multiline
                            textAlignVertical="top"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setReportModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.submitReportBtn]}
                                onPress={submitReport}
                            >
                                <Text style={styles.submitReportBtnText}>Submit Report</Text>
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
    headerLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    headerSubtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 20 },
    highlightText: { color: '#60a5fa', fontWeight: '600' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 44, color: '#fff', fontSize: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#1e40af' },
    headerInfo: { flex: 1 },
    farmerName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    farmName: { fontSize: 14, color: '#6b7280' },
    moreBtn: { padding: 4 },
    cardActions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
    primaryBtn: { backgroundColor: '#eff6ff' },
    primaryBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
    contactActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af' },

    // Animals Modal
    modalContainer: { flex: 1, backgroundColor: '#f3f4f6' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    closeBtnText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
    modalSubHeader: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    modalSubtitle: { fontSize: 14, color: '#6b7280' },
    animalsList: { padding: 16 },
    animalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    animalId: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    animalSpecies: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    animalAge: { fontSize: 14, fontWeight: '500', color: '#374151' },
    animalName: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

    // Report Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    reportModalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' },
    reportTitle: { fontSize: 18, fontWeight: 'bold', color: '#b91c1c', marginBottom: 4 },
    reportSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    reasonButtons: { gap: 8, marginBottom: 20 },
    reasonBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
    activeReasonBtn: { borderColor: '#b91c1c', backgroundColor: '#fef2f2' },
    reasonBtnText: { fontSize: 13, color: '#4b5563' },
    activeReasonBtnText: { color: '#b91c1c', fontWeight: '600' },
    textArea: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, height: 100, marginBottom: 20, fontSize: 14 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    cancelBtn: { backgroundColor: '#f3f4f6' },
    submitReportBtn: { backgroundColor: '#ef4444' },
    cancelBtnText: { color: '#4b5563', fontWeight: '600' },
    submitReportBtnText: { color: '#fff', fontWeight: '600' },
});

export default FarmerDirectoryScreen;
