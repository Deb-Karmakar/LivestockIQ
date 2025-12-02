// Mobile/src/screens/farmer/MRLComplianceScreen.js
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
    Platform,
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
import { useLanguage } from '../../contexts/LanguageContext';

const MRLComplianceScreen = ({ navigation }) => {
    const { t } = useLanguage();
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
        productType: 'Milk',
        residueLevelDetected: '',
        unit: 'µg/kg',
        testDate: new Date(),
        labName: '',
        labLocation: '',
        labCertificationNumber: '',
        testReportNumber: '',
        certificateUrl: '',
        testedBy: '',
        notes: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Picker States
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(null); // 'animal', 'sample', 'product', 'unit'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const animalsData = await getAnimals();
            const animalsList = Array.isArray(animalsData) ? animalsData : (animalsData.data || []);
            setAnimals(animalsList);

            const pendingData = await getPendingMRLTests();
            setPendingTests(Array.isArray(pendingData) ? pendingData : (pendingData.data || []));

            const historyData = await getLabTestHistory();
            setTestHistory(Array.isArray(historyData) ? historyData : (historyData.data || []));

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
            Alert.alert(t('error'), 'Failed to load MRL compliance data');
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
        setTestForm({
            animalId: animalId,
            drugName: '',
            sampleType: 'Milk',
            productType: 'Milk',
            residueLevelDetected: '',
            unit: 'µg/kg',
            testDate: new Date(),
            labName: '',
            labLocation: '',
            labCertificationNumber: '',
            testReportNumber: '',
            certificateUrl: '',
            testedBy: '',
            notes: ''
        });
        setUploadModalVisible(true);
    };

    const handleSubmitTest = async () => {
        // Validation
        if (!testForm.animalId || !testForm.drugName || !testForm.residueLevelDetected ||
            !testForm.labName || !testForm.testReportNumber || !testForm.certificateUrl) {
            Alert.alert(t('error'), t('fill_required'));
            return;
        }

        try {
            await submitLabTest({
                ...testForm,
                drugName: testForm.drugName.trim(),
                labName: testForm.labName.trim(),
                testReportNumber: testForm.testReportNumber.trim(),
                certificateUrl: testForm.certificateUrl.trim(),
                testedBy: testForm.testedBy ? testForm.testedBy.trim() : '',
                notes: testForm.notes ? testForm.notes.trim() : '',
                residueLevelDetected: parseFloat(testForm.residueLevelDetected),
                testDate: testForm.testDate.toISOString(),
            });
            Alert.alert(t('success'), 'Lab test submitted successfully');
            setUploadModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert(t('error'), error.message || 'Failed to submit lab test');
        }
    };

    const openPicker = (type) => {
        setPickerType(type);
        setPickerVisible(true);
    };

    const handlePickerSelect = (value) => {
        if (pickerType === 'animal') setTestForm({ ...testForm, animalId: value });
        else if (pickerType === 'sample') setTestForm({ ...testForm, sampleType: value });
        else if (pickerType === 'product') setTestForm({ ...testForm, productType: value });
        else if (pickerType === 'unit') setTestForm({ ...testForm, unit: value });
        setPickerVisible(false);
    };

    const getPickerOptions = () => {
        switch (pickerType) {
            case 'animal':
                return animals.map(a => ({ label: `${a.name} (${a.tagId})`, value: a.tagId }));
            case 'sample':
                return ['Milk', 'Blood', 'Meat', 'Tissue', 'Urine', 'Eggs'].map(v => ({ label: v, value: v }));
            case 'product':
                return ['Milk', 'Meat', 'Eggs', 'Honey', 'Fish'].map(v => ({ label: v, value: v }));
            case 'unit':
                return ['µg/kg', 'ppb', 'mg/kg', 'ppm'].map(v => ({ label: v, value: v }));
            default:
                return [];
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.mrlStatus) {
            case 'SAFE':
                return { color: '#10b981', bg: '#d1fae5', text: t('safe_for_sale'), icon: 'checkmark-circle' };
            case 'PENDING_VERIFICATION':
                return { color: '#3b82f6', bg: '#dbeafe', text: t('pending_verification'), icon: 'time' };
            case 'TEST_REQUIRED':
                return { color: '#f59e0b', bg: '#fef3c7', text: t('test_required'), icon: 'alert-circle' };
            case 'VIOLATION':
                return { color: '#ef4444', bg: '#fee2e2', text: t('mrl_violation'), icon: 'warning' };
            case 'WITHDRAWAL_ACTIVE':
                return { color: '#f97316', bg: '#ffedd5', text: t('withdrawal_active'), icon: 'hand-left' };
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
                    <Text style={styles.statLabel}>{t('safe')}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{Object.values(mrlStatuses).filter(s => s.mrlStatus === 'TEST_REQUIRED').length}</Text>
                    <Text style={styles.statLabel}>{t('test_required')}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{Object.values(mrlStatuses).filter(s => s.mrlStatus === 'VIOLATION').length}</Text>
                    <Text style={styles.statLabel}>{t('violations')}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{pendingTests.length}</Text>
                    <Text style={styles.statLabel}>{t('pending')}</Text>
                </View>
            </View>

            {/* Animals List */}
            {animals.map((animal) => {
                const status = mrlStatuses[animal.tagId];
                const badge = getStatusBadge(status);

                // Logic from web: Disable if Withdrawal Active, Safe, or Pending Verification (unless violation resolved)
                const isPendingVerification = status?.details?.labTests?.[0]?.status === 'Pending Verification';
                const isViolationResolved = status?.details?.labTests?.[0]?.violationResolved;

                const isDisabled =
                    status?.mrlStatus === 'WITHDRAWAL_ACTIVE' ||
                    status?.mrlStatus === 'SAFE' ||
                    (isPendingVerification && !isViolationResolved);

                return (
                    <View key={animal.tagId} style={styles.card}>
                        <View style={styles.cardRow}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.animalId}>{animal.tagId}</Text>
                                    <View style={styles.speciesTag}>
                                        <Text style={styles.speciesText}>{animal.species}</Text>
                                    </View>
                                </View>
                                <Text style={styles.animalName}>{animal.name}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                <Ionicons name={badge.icon} size={14} color={badge.color} />
                                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.uploadButton,
                                isDisabled && styles.uploadButtonDisabled
                            ]}
                            onPress={() => handleOpenUpload(animal.tagId)}
                            disabled={isDisabled}
                        >
                            <Ionicons
                                name={isDisabled ? "lock-closed" : "cloud-upload"}
                                size={16}
                                color={isDisabled ? "#9ca3af" : "#10b981"}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[
                                styles.uploadButtonText,
                                isDisabled && styles.uploadButtonTextDisabled
                            ]}>
                                {isDisabled
                                    ? (status?.mrlStatus === 'SAFE' ? t('safe_no_test') : t('upload_disabled'))
                                    : t('upload_test')}
                            </Text>
                        </TouchableOpacity>

                        {isDisabled && status?.mrlStatus === 'WITHDRAWAL_ACTIVE' && (
                            <Text style={styles.statusNote}>
                                {t('cannot_upload_withdrawal')}
                            </Text>
                        )}
                        {isDisabled && isPendingVerification && !isViolationResolved && (
                            <Text style={styles.statusNote}>
                                {t('pending_verification_msg')}
                            </Text>
                        )}
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
                    <Text style={styles.emptyText}>{t('no_pending_tests')}</Text>
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
                            <Text style={styles.uploadButtonText}>{t('upload_test')}</Text>
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
                    <Text style={styles.emptyText}>{t('no_test_history')}</Text>
                </View>
            ) : (
                testHistory.map((test) => (
                    <View key={test._id} style={styles.card}>
                        <View style={styles.cardRow}>
                            <Text style={styles.animalId}>{test.animalId}</Text>
                            <View style={[styles.badge, { backgroundColor: test.isPassed ? '#d1fae5' : '#fee2e2' }]}>
                                <Text style={{ color: test.isPassed ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 'bold' }}>
                                    {test.isPassed ? t('passed') : t('failed')}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.grid}>
                            <View>
                                <Text style={styles.label}>{t('drug_name_label')}</Text>
                                <Text style={styles.value}>{test.drugName}</Text>
                            </View>
                            <View>
                                <Text style={styles.label}>{t('result')}</Text>
                                <Text style={styles.value}>{test.residueLevelDetected} {test.unit}</Text>
                            </View>
                        </View>
                        <Text style={[styles.detailText, { marginTop: 8 }]}>{t('report')}: {test.testReportNumber}</Text>
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
                <Text style={styles.headerTitle}>{t('mrl_title')}</Text>
                <Text style={styles.headerSubtitle}>{t('mrl_subtitle')}</Text>
            </LinearGradient>

            <View style={styles.tabs}>
                {['overview', 'pending', 'history'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {t(tab)}
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

            {/* Upload Modal */}
            <Modal visible={uploadModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('upload_lab_test')}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>

                            {/* Animal Selection */}
                            <Text style={styles.label}>{t('animal_id')} *</Text>
                            <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('animal')}>
                                <Text style={styles.dropdownText}>{testForm.animalId || t('select_animal')}</Text>
                                <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </TouchableOpacity>

                            {/* Drug Name */}
                            <Text style={styles.label}>{t('drug_name_label')}</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.drugName}
                                onChangeText={(text) => setTestForm({ ...testForm, drugName: text })}
                                placeholder={t('drug_name_placeholder')}
                            />

                            {/* Sample & Product Type */}
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('sample_type')} *</Text>
                                    <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('sample')}>
                                        <Text style={styles.dropdownText}>{testForm.sampleType}</Text>
                                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('product_type')} *</Text>
                                    <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('product')}>
                                        <Text style={styles.dropdownText}>{testForm.productType}</Text>
                                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Residue & Unit */}
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('residue_level')} *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={testForm.residueLevelDetected}
                                        onChangeText={(text) => setTestForm({ ...testForm, residueLevelDetected: text })}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('unit')} *</Text>
                                    <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('unit')}>
                                        <Text style={styles.dropdownText}>{testForm.unit}</Text>
                                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Lab Info */}
                            <Text style={styles.label}>{t('lab_name')} *</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.labName}
                                onChangeText={(text) => setTestForm({ ...testForm, labName: text })}
                                placeholder="e.g., National MRL Testing Lab"
                            />

                            <Text style={styles.label}>{t('lab_location')}</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.labLocation}
                                onChangeText={(text) => setTestForm({ ...testForm, labLocation: text })}
                                placeholder="e.g., Mumbai, Maharashtra"
                            />

                            {/* Report Info */}
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('report_number')} *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={testForm.testReportNumber}
                                        onChangeText={(text) => setTestForm({ ...testForm, testReportNumber: text })}
                                        placeholder="Report #"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('cert_number')}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={testForm.labCertificationNumber}
                                        onChangeText={(text) => setTestForm({ ...testForm, labCertificationNumber: text })}
                                        placeholder="Cert #"
                                    />
                                </View>
                            </View>

                            {/* Date & Tester */}
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('test_date')} *</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                                        <Text>{testForm.testDate.toLocaleDateString()}</Text>
                                        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('tested_by')}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={testForm.testedBy}
                                        onChangeText={(text) => setTestForm({ ...testForm, testedBy: text })}
                                        placeholder="Name"
                                    />
                                </View>
                            </View>
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

                            {/* Certificate URL */}
                            <Text style={styles.label}>{t('certificate_url')} *</Text>
                            <TextInput
                                style={styles.input}
                                value={testForm.certificateUrl}
                                onChangeText={(text) => setTestForm({ ...testForm, certificateUrl: text })}
                                placeholder="https://..."
                                autoCapitalize="none"
                            />

                            {/* Notes */}
                            <Text style={styles.label}>{t('notes_label')}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={testForm.notes}
                                onChangeText={(text) => setTestForm({ ...testForm, notes: text })}
                                placeholder={t('notes_placeholder')}
                                multiline
                                numberOfLines={3}
                            />

                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setUploadModalVisible(false)}>
                                <Text style={styles.buttonText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmitTest}>
                                <Text style={[styles.buttonText, { color: '#fff' }]}>{t('submit_review')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Selection Picker Modal */}
            <Modal visible={pickerVisible} animationType="fade" transparent={true}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Select {pickerType}</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {getPickerOptions().map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={styles.pickerOption}
                                    onPress={() => handlePickerSelect(option.value)}
                                >
                                    <Text style={styles.pickerOptionText}>{option.label}</Text>
                                    {((pickerType === 'animal' && testForm.animalId === option.value) ||
                                        (pickerType === 'sample' && testForm.sampleType === option.value) ||
                                        (pickerType === 'product' && testForm.productType === option.value) ||
                                        (pickerType === 'unit' && testForm.unit === option.value)) && (
                                            <Ionicons name="checkmark" size={20} color="#10b981" />
                                        )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
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
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#f9fafb' },
    textArea: { height: 80, textAlignVertical: 'top' },
    dateButton: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f3f4f6' },
    submitButton: { backgroundColor: '#10b981' },
    buttonText: { fontWeight: '600' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    dropdown: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' },
    dropdownText: { color: '#1f2937' },
    pickerContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '80%', alignSelf: 'center', maxHeight: '60%' },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerOptionText: { fontSize: 16, color: '#374151' },
    speciesTag: { backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    speciesText: { fontSize: 10, color: '#0284c7', fontWeight: '600', textTransform: 'uppercase' },
    uploadButtonDisabled: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', borderWidth: 1 },
    uploadButtonTextDisabled: { color: '#9ca3af' },
    statusNote: { fontSize: 11, color: '#ef4444', marginTop: 4, fontStyle: 'italic' },
});

export default MRLComplianceScreen;
