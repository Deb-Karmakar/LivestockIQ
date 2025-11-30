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

const FeedInventoryScreen = ({ navigation }) => {
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
            Alert.alert('Error', 'Failed to load feed inventory');
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
            Alert.alert('Error', 'Please fill in all required fields (*)');
            return;
        }

        if (form.prescriptionRequired && (!form.antimicrobialName || !form.antimicrobialConcentration || !form.withdrawalPeriodDays)) {
            Alert.alert('Error', 'Medicated feed requires antimicrobial details and withdrawal period');
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
                Alert.alert('Success', 'Feed updated successfully');
            } else {
                await addFeedItem(itemData);
                Alert.alert('Success', 'Feed added successfully');
            }
            setModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save feed');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Feed',
            'Are you sure you want to delete this feed item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteFeedItem(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete feed');
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
        if (daysLeft < 0) return { label: 'Expired', color: '#ef4444', bg: '#fee2e2' };
        if (daysLeft <= 30) return { label: `${daysLeft} days left`, color: '#f59e0b', bg: '#fef3c7' };
        return { label: 'Healthy', color: '#10b981', bg: '#d1fae5' };
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
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Feed Inventory</Text>
                        <Text style={styles.headerSubtitle}>Manage medicated feed</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
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
                        <Text style={[styles.statValue, { color: '#3b82f6' }]}>{calculatedStats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#10b981' }]}>{calculatedStats.active}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#f59e0b' }]}>{calculatedStats.expiring}</Text>
                        <Text style={styles.statLabel}>Expiring</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>{calculatedStats.expired}</Text>
                        <Text style={styles.statLabel}>Expired</Text>
                    </View>
                </View>

                {/* Feed List */}
                {feedInventory.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="nutrition-outline" size={48} color="#9ca3af" />
                        <Text style={styles.emptyText}>No feed items found</Text>
                    </View>
                ) : (
                    feedInventory.map((item) => {
                        const status = getExpiryStatus(item.expiryDate);
                        return (
                            <View key={item._id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.feedName}>{item.feedName}</Text>
                                        <Text style={styles.feedType}>{item.feedType} • {item.remainingQuantity} {item.unit} left</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                                        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                                    </View>
                                </View>

                                {item.prescriptionRequired && (
                                    <View style={styles.medicationInfo}>
                                        <Ionicons name="medkit-outline" size={14} color="#6366f1" />
                                        <Text style={styles.medicationText}>
                                            {item.antimicrobialName} ({item.antimicrobialConcentration} mg/kg)
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.cardFooter}>
                                    <Text style={styles.expiryDate}>Expires: {format(new Date(item.expiryDate), 'MMM dd, yyyy')}</Text>
                                    <View style={styles.actions}>
                                        <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionButton}>
                                            <Ionicons name="create-outline" size={20} color="#3b82f6" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionButton}>
                                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingItem ? 'Edit Feed' : 'Add New Feed'}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Feed Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.feedName}
                                onChangeText={(text) => setForm({ ...form, feedName: text })}
                                placeholder="e.g., Starter Feed"
                            />

                            <Text style={styles.label}>Feed Type *</Text>
                            <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('feedType')}>
                                <Text style={styles.dropdownText}>{form.feedType}</Text>
                                <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </TouchableOpacity>

                            <Text style={styles.label}>Manufacturer *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.manufacturer}
                                onChangeText={(text) => setForm({ ...form, manufacturer: text })}
                                placeholder="e.g., FeedCo Ltd"
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Total Qty *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.totalQuantity}
                                        onChangeText={(text) => setForm({ ...form, totalQuantity: text })}
                                        placeholder="0"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Unit *</Text>
                                    <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('unit')}>
                                        <Text style={styles.dropdownText}>{form.unit}</Text>
                                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {editingItem && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Remaining Qty *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.remainingQuantity}
                                        onChangeText={(text) => setForm({ ...form, remainingQuantity: text })}
                                        placeholder="0"
                                        keyboardType="numeric"
                                    />
                                </View>
                            )}

                            <View style={styles.switchContainer}>
                                <Text style={styles.label}>Medicated Feed (Prescription Required)</Text>
                                <Switch
                                    value={form.prescriptionRequired}
                                    onValueChange={(value) => setForm({ ...form, prescriptionRequired: value })}
                                    trackColor={{ false: "#767577", true: "#818cf8" }}
                                    thumbColor={form.prescriptionRequired ? "#4f46e5" : "#f4f3f4"}
                                />
                            </View>

                            {form.prescriptionRequired && (
                                <View style={styles.medicatedSection}>
                                    <Text style={styles.label}>Antimicrobial Name *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.antimicrobialName}
                                        onChangeText={(text) => setForm({ ...form, antimicrobialName: text })}
                                        placeholder="e.g., Oxytetracycline"
                                    />
                                    <View style={styles.row}>
                                        <View style={styles.halfInput}>
                                            <Text style={styles.label}>Concentration (mg/kg) *</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={form.antimicrobialConcentration}
                                                onChangeText={(text) => setForm({ ...form, antimicrobialConcentration: text })}
                                                placeholder="0"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.halfInput}>
                                            <Text style={styles.label}>Withdrawal (Days) *</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={form.withdrawalPeriodDays}
                                                onChangeText={(text) => setForm({ ...form, withdrawalPeriodDays: text })}
                                                placeholder="0"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.label}>Target Species</Text>
                            <View style={styles.speciesGrid}>
                                {['Poultry', 'Cattle', 'Goat', 'Sheep', 'Pig', 'Other'].map(species => (
                                    <TouchableOpacity
                                        key={species}
                                        style={[
                                            styles.speciesChip,
                                            form.targetSpecies.includes(species) && styles.speciesChipSelected
                                        ]}
                                        onPress={() => toggleSpecies(species)}
                                    >
                                        <Text style={[
                                            styles.speciesChipText,
                                            form.targetSpecies.includes(species) && styles.speciesChipTextSelected
                                        ]}>{species}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Purchase Date</Text>
                                    <TouchableOpacity onPress={() => setShowPurchaseDate(true)} style={styles.dateButton}>
                                        <Text>{format(form.purchaseDate, 'MMM dd, yyyy')}</Text>
                                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Expiry Date</Text>
                                    <TouchableOpacity onPress={() => setShowExpiryDate(true)} style={styles.dateButton}>
                                        <Text>{format(form.expiryDate, 'MMM dd, yyyy')}</Text>
                                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
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

                            <Text style={styles.label}>Notes</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={form.notes}
                                onChangeText={(text) => setForm({ ...form, notes: text })}
                                placeholder="Additional notes..."
                                multiline
                                numberOfLines={3}
                            />
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSave}>
                                <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Picker Modal */}
            <Modal visible={pickerVisible} animationType="fade" transparent={true}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Select {pickerType === 'feedType' ? 'Feed Type' : 'Unit'}</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {(pickerType === 'feedType'
                                ? ['Starter', 'Grower', 'Finisher', 'Layer', 'Breeder', 'Concentrate']
                                : ['kg', 'bags', 'tons']
                            ).map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.pickerOption}
                                    onPress={() => handlePickerSelect(option)}
                                >
                                    <Text style={styles.pickerOptionText}>{option}</Text>
                                    {((pickerType === 'feedType' && form.feedType === option) ||
                                        (pickerType === 'unit' && form.unit === option)) && (
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
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { color: '#94a3b8', marginTop: 4 },
    addButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 },
    content: { padding: 16 },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    feedName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    feedType: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    medicationInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 8, backgroundColor: '#e0e7ff', borderRadius: 6 },
    medicationText: { fontSize: 12, color: '#4338ca', marginLeft: 6, fontWeight: '500' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    expiryDate: { fontSize: 12, color: '#6b7280' },
    actions: { flexDirection: 'row', gap: 16 },
    actionButton: { padding: 4 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 12, color: '#9ca3af' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    label: { fontSize: 12, color: '#4b5563', marginBottom: 4, fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#f9fafb' },
    textArea: { height: 80, textAlignVertical: 'top' },
    dateButton: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f3f4f6' },
    submitButton: { backgroundColor: '#10b981' },
    buttonText: { fontWeight: '600' },
    dropdown: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' },
    dropdownText: { color: '#1f2937' },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    medicatedSection: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 12 },
    speciesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    speciesChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
    speciesChipSelected: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
    speciesChipText: { fontSize: 12, color: '#6b7280' },
    speciesChipTextSelected: { color: '#047857', fontWeight: '600' },
    pickerContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '80%', alignSelf: 'center', maxHeight: '60%' },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerOptionText: { fontSize: 16, color: '#374151' },
});

export default FeedInventoryScreen;
