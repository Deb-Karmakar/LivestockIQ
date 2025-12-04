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
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSync } from '../../contexts/SyncContext';

const FeedAdministrationScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { isConnected } = useNetwork();
    const { addToQueue } = useSync();
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

            if (!isConnected) {
                await addToQueue({
                    type: 'RECORD_FEED_ADMIN',
                    payload: data
                });
                Alert.alert(t('offline'), t('feed_admin_queued'));
                setModalVisible(false);
                return;
            }

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
        if (!isMedicated) return { daysLeft: 'N/A', status: 'safe', label: t('safe_for_sale'), color: theme.success, bg: theme.success + '20' };
        if (!admin.withdrawalEndDate) return { daysLeft: 'N/A', status: 'pending', label: t('pending'), color: theme.subtext, bg: theme.border };

        const endDate = new Date(admin.withdrawalEndDate);
        const daysLeft = differenceInDays(endDate, new Date());

        if (daysLeft < 0) return { daysLeft: 0, status: 'safe', label: t('safe_for_sale'), color: theme.success, bg: theme.success + '20' };
        if (daysLeft <= 5) return { daysLeft, status: 'ending_soon', label: t('ending_soon'), color: theme.warning, bg: theme.warning + '20' };
        return { daysLeft, status: 'active', label: t('withdrawal_active'), color: theme.error, bg: theme.error + '20' };
    };

    const stats = {
        total: administrations.length,
        active: administrations.filter(a => a.status === 'Active' && !a.endDate).length,
        medicated: administrations.filter(a => a.feedId?.prescriptionRequired).length,
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>{t('feed_admin_title')}</Text>
                        <Text style={[styles.headerSubtitle, { color: '#94a3b8' }]}>{t('feed_admin_subtitle')}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        enabled={isConnected}
                    />
                }
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.primary }]}>{stats.total}</Text>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>Total</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.error }]}>{stats.active}</Text>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('active')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.error }]}>{stats.medicated}</Text>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('medicated')}</Text>
                    </View>
                </View>

                {/* List */}
                {administrations.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="clipboard-outline" size={48} color={theme.border} />
                        <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_feed_items')}</Text>
                    </View>
                ) : (
                    administrations.map((admin) => {
                        const withdrawal = getWithdrawalInfo(admin);
                        const isMedicated = admin.feedId?.prescriptionRequired;

                        return (
                            <View key={admin._id} style={[
                                styles.card,
                                { backgroundColor: theme.card },
                                isMedicated ? { borderLeftColor: theme.error } : { borderLeftColor: theme.primary }
                            ]}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.feedName, { color: theme.text }]}>{admin.feedId?.feedName || 'Unknown Feed'}</Text>
                                        <Text style={[styles.groupName, { color: theme.subtext }]}>
                                            {admin.groupName ? `Group: ${admin.groupName}` : `${(admin.animalIds || []).length} animal(s)`}
                                        </Text>
                                    </View>
                                    <View style={styles.badgesRow}>
                                        <View style={[
                                            styles.badge,
                                            isMedicated ? { backgroundColor: theme.error + '20', borderColor: theme.error } : { backgroundColor: theme.success + '20', borderColor: theme.success },
                                            { borderWidth: 1 }
                                        ]}>
                                            <Text style={[
                                                styles.badgeText,
                                                isMedicated ? { color: theme.error } : { color: theme.success }
                                            ]}>
                                                {isMedicated ? t('medicated') : t('non_medicated')}
                                            </Text>
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: withdrawal.bg }]}>
                                            <Text style={[styles.badgeText, { color: withdrawal.color }]}>{withdrawal.label}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={[styles.detailsGrid, { backgroundColor: theme.background }]}>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('antimicrobial_name')}</Text>
                                        <Text style={[styles.detailValue, { color: theme.text }]}>{admin.feedId?.antimicrobialName || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('quantity')}</Text>
                                        <Text style={[styles.detailValue, { color: theme.text }]}>{admin.feedQuantityUsed} {admin.feedId?.unit}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('start_date')}</Text>
                                        <Text style={[styles.detailValue, { color: theme.text }]}>{format(new Date(admin.startDate), 'MMM dd, yyyy')}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('status')}</Text>
                                        <Text style={[styles.detailValue, { color: theme.text }]}>{admin.status}</Text>
                                    </View>
                                </View>

                                {/* Animals List */}
                                <View style={[styles.animalsSection, { borderTopColor: theme.border }]}>
                                    <Text style={[styles.animalsHeader, { color: theme.subtext }]}>{t('animals_in_batch')} ({(admin.animalIds || []).length})</Text>
                                    <View style={styles.animalsList}>
                                        {(admin.animalIds || []).map((animalTag, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.animalChip, { backgroundColor: theme.background }]}
                                                onPress={() => navigation.navigate('Animals', {
                                                    screen: 'AnimalHistory',
                                                    params: { animalId: animalTag }
                                                })}
                                            >
                                                <Ionicons name="paw" size={12} color={theme.subtext} />
                                                <Text style={[styles.animalChipText, { color: theme.text }]}>{animalTag}</Text>
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
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('record_feed_use')}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.label, { color: theme.text }]}>{t('select_feed')} *</Text>
                            <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => openPicker('feed')}>
                                <Text style={[styles.dropdownText, { color: theme.text }]}>{form.feedName || t('select_feed')}</Text>
                                <Ionicons name="chevron-down" size={20} color={theme.subtext} />
                            </TouchableOpacity>

                            <View style={styles.switchContainer}>
                                <Text style={[styles.label, { color: theme.text }]}>{t('group_feeding')}</Text>
                                <Switch
                                    value={form.isGroupFeeding}
                                    onValueChange={(value) => setForm({ ...form, isGroupFeeding: value })}
                                    trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                    thumbColor={form.isGroupFeeding ? theme.primary : "#f4f3f4"}
                                />
                            </View>

                            {form.isGroupFeeding ? (
                                <>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('group_name')} *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                        value={form.groupName}
                                        onChangeText={(text) => setForm({ ...form, groupName: text })}
                                        placeholder="e.g., Pen 1 - Broilers"
                                        placeholderTextColor={theme.subtext}
                                    />
                                    <Text style={[styles.label, { color: theme.text }]}>{t('select_animals')} ({form.selectedAnimals.length}) *</Text>
                                    <View style={[styles.multiSelectContainer, { borderColor: theme.border }]}>
                                        {eligibleAnimals.map(animal => (
                                            <TouchableOpacity
                                                key={animal._id}
                                                style={[
                                                    styles.multiSelectItem,
                                                    { borderBottomColor: theme.border },
                                                    form.selectedAnimals.includes(animal.tagId) && { backgroundColor: theme.primary + '20' }
                                                ]}
                                                onPress={() => toggleAnimalSelection(animal.tagId)}
                                            >
                                                <Text style={[
                                                    styles.multiSelectText,
                                                    { color: theme.text },
                                                    form.selectedAnimals.includes(animal.tagId) && { color: theme.primary, fontWeight: '500' }
                                                ]}>
                                                    {animal.tagId}
                                                </Text>
                                                {form.selectedAnimals.includes(animal.tagId) && (
                                                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('select_animal')} *</Text>
                                    <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => openPicker('animal')}>
                                        <Text style={[styles.dropdownText, { color: theme.text }]}>{form.animalTag || t('select_animal')}</Text>
                                        <Ionicons name="chevron-down" size={20} color={theme.subtext} />
                                    </TouchableOpacity>
                                </>
                            )}

                            <Text style={[styles.label, { color: theme.text }]}>{t('quantity_used')} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                value={form.feedQuantityUsed}
                                onChangeText={(text) => setForm({ ...form, feedQuantityUsed: text })}
                                placeholder="0.00"
                                placeholderTextColor={theme.subtext}
                                keyboardType="numeric"
                            />

                            <Text style={[styles.label, { color: theme.text }]}>{t('start_date')} *</Text>
                            <TouchableOpacity onPress={() => setShowStartDate(true)} style={[styles.dateButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <Text style={{ color: theme.text }}>{format(form.startDate, 'MMM dd, yyyy')}</Text>
                                <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
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

                            <Text style={[styles.label, { color: theme.text }]}>{t('notes_label')}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                value={form.notes}
                                onChangeText={(text) => setForm({ ...form, notes: text })}
                                placeholder={t('notes_placeholder')}
                                placeholderTextColor={theme.subtext}
                                multiline
                                numberOfLines={3}
                            />
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton, { backgroundColor: theme.background }]} onPress={() => setModalVisible(false)}>
                                <Text style={[styles.buttonText, { color: theme.text }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
                                <Text style={[styles.buttonText, { color: '#fff' }]}>{t('submit_review')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Picker Modal */}
            <Modal visible={pickerVisible} animationType="fade" transparent={true}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
                    <View style={[styles.pickerContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.pickerTitle, { color: theme.text }]}>{pickerType === 'feed' ? t('select_feed') : t('select_animal')}</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {pickerType === 'feed' ? (
                                activeFeed.map((feed) => (
                                    <TouchableOpacity
                                        key={feed._id}
                                        style={[styles.pickerOption, { borderBottomColor: theme.border }]}
                                        onPress={() => handlePickerSelect(feed)}
                                    >
                                        <View>
                                            <Text style={[styles.pickerOptionText, { color: theme.text }]}>{feed.feedName}</Text>
                                            <Text style={[styles.pickerOptionSubtext, { color: theme.subtext }]}>
                                                {feed.remainingQuantity} {feed.unit} left • {feed.prescriptionRequired ? t('medicated') : 'Standard'}
                                            </Text>
                                        </View>
                                        {form.feedId === feed._id && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                eligibleAnimals.map((animal) => (
                                    <TouchableOpacity
                                        key={animal._id}
                                        style={[styles.pickerOption, { borderBottomColor: theme.border }]}
                                        onPress={() => handlePickerSelect(animal)}
                                    >
                                        <Text style={[styles.pickerOptionText, { color: theme.text }]}>{animal.tagId} - {animal.name || animal.species}</Text>
                                        {form.animalId === animal.tagId && <Ionicons name="checkmark" size={20} color={theme.primary} />}
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
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { color: '#ddd6fe', marginTop: 4 },
    addButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 },
    content: { padding: 16 },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 10, marginTop: 2 },
    card: { padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    feedName: { fontSize: 16, fontWeight: 'bold' },
    groupName: { fontSize: 12, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 12, borderRadius: 8 },
    detailItem: { width: '45%' },
    detailLabel: { fontSize: 10, marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '500' },
    badgesRow: { flexDirection: 'row', gap: 8 },
    animalsSection: { marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
    animalsHeader: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    animalsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    animalChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    animalChipText: { fontSize: 12, fontWeight: '500' },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 16, padding: 20, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    label: { fontSize: 12, marginBottom: 4, fontWeight: '500' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
    textArea: { height: 80, textAlignVertical: 'top' },
    dateButton: { padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: {},
    submitButton: {},
    buttonText: { fontWeight: '600' },
    dropdown: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownText: {},
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    multiSelectContainer: { maxHeight: 150, borderWidth: 1, borderRadius: 8, marginBottom: 12 },
    multiSelectItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
    multiSelectText: { fontSize: 14 },
    pickerContent: { borderRadius: 16, padding: 20, width: '90%', alignSelf: 'center', maxHeight: '70%' },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    pickerOption: { paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerOptionText: { fontSize: 16 },
    pickerOptionSubtext: { fontSize: 12, marginTop: 2 },
});

export default FeedAdministrationScreen;
