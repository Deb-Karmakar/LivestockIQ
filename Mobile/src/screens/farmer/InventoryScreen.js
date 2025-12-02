// Mobile/src/screens/farmer/InventoryScreen.js
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
import { format, differenceInDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    getInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
} from '../../services/inventoryService';
import { useLanguage } from '../../contexts/LanguageContext';

const InventoryScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [form, setForm] = useState({
        drugName: '',
        quantity: '',
        unit: 'bottles',
        expiryDate: new Date(),
        supplier: '',
        notes: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getInventory();
            setInventory(data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            Alert.alert(t('error'), 'Failed to load inventory');
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
                drugName: item.drugName,
                quantity: item.quantity.toString(),
                unit: item.unit,
                expiryDate: new Date(item.expiryDate),
                supplier: item.supplier || '',
                notes: item.notes || ''
            });
        } else {
            setEditingItem(null);
            setForm({
                drugName: '',
                quantity: '',
                unit: 'bottles',
                expiryDate: new Date(),
                supplier: '',
                notes: ''
            });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.drugName || !form.quantity || !form.unit) {
            Alert.alert(t('error'), t('fill_required'));
            return;
        }

        try {
            const itemData = {
                ...form,
                quantity: Number(form.quantity),
                expiryDate: form.expiryDate.toISOString()
            };

            if (editingItem) {
                await updateInventoryItem(editingItem._id, itemData);
                Alert.alert(t('success'), 'Item updated successfully');
            } else {
                await addInventoryItem(itemData);
                Alert.alert(t('success'), 'Item added successfully');
            }
            setModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert(t('error'), error.message || 'Failed to save item');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            t('delete_item'),
            t('delete_item_confirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteInventoryItem(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert(t('error'), 'Failed to delete item');
                        }
                    }
                }
            ]
        );
    };

    const getExpiryStatus = (expiryDate) => {
        const daysLeft = differenceInDays(new Date(expiryDate), new Date());
        if (daysLeft < 0) return { label: t('expired'), color: '#ef4444', bg: '#fee2e2' };
        if (daysLeft <= 30) return { label: `${daysLeft} ${t('days_left')}`, color: '#f59e0b', bg: '#fef3c7' };
        return { label: t('healthy'), color: '#10b981', bg: '#d1fae5' };
    };

    const stats = {
        total: inventory.length,
        healthy: inventory.filter(i => differenceInDays(new Date(i.expiryDate), new Date()) > 30).length,
        expiring: inventory.filter(i => {
            const days = differenceInDays(new Date(i.expiryDate), new Date());
            return days >= 0 && days <= 30;
        }).length,
        expired: inventory.filter(i => differenceInDays(new Date(i.expiryDate), new Date()) < 0).length
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
                        <Text style={styles.headerTitle}>{t('drug_inventory_title')}</Text>
                        <Text style={styles.headerSubtitle}>{t('inventory_subtitle')}</Text>
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
                        <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.healthy}</Text>
                        <Text style={styles.statLabel}>{t('healthy')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.expiring}</Text>
                        <Text style={styles.statLabel}>{t('expiring')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.expired}</Text>
                        <Text style={styles.statLabel}>{t('expired')}</Text>
                    </View>
                </View>

                {/* Inventory List */}
                {inventory.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={48} color="#9ca3af" />
                        <Text style={styles.emptyText}>{t('no_inventory')}</Text>
                    </View>
                ) : (
                    inventory.map((item) => {
                        const status = getExpiryStatus(item.expiryDate);
                        return (
                            <View key={item._id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.drugName}>{item.drugName}</Text>
                                        <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                                        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.expiryDate}>{t('expires')}: {format(new Date(item.expiryDate), 'MMM dd, yyyy')}</Text>
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
                        <Text style={styles.modalTitle}>{editingItem ? t('edit_item') : t('add_item')}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>{t('drug_name_label')} *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.drugName}
                                onChangeText={(text) => setForm({ ...form, drugName: text })}
                                placeholder={t('drug_name_placeholder')}
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('quantity')} *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.quantity}
                                        onChangeText={(text) => setForm({ ...form, quantity: text })}
                                        placeholder="0"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>{t('unit')} *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.unit}
                                        onChangeText={(text) => setForm({ ...form, unit: text })}
                                        placeholder="e.g., bottles"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>{t('expiry_date')} *</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                                <Text>{format(form.expiryDate, 'MMM dd, yyyy')}</Text>
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={form.expiryDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setForm({ ...form, expiryDate: selectedDate });
                                    }}
                                />
                            )}

                            <Text style={styles.label}>{t('supplier')}</Text>
                            <TextInput
                                style={styles.input}
                                value={form.supplier}
                                onChangeText={(text) => setForm({ ...form, supplier: text })}
                                placeholder="Supplier Name"
                            />

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
                                <Text style={[styles.buttonText, { color: '#fff' }]}>{t('save_changes')}</Text>
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
    drugName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    quantity: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
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
});

export default InventoryScreen;
