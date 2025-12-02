// Mobile/src/screens/farmer/FeedAdministrationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
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
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, differenceInDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAnimals } from '../../services/animalService';
import { getActiveFeed } from '../../services/feedService';
import {
    getFeedAdministrations,
    recordFeedAdministration,
    completeFeedingProgram
} from '../../services/feedAdministrationService';
import { useLanguage } from '../../contexts/LanguageContext';

const FeedAdministrationScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [administrations, setAdministrations] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [activeFeed, setActiveFeed] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [form, setForm] = useState({
        feedId: '',
        feedName: '', // For display in picker
        isGroupFeeding: false,
        animalId: '',
        animalTag: '', // For display
        groupName: '',
        selectedAnimals: [],
        feedQuantityUsed: '',
        startDate: new Date(),
        notes: ''
    });
    const [showStartDate, setShowStartDate] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(null); // 'feed', 'animal'

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [adminData, animalsData, feedData] = await Promise.all([
                getFeedAdministrations(),
                getAnimals(),
                getActiveFeed()
            ]);
            setAdministrations(Array.isArray(adminData) ? adminData : []);
            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setActiveFeed(Array.isArray(feedData) ? feedData : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert(t('error'), 'Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Filter eligible animals (SAFE, NEW, or undefined status)
    const eligibleAnimals = animals.filter(animal =>
        animal.mrlStatus === 'SAFE' ||
        animal.mrlStatus === 'NEW' ||
        !animal.mrlStatus
    );

    const handleOpenModal = () => {
        setForm({
            feedId: '',
            feedName: '',
            isGroupFeeding: false,
            animalId: '',
            animalTag: '',
            groupName: '',
            selectedAnimals: [],
            feedQuantityUsed: '',
            startDate: new Date(),
            notes: ''
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.feedId || !form.feedQuantityUsed) {
            Alert.alert(t('error'), t('fill_required'));
            return;
        }

        if (form.isGroupFeeding) {
            if (!form.groupName || form.selectedAnimals.length === 0) {
                Alert.alert(t('error'), t('provide_group_name'));
                return;
            }
        } else {
            if (!form.animalId) {
                Alert.alert(t('error'), t('select_an_animal'));
                return;
            }
        }

        try {
            const data = {
                feedId: form.feedId,
                animalIds: form.isGroupFeeding ? form.selectedAnimals : [form.animalId],
                groupName: form.isGroupFeeding ? form.groupName : undefined,
                feedQuantityUsed: Number(form.feedQuantityUsed),
                startDate: form.startDate.toISOString(),
                notes: form.notes
            };

            await recordFeedAdministration(data);
            Alert.alert(t('success'), t('feed_admin_recorded'));
            setModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert(t('error'), error.response?.data?.message || t('failed_record_feed'));
        }
    };



    const toggleAnimalSelection = (animalId) => {
        if (form.selectedAnimals.includes(animalId)) {
            setForm({ ...form, selectedAnimals: form.selectedAnimals.filter(id => id !== animalId) });
        } else {
            setForm({ ...form, selectedAnimals: [...form.selectedAnimals, animalId] });
        }
    };

    const openPicker = (type) => {
        setPickerType(type);
        setPickerVisible(true);
    };

    const handlePickerSelect = (item) => {
        if (pickerType === 'feed') {
            setForm({ ...form, feedId: item._id, feedName: item.feedName });
        } else if (pickerType === 'animal') {
            setForm({ ...form, animalId: item.tagId, animalTag: item.tagId });
        }
        setPickerVisible(false);
    };

    const getWithdrawalInfo = (admin) => {
        const isMedicated = admin.feedId?.prescriptionRequired !== false;
        if (!isMedicated) return { daysLeft: 'N/A', status: 'safe', label: t('safe_for_sale'), color: '#10b981', bg: '#d1fae5' };
        if (!admin.withdrawalEndDate) return { daysLeft: 'N/A', status: 'pending', label: t('pending'), color: '#6b7280', bg: '#f3f4f6' };

        const endDate = new Date(admin.withdrawalEndDate);
        const daysLeft = differenceInDays(endDate, new Date());

        if (daysLeft < 0) return { daysLeft: 0, status: 'safe', label: t('safe_for_sale'), color: '#10b981', bg: '#d1fae5' };
        if (daysLeft <= 5) return { daysLeft, status: 'ending_soon', label: t('ending_soon'), color: '#f59e0b', bg: '#fef3c7' };
        return { daysLeft, status: 'active', label: t('withdrawal_active'), color: '#ef4444', bg: '#fee2e2' };
    };

    const stats = {
        total: administrations.length,
        active: administrations.filter(a => a.status === 'Active' && !a.endDate).length,
        medicated: administrations.filter(a => a.feedId?.prescriptionRequired).length,
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c1d95', '#5b21b6', '#4c1d95']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>{t('feed_admin_title')}</Text>
                        <Text style={styles.headerSubtitle}>{t('feed_admin_subtitle')}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.active}</Text>
                        <Text style={styles.statLabel}>{t('active')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.medicated}</Text>
                        <Text style={styles.statLabel}>{t('medicated')}</Text>
                    </View>
                </View>

                {/* List */}
                {administrations.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="clipboard-outline" size={48} color="#9ca3af" />
                        <Text style={styles.emptyText}>{t('no_feed_items')}</Text>
                    </View>
                ) : (
                    administrations.map((admin) => {
                        const withdrawal = getWithdrawalInfo(admin);
                        const isMedicated = admin.feedId?.prescriptionRequired;

                        return (
                            <View key={admin._id} style={[styles.card, isMedicated ? styles.medicatedCard : styles.safeCard]}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.feedName}>{admin.feedId?.feedName || 'Unknown Feed'}</Text>
                                        <Text style={styles.groupName}>
                                            {admin.groupName ? `Group: ${admin.groupName}` : `${(admin.animalIds || []).length} animal(s)`}
                                        </Text>
                                    </View>
                                    <View style={styles.badgesRow}>
                                        <View style={[styles.badge, isMedicated ? styles.medicatedBadge : styles.nonMedicatedBadge]}>
                                            <Text style={[styles.badgeText, isMedicated ? styles.medicatedText : styles.nonMedicatedText]}>
                                                {isMedicated ? t('medicated') : t('non_medicated')}
                                            </Text>
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: withdrawal.bg }]}>
                                            <Text style={[styles.badgeText, { color: withdrawal.color }]}>{withdrawal.label}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.detailsGrid}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>{t('antimicrobial_name')}</Text>
                                        <Text style={styles.detailValue}>{admin.feedId?.antimicrobialName || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>{t('quantity')}</Text>
                                        <Text style={styles.detailValue}>{admin.feedQuantityUsed} {admin.feedId?.unit}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>{t('start_date')}</Text>
                                        <Text style={styles.detailValue}>{format(new Date(admin.startDate), 'MMM dd, yyyy')}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>{t('status')}</Text>
                                        <Text style={styles.detailValue}>{admin.status}</Text>
                                    </View>
                                </View>

                                {/* Animals List */}
                                <View style={styles.animalsSection}>
                                    <Text style={styles.animalsHeader}>{t('animals_in_batch')} ({(admin.animalIds || []).length})</Text>
                                    <View style={styles.animalsList}>
                                        {(admin.animalIds || []).map((animalTag, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.animalChip}
                                                onPress={() => navigation.navigate('Animals', {
                                                    screen: 'AnimalHistory',
                                                    params: { animalId: animalTag }
                                                })}
                                            >
                                                <Ionicons name="paw" size={12} color="#4b5563" />
                                                <Text style={styles.animalChipText}>{animalTag}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('record_feed_use')}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>{t('select_feed')} *</Text>
                            <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('feed')}>
                                <Text style={styles.dropdownText}>{form.feedName || t('select_feed')}</Text>
                                <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </TouchableOpacity>

                            <View style={styles.switchContainer}>
                                <Text style={styles.label}>{t('group_feeding')}</Text>
                                <Switch
                                    value={form.isGroupFeeding}
                                    onValueChange={(value) => setForm({ ...form, isGroupFeeding: value })}
                                    trackColor={{ false: "#767577", true: "#a78bfa" }}
                                    thumbColor={form.isGroupFeeding ? "#8b5cf6" : "#f4f3f4"}
                                />
                            </View>

                            {form.isGroupFeeding ? (
                                <>
                                    <Text style={styles.label}>{t('group_name')} *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.groupName}
                                        onChangeText={(text) => setForm({ ...form, groupName: text })}
                                        placeholder="e.g., Pen 1 - Broilers"
                                    />
                                    <Text style={styles.label}>{t('select_animals')} ({form.selectedAnimals.length}) *</Text>
                                    <View style={styles.multiSelectContainer}>
                                        {eligibleAnimals.map(animal => (
                                            <TouchableOpacity
                                                key={animal._id}
                                                style={[
                                                    styles.multiSelectItem,
                                                    form.selectedAnimals.includes(animal.tagId) && styles.multiSelectItemSelected
                                                ]}
                                                onPress={() => toggleAnimalSelection(animal.tagId)}
                                            >
                                                <Text style={[
                                                    styles.multiSelectText,
                                                    form.selectedAnimals.includes(animal.tagId) && styles.multiSelectTextSelected
                                                ]}>
                                                    {animal.tagId}
                                                </Text>
                                                {form.selectedAnimals.includes(animal.tagId) && (
                                                    <Ionicons name="checkmark-circle" size={20} color="#8b5cf6" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>{t('select_animal')} *</Text>
                                    <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('animal')}>
                                        <Text style={styles.dropdownText}>{form.animalTag || t('select_animal')}</Text>
                                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </>
                            )}

                            <Text style={styles.label}>{t('quantity_used')} *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.feedQuantityUsed}
                                onChangeText={(text) => setForm({ ...form, feedQuantityUsed: text })}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>{t('start_date')} *</Text>
                            <TouchableOpacity onPress={() => setShowStartDate(true)} style={styles.dateButton}>
                                <Text>{format(form.startDate, 'MMM dd, yyyy')}</Text>
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                            </TouchableOpacity>
                            {showStartDate && (
                                <DateTimePicker
                                    value={form.startDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowStartDate(false);
                                        if (selectedDate) setForm({ ...form, startDate: selectedDate });
                                    }}
                                />
                            )}

                            <Text style={styles.label}>{t('notes_label')}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={form.notes}
                                onChangeText={(text) => setForm({ ...form, notes: text })}
                                placeholder={t('notes_placeholder')}
                                multiline
                                numberOfLines={3}
                            />
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSave}>
                                <Text style={[styles.buttonText, { color: '#fff' }]}>{t('submit_review')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Picker Modal */}
            <Modal visible={pickerVisible} animationType="fade" transparent={true}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>{pickerType === 'feed' ? t('select_feed') : t('select_animal')}</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {pickerType === 'feed' ? (
                                activeFeed.map((feed) => (
                                    <TouchableOpacity
                                        key={feed._id}
                                        style={styles.pickerOption}
                                        onPress={() => handlePickerSelect(feed)}
                                    >
                                        <View>
                                            <Text style={styles.pickerOptionText}>{feed.feedName}</Text>
                                            <Text style={styles.pickerOptionSubtext}>
                                                {feed.remainingQuantity} {feed.unit} left • {feed.prescriptionRequired ? t('medicated') : 'Standard'}
                                            </Text>
                                        </View>
                                        {form.feedId === feed._id && <Ionicons name="checkmark" size={20} color="#8b5cf6" />}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                eligibleAnimals.map((animal) => (
                                    <TouchableOpacity
                                        key={animal._id}
                                        style={styles.pickerOption}
                                        onPress={() => handlePickerSelect(animal)}
                                    >
                                        <Text style={styles.pickerOptionText}>{animal.tagId} - {animal.name || animal.species}</Text>
                                        {form.animalId === animal.tagId && <Ionicons name="checkmark" size={20} color="#8b5cf6" />}
                                    </TouchableOpacity>
                                ))
                            )}
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
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { color: '#ddd6fe', marginTop: 4 },
    addButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 },
    content: { padding: 16 },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
    medicatedCard: { borderLeftColor: '#ef4444' },
    safeCard: { borderLeftColor: '#3b82f6' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    feedName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    groupName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 },
    detailItem: { width: '45%' },
    detailLabel: { fontSize: 10, color: '#6b7280', marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '500', color: '#374151' },
    medicatedBadge: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' },
    nonMedicatedBadge: { backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#a7f3d0' },
    medicatedText: { color: '#991b1b' },
    nonMedicatedText: { color: '#065f46' },
    badgesRow: { flexDirection: 'row', gap: 8 },
    animalsSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
    animalsHeader: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
    animalsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    animalChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    animalChipText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 12, color: '#9ca3af' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    label: { fontSize: 12, color: '#4b5563', marginBottom: 4, fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#f9fafb' },
    textArea: { height: 80, textAlignVertical: 'top' },
    dateButton: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f3f4f6' },
    submitButton: { backgroundColor: '#8b5cf6' },
    buttonText: { fontWeight: '600' },
    dropdown: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' },
    dropdownText: { color: '#1f2937' },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    multiSelectContainer: { maxHeight: 150, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 12 },
    multiSelectItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    multiSelectItemSelected: { backgroundColor: '#f5f3ff' },
    multiSelectText: { fontSize: 14, color: '#374151' },
    multiSelectTextSelected: { color: '#7c3aed', fontWeight: '500' },
    pickerContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', alignSelf: 'center', maxHeight: '70%' },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerOptionText: { fontSize: 16, color: '#374151' },
    pickerOptionSubtext: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});

export default FeedAdministrationScreen;
