// Mobile/src/screens/farmer/FeedInventoryScreen.js
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
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, differenceInDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    getFeedInventory,
    getFeedStats,
    addFeedItem,
    updateFeedItem,
    deleteFeedItem
} from '../../services/feedService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const FeedInventoryScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feedInventory, setFeedInventory] = useState([]);
    const [stats, setStats] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [form, setForm] = useState({
        feedName: '',
        feedType: 'Starter',
        antimicrobialName: '',
        antimicrobialConcentration: '',
        totalQuantity: '',
        remainingQuantity: '',
        unit: 'kg',
        batchNumber: '',
        manufacturer: '',
        purchaseDate: new Date(),
        expiryDate: new Date(),
        withdrawalPeriodDays: '',
        targetSpecies: [],
        prescriptionRequired: false,
        notes: ''
    });
    const [showPurchaseDate, setShowPurchaseDate] = useState(false);
    const [showExpiryDate, setShowExpiryDate] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(null); // 'feedType', 'unit'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [data, statsData] = await Promise.all([
                getFeedInventory(),
                getFeedStats()
            ]);
            setFeedInventory(data || []);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching feed inventory:', error);
            Alert.alert(t('error'), 'Failed to load feed inventory');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({
                feedName: item.feedName,
                feedType: item.feedType,
                antimicrobialName: item.antimicrobialName || '',
                antimicrobialConcentration: item.antimicrobialConcentration ? item.antimicrobialConcentration.toString() : '',
                totalQuantity: item.totalQuantity.toString(),
                remainingQuantity: item.remainingQuantity.toString(),
                unit: item.unit,
                batchNumber: item.batchNumber || '',
                manufacturer: item.manufacturer || '',
                purchaseDate: new Date(item.purchaseDate),
                expiryDate: new Date(item.expiryDate),
                withdrawalPeriodDays: item.withdrawalPeriodDays ? item.withdrawalPeriodDays.toString() : '',
                targetSpecies: item.targetSpecies || [],
                prescriptionRequired: item.prescriptionRequired,
                notes: item.notes || ''
            });
        } else {
            setEditingItem(null);
            setForm({
                feedName: '',
                feedType: 'Starter',
                antimicrobialName: '',
                antimicrobialConcentration: '',
                totalQuantity: '',
                remainingQuantity: '',
                unit: 'kg',
                batchNumber: '',
                manufacturer: '',
                purchaseDate: new Date(),
                expiryDate: new Date(),
                withdrawalPeriodDays: '',
                targetSpecies: [],
                prescriptionRequired: false,
                notes: ''
            });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.feedName || !form.totalQuantity || !form.unit || !form.manufacturer) {
            Alert.alert(t('error'), t('fill_required'));
            return;
        }

        if (form.prescriptionRequired && (!form.antimicrobialName || !form.antimicrobialConcentration || !form.withdrawalPeriodDays)) {
            Alert.alert(t('error'), t('medicated_feed_req'));
            return;
        }

        try {
            const itemData = {
                ...form,
                totalQuantity: Number(form.totalQuantity),
                remainingQuantity: editingItem ? Number(form.remainingQuantity) : Number(form.totalQuantity),
                antimicrobialConcentration: form.prescriptionRequired ? Number(form.antimicrobialConcentration) : 0,
                withdrawalPeriodDays: form.prescriptionRequired ? Number(form.withdrawalPeriodDays) : 0,
                purchaseDate: form.purchaseDate.toISOString(),
                expiryDate: form.expiryDate.toISOString()
            };

            if (editingItem) {
                await updateFeedItem(editingItem._id, itemData);
                Alert.alert(t('success'), t('feed_updated'));
            } else {
                await addFeedItem(itemData);
                Alert.alert(t('success'), t('feed_added'));
            }
            setModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert(t('error'), error.message || t('failed_save_feed'));
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            t('delete_feed'),
            t('delete_feed_confirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteFeedItem(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert(t('error'), t('failed_delete_feed'));
                        }
                    }
                }
            ]
        );
    };

    const toggleSpecies = (species) => {
        if (form.targetSpecies.includes(species)) {
            setForm({ ...form, targetSpecies: form.targetSpecies.filter(s => s !== species) });
        } else {
            setForm({ ...form, targetSpecies: [...form.targetSpecies, species] });
        }
    };

    const openPicker = (type) => {
        setPickerType(type);
        setPickerVisible(true);
    };

    const handlePickerSelect = (value) => {
        if (pickerType === 'feedType') setForm({ ...form, feedType: value });
        else if (pickerType === 'unit') setForm({ ...form, unit: value });
        setPickerVisible(false);
    };

    const getExpiryStatus = (expiryDate) => {
        const daysLeft = differenceInDays(new Date(expiryDate), new Date());
        if (daysLeft < 0) return { label: t('expired'), color: theme.error, bg: theme.error + '20' };
        if (daysLeft <= 30) return { label: `${daysLeft} ${t('days_left')}`, color: theme.warning, bg: theme.warning + '20' };
        return { label: t('healthy'), color: theme.success, bg: theme.success + '20' };
    };

    const calculatedStats = {
        total: feedInventory.length,
        active: feedInventory.filter(i => i.remainingQuantity > 0 && differenceInDays(new Date(i.expiryDate), new Date()) >= 0).length,
        expiring: feedInventory.filter(i => {
            const days = differenceInDays(new Date(i.expiryDate), new Date());
            return days >= 0 && days <= 30;
        }).length,
        expired: feedInventory.filter(i => differenceInDays(new Date(i.expiryDate), new Date()) < 0).length
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
                        <Text style={styles.headerTitle}>{t('feed_inventory_title')}</Text>
                        <Text style={[styles.headerSubtitle, { color: '#94a3b8' }]}>{t('feed_subtitle')}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.primary }]}>{calculatedStats.total}</Text>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>Total</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.success }]}>{calculatedStats.active}</Text>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('healthy')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.warning }]}>{calculatedStats.expiring}</Text>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('expiring')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.error }]}>{calculatedStats.expired}</Text>
                        <Text style={[styles.statLabel, { color: theme.subtext }]}>{t('expired')}</Text>
                    </View>
                </View>

                {/* Feed List */}
                {feedInventory.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="nutrition-outline" size={48} color={theme.border} />
                        <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_feed_items')}</Text>
                    </View>
                ) : (
                    feedInventory.map((item) => {
                        const status = getExpiryStatus(item.expiryDate);
                        return (
                            <View key={item._id} style={[styles.card, { backgroundColor: theme.card }]}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={[styles.feedName, { color: theme.text }]}>{item.feedName}</Text>
                                        <Text style={[styles.feedType, { color: theme.subtext }]}>{item.feedType} • {item.remainingQuantity} {item.unit} left</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                                        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                                    </View>
                                </View>

                                {item.prescriptionRequired && (
                                    <View style={[styles.medicationInfo, { backgroundColor: theme.primary + '20' }]}>
                                        <Ionicons name="medkit-outline" size={14} color={theme.primary} />
                                        <Text style={[styles.medicationText, { color: theme.primary }]}>
                                            {item.antimicrobialName} ({item.antimicrobialConcentration} mg/kg)
                                        </Text>
                                    </View>
                                )}

                                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                                    <Text style={[styles.expiryDate, { color: theme.subtext }]}>{t('expires')}: {format(new Date(item.expiryDate), 'MMM dd, yyyy')}</Text>
                                    <View style={styles.actions}>
                                        <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionButton}>
                                            <Ionicons name="create-outline" size={20} color={theme.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionButton}>
                                            <Ionicons name="trash-outline" size={20} color={theme.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{editingItem ? t('edit_item') : t('add_item')}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.label, { color: theme.text }]}>{t('feed_name')} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                value={form.feedName}
                                onChangeText={(text) => setForm({ ...form, feedName: text })}
                                placeholder="e.g., Starter Feed"
                                placeholderTextColor={theme.subtext}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>{t('feed_type')} *</Text>
                            <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => openPicker('feedType')}>
                                <Text style={[styles.dropdownText, { color: theme.text }]}>{form.feedType}</Text>
                                <Ionicons name="chevron-down" size={20} color={theme.subtext} />
                            </TouchableOpacity>

                            <Text style={[styles.label, { color: theme.text }]}>{t('manufacturer')} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                value={form.manufacturer}
                                onChangeText={(text) => setForm({ ...form, manufacturer: text })}
                                placeholder="e.g., FeedCo Ltd"
                                placeholderTextColor={theme.subtext}
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('total_qty')} *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                        value={form.totalQuantity}
                                        onChangeText={(text) => setForm({ ...form, totalQuantity: text })}
                                        placeholder="0"
                                        placeholderTextColor={theme.subtext}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('unit')} *</Text>
                                    <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => openPicker('unit')}>
                                        <Text style={[styles.dropdownText, { color: theme.text }]}>{form.unit}</Text>
                                        <Ionicons name="chevron-down" size={20} color={theme.subtext} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {editingItem && (
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('remaining_qty')} *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                        value={form.remainingQuantity}
                                        onChangeText={(text) => setForm({ ...form, remainingQuantity: text })}
                                        placeholder="0"
                                        placeholderTextColor={theme.subtext}
                                        keyboardType="numeric"
                                    />
                                </View>
                            )}

                            <View style={styles.switchContainer}>
                                <Text style={[styles.label, { color: theme.text }]}>{t('medicated_feed_label')}</Text>
                                <Switch
                                    value={form.prescriptionRequired}
                                    onValueChange={(value) => setForm({ ...form, prescriptionRequired: value })}
                                    trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                    thumbColor={form.prescriptionRequired ? theme.primary : "#f4f3f4"}
                                />
                            </View>

                            {form.prescriptionRequired && (
                                <View style={[styles.medicatedSection, { backgroundColor: theme.background }]}>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('antimicrobial_name')} *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                                        value={form.antimicrobialName}
                                        onChangeText={(text) => setForm({ ...form, antimicrobialName: text })}
                                        placeholder="e.g., Oxytetracycline"
                                        placeholderTextColor={theme.subtext}
                                    />
                                    <View style={styles.row}>
                                        <View style={styles.halfInput}>
                                            <Text style={[styles.label, { color: theme.text }]}>{t('concentration')} *</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                                                value={form.antimicrobialConcentration}
                                                onChangeText={(text) => setForm({ ...form, antimicrobialConcentration: text })}
                                                placeholder="0"
                                                placeholderTextColor={theme.subtext}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.halfInput}>
                                            <Text style={[styles.label, { color: theme.text }]}>{t('withdrawal_days')} *</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                                                value={form.withdrawalPeriodDays}
                                                onChangeText={(text) => setForm({ ...form, withdrawalPeriodDays: text })}
                                                placeholder="0"
                                                placeholderTextColor={theme.subtext}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}

                            <Text style={[styles.label, { color: theme.text }]}>{t('target_species')}</Text>
                            <View style={styles.speciesGrid}>
                                {['Poultry', 'Cattle', 'Goat', 'Sheep', 'Pig', 'Other'].map(species => (
                                    <TouchableOpacity
                                        key={species}
                                        style={[
                                            styles.speciesChip,
                                            { backgroundColor: theme.background, borderColor: theme.border },
                                            form.targetSpecies.includes(species) && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                                        ]}
                                        onPress={() => toggleSpecies(species)}
                                    >
                                        <Text style={[
                                            styles.speciesChipText,
                                            { color: theme.subtext },
                                            form.targetSpecies.includes(species) && { color: theme.primary, fontWeight: '600' }
                                        ]}>{species}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('purchase_date')}</Text>
                                    <TouchableOpacity onPress={() => setShowPurchaseDate(true)} style={[styles.dateButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        <Text style={{ color: theme.text }}>{format(form.purchaseDate, 'MMM dd, yyyy')}</Text>
                                        <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('expiry_date')}</Text>
                                    <TouchableOpacity onPress={() => setShowExpiryDate(true)} style={[styles.dateButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        <Text style={{ color: theme.text }}>{format(form.expiryDate, 'MMM dd, yyyy')}</Text>
                                        <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {showPurchaseDate && (
                                <DateTimePicker
                                    value={form.purchaseDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowPurchaseDate(false);
                                        if (selectedDate) setForm({ ...form, purchaseDate: selectedDate });
                                    }}
                                />
                            )}
                            {showExpiryDate && (
                                <DateTimePicker
                                    value={form.expiryDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowExpiryDate(false);
                                        if (selectedDate) setForm({ ...form, expiryDate: selectedDate });
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
                                <Text style={[styles.buttonText, { color: '#fff' }]}>{t('save_changes')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Picker Modal */}
            <Modal visible={pickerVisible} animationType="fade" transparent={true}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
                    <View style={[styles.pickerContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.pickerTitle, { color: theme.text }]}>{pickerType === 'feedType' ? t('select_feed_type') : t('select_unit')}</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {(pickerType === 'feedType'
                                ? ['Starter', 'Grower', 'Finisher', 'Layer', 'Breeder', 'Concentrate']
                                : ['kg', 'bags', 'tons']
                            ).map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.pickerOption, { borderBottomColor: theme.border }]}
                                    onPress={() => handlePickerSelect(option)}
                                >
                                    <Text style={[styles.pickerOptionText, { color: theme.text }]}>{option}</Text>
                                    {((pickerType === 'feedType' && form.feedType === option) ||
                                        (pickerType === 'unit' && form.unit === option)) && (
                                            <Ionicons name="checkmark" size={20} color={theme.primary} />
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
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { color: '#94a3b8', marginTop: 4 },
    addButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 },
    content: { padding: 16 },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 10, marginTop: 2 },
    card: { padding: 16, borderRadius: 12, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    feedName: { fontSize: 16, fontWeight: 'bold' },
    feedType: { fontSize: 14, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    medicationInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 8, borderRadius: 6 },
    medicationText: { fontSize: 12, marginLeft: 6, fontWeight: '500' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
    expiryDate: { fontSize: 12 },
    actions: { flexDirection: 'row', gap: 16 },
    actionButton: { padding: 4 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 16, padding: 20, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    label: { fontSize: 12, marginBottom: 4, fontWeight: '500' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
    textArea: { height: 80, textAlignVertical: 'top' },
    dateButton: { padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: {},
    submitButton: {},
    buttonText: { fontWeight: '600' },
    dropdown: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownText: {},
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    medicatedSection: { padding: 12, borderRadius: 8, marginBottom: 12 },
    speciesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    speciesChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
    speciesChipSelected: {},
    speciesChipText: { fontSize: 12 },
    speciesChipTextSelected: { fontWeight: '600' },
    pickerContent: { borderRadius: 16, padding: 20, width: '80%', alignSelf: 'center', maxHeight: '60%' },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    pickerOption: { paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerOptionText: { fontSize: 16 },
});

export default FeedInventoryScreen;
