import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAnimals } from '../../services/animalService';
import {
    getAnimalMRLStatus,
    getPendingMRLTests,
    getLabTestHistory,
    submitLabTest,
} from '../../services/mrlService';
import DateTimePicker from '@react-native-community/datetimepicker';

const MRLComplianceScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, pending, history
    const [animals, setAnimals] = useState([]);
    const [mrlStatuses, setMRLStatuses] = useState({});
    const [pendingTests, setPendingTests] = useState([]);
    const [testHistory, setTestHistory] = useState([]);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);

    // Form State
    const [testForm, setTestForm] = useState({
        animalId: '',
        drugName: '',
        sampleType: 'Milk',
        residueLevelDetected: '',
        unit: 'µg/kg',
        testDate: new Date(),
        labName: '',
        testReportNumber: '',
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const animalsData = await getAnimals();
            const animalsList = Array.isArray(animalsData) ? animalsData : [];
            setAnimals(animalsList);

            const pendingData = await getPendingMRLTests();
            setPendingTests(Array.isArray(pendingData) ? pendingData : []);

            const historyData = await getLabTestHistory();
            setTestHistory(Array.isArray(historyData) ? historyData : []);

            // MRL Statuses
            const statusPromises = animalsList.map(a =>
                getAnimalMRLStatus(a.tagId).catch(() => null)
            );
            const allStatuses = await Promise.all(statusPromises);
            const statusMap = {};
            animalsList.forEach((animal, index) => {
                if (allStatuses[index]) {
                    statusMap[animal.tagId] = allStatuses[index];
                }
            });
            setMRLStatuses(statusMap);

        } catch (error) {
            console.error('Error fetching MRL data:', error);
            Alert.alert('Error', 'Failed to load MRL compliance data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleOpenUpload = (animalId = '') => {
        setTestForm(prev => ({ ...prev, animalId }));
        setUploadModalVisible(true);
    };

    const handleSubmitTest = async () => {
        if (!testForm.animalId || !testForm.drugName || !testForm.residueLevelDetected || !testForm.labName || !testForm.testReportNumber) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            await submitLabTest({
                ...testForm,
                residueLevelDetected: parseFloat(testForm.residueLevelDetected),
                testDate: testForm.testDate.toISOString(),
            });
            Alert.alert('Success', 'Lab test submitted successfully');
            setUploadModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to submit lab test');
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.mrlStatus) {
            case 'SAFE':
                return { color: '#10b981', bg: '#d1fae5', text: 'Safe', icon: 'checkmark-circle' };
            case 'PENDING_VERIFICATION':
                return { color: '#3b82f6', bg: '#dbeafe', text: 'Pending', icon: 'time' };
            case 'TEST_REQUIRED':
                return { color: '#f59e0b', bg: '#fef3c7', text: 'Test Req', icon: 'alert-circle' };
            case 'VIOLATION':
                return { color: '#ef4444', bg: '#fee2e2', text: 'Violation', icon: 'warning' };
            case 'WITHDRAWAL_ACTIVE':
                return { color: '#f97316', bg: '#ffedd5', text: 'Withdrawal', icon: 'hand-left' };
            default:
                return { color: '#6b7280', bg: '#f3f4f6', text: 'No Data', icon: 'help-circle' };
        }
    };

    const renderOverview = () => (
        <View>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{Object.values(mrlStatuses).filter(s => s.mrlStatus === 'SAFE').length}</Text>
                    <Text style={styles.statLabel}>Safe</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{Object.values(mrlStatuses).filter(s => s.mrlStatus === 'TEST_REQUIRED').length}</Text>
                    <Text style={styles.statLabel}>Test Req</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{Object.values(mrlStatuses).filter(s => s.mrlStatus === 'VIOLATION').length}</Text>
                    <Text style={styles.statLabel}>Violations</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{pendingTests.length}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
            </View>

            {/* Animals List */}
            {animals.map((animal) => {
                const status = mrlStatuses[animal.tagId];
                const badge = getStatusBadge(status);
                return (
                    <View key={animal.tagId} style={styles.card}>
                        <View style={styles.cardRow}>
                            <View>
                                <Text style={styles.animalId}>{animal.tagId}</Text>
                                <Text style={styles.animalName}>{animal.name}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                <Ionicons name={badge.icon} size={14} color={badge.color} />
                                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={() => handleOpenUpload(animal.tagId)}
                            disabled={status?.mrlStatus === 'WITHDRAWAL_ACTIVE' || status?.mrlStatus === 'SAFE'}
                        >
                            <Text style={styles.uploadButtonText}>Upload Test</Text>
                        </TouchableOpacity>
                    </View>
                );
            })}
        </View>
    );

    const renderPending = () => (
        <View>
            {pendingTests.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                    <Text style={styles.emptyText}>No pending tests</Text>
                </View>
            ) : (
                pendingTests.map((item) => (
                    <View key={item.animalId} style={styles.card}>
                        <Text style={styles.animalId}>{item.animalId}</Text>
                        <Text style={styles.animalName}>{item.animalName}</Text>
                        <Text style={styles.detailText}>Last treated: {new Date(item.lastTreatmentDate).toLocaleDateString()}</Text>
                        <TouchableOpacity
                            style={[styles.uploadButton, { marginTop: 12 }]}
                            onPress={() => handleOpenUpload(item.animalId)}
                        >
                            <Text style={styles.uploadButtonText}>Upload Test</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </View>
    );

    const renderHistory = () => (
        <View>
            {testHistory.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>No test history</Text>
                </View>
            ) : (
                testHistory.map((test) => (
                    <View key={test._id} style={styles.card}>
                        <View style={styles.cardRow}>
                            <Text style={styles.animalId}>{test.animalId}</Text>
                            <View style={[styles.badge, { backgroundColor: test.isPassed ? '#d1fae5' : '#fee2e2' }]}>
                                <Text style={{ color: test.isPassed ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 'bold' }}>
                                    {test.isPassed ? 'Passed' : 'Failed'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.grid}>
                            <View>
                                <Text style={styles.label}>Drug</Text>
                                <Text style={styles.value}>{test.drugName}</Text>
                            </View>
                            <View>
                                <Text style={styles.label}>Result</Text>
                                <Text style={styles.value}>{test.residueLevelDetected} {test.unit}</Text>
                            </View>
                        </View>
                        <Text style={[styles.detailText, { marginTop: 8 }]}>Report: {test.testReportNumber}</Text>
                    </View>
                ))
            )}
        </View>
    );

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
                <Text style={styles.headerTitle}>MRL Compliance</Text>
                <Text style={styles.headerSubtitle}>Monitor residue limits & safety</Text>
            </LinearGradient>

            <View style={styles.tabs}>
                {['overview', 'pending', 'history'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'pending' && renderPending()}
                {activeTab === 'history' && renderHistory()}
            </ScrollView>

            <Modal visible={uploadModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Upload Lab Test</Text>
                        <ScrollView>
                            <Text style={styles.label}>Animal ID</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.animalId}
                                onChangeText={(text) => setTestForm({ ...testForm, animalId: text })}
                                placeholder="Animal ID"
                            />

                            <Text style={styles.label}>Drug Name</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.drugName}
                                onChangeText={(text) => setTestForm({ ...testForm, drugName: text })}
                                placeholder="Drug Name"
                            />

                            <Text style={styles.label}>Residue Level</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.residueLevelDetected}
                                onChangeText={(text) => setTestForm({ ...testForm, residueLevelDetected: text })}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Lab Name</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.labName}
                                onChangeText={(text) => setTestForm({ ...testForm, labName: text })}
                                placeholder="Lab Name"
                            />

                            <Text style={styles.label}>Report Number</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.testReportNumber}
                                onChangeText={(text) => setTestForm({ ...testForm, testReportNumber: text })}
                                placeholder="Report #"
                            />

                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                                <Text>Test Date: {testForm.testDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={testForm.testDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setTestForm({ ...testForm, testDate: selectedDate });
                                    }}
                                />
                            )}
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setUploadModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmitTest}>
                                <Text style={[styles.buttonText, { color: '#fff' }]}>Submit</Text>
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { color: '#94a3b8', marginTop: 4 },
    tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 4 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#10b981' },
    tabText: { color: '#6b7280', fontWeight: '600' },
    activeTabText: { color: '#10b981' },
    content: { padding: 16 },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    statLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    animalId: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    animalName: { fontSize: 14, color: '#6b7280' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    uploadButton: { marginTop: 8, padding: 8, backgroundColor: '#ecfdf5', borderRadius: 6, alignItems: 'center' },
    uploadButtonText: { color: '#10b981', fontWeight: '600', fontSize: 12 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 12, color: '#9ca3af' },
    grid: { flexDirection: 'row', gap: 16, marginTop: 12 },
    label: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' },
    value: { fontSize: 14, color: '#374151', fontWeight: '500' },
    detailText: { fontSize: 12, color: '#6b7280' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
    dateButton: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 16 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f3f4f6' },
    submitButton: { backgroundColor: '#10b981' },
    buttonText: { fontWeight: '600' },
});

export default MRLComplianceScreen;
