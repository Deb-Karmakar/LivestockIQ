// Mobile/src/screens/farmer/SalesScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSync } from '../../contexts/SyncContext';
import { getAnimals } from '../../services/animalService';
import { getTreatments } from '../../services/treatmentService';
import { addSale, getSales } from '../../services/salesService';

const SalesScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const { isConnected } = useNetwork();
    const { addToQueue } = useSync();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [animals, setAnimals] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [sales, setSales] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        animalId: '',
        productType: '',
        quantity: '',
        unit: '',
        price: '',
        saleDate: new Date(),
        notes: '',
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [animalsData, treatmentsData, salesData] = await Promise.all([
                getAnimals(),
                getTreatments(),
                getSales(),
            ]);

            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setTreatments(Array.isArray(treatmentsData) ? treatmentsData : []);
            setSales(Array.isArray(salesData) ? salesData : []);
        } catch (error) {
            console.error('Sales fetch error:', error);
            Alert.alert(t('error'), t('failed_load_sales'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const safeToSellAnimals = useMemo(() => {
        return animals.filter(animal => {
            const animalTreatments = treatments.filter(t => t.animalId === animal.tagId && t.status === 'Approved');
            if (animalTreatments.length === 0) return true;

            const lastTreatment = animalTreatments.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
            if (!lastTreatment.withdrawalEndDate) return false;

            return new Date() > new Date(lastTreatment.withdrawalEndDate);
        });
    }, [animals, treatments]);

    const stats = useMemo(() => {
        const totalSales = sales.length;
        const safeAnimals = safeToSellAnimals.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.price || 0), 0);
        const recentSales = sales.filter(s => {
            const saleDate = new Date(s.saleDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return saleDate >= thirtyDaysAgo;
        }).length;

        return { totalSales, safeAnimals, totalRevenue, recentSales };
    }, [sales, safeToSellAnimals]);

    const handleSaveSale = async () => {
        if (!formData.animalId || !formData.productType || !formData.quantity || !formData.unit || !formData.price) {
            Alert.alert(t('error'), t('fill_required_fields'));
            return;
        }

        try {
            setSubmitting(true);
            const saleData = {
                ...formData,
                quantity: parseFloat(formData.quantity),
                price: parseFloat(formData.price),
            };

            if (!isConnected) {
                await addToQueue({
                    type: 'ADD_SALE',
                    payload: saleData
                });
                Alert.alert(t('offline'), t('sale_queued'));
                setModalVisible(false);
                resetForm();
                return;
            }

            await addSale(saleData);
            Alert.alert(t('success'), t('sale_recorded_success'));
            setModalVisible(false);
            resetForm();
            fetchData(true);
        } catch (error) {
            console.error('Save sale error:', error);
            Alert.alert(t('error'), error.message || t('failed_record_sale'));
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            animalId: '',
            productType: '',
            quantity: '',
            unit: '',
            price: '',
            saleDate: new Date(),
            notes: '',
        });
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || formData.saleDate;
        setShowDatePicker(Platform.OS === 'ios');
        setFormData({ ...formData, saleDate: currentDate });
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchData(true)}
                        tintColor={theme.primary}
                        enabled={isConnected}
                    />
                }
            >
                {/* Header */}
                <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTop}>
                            <Ionicons name="cart" size={24} color="#60a5fa" />
                            <Text style={styles.headerTitle}>{t('sales_management')}</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            {t('sales_subtitle', { count: stats.safeAnimals })}
                        </Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <Ionicons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.addButtonText}>{t('log_new_sale')}</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon="cart"
                        value={stats.totalSales}
                        label={t('total_sales')}
                        color="#3b82f6"
                        theme={theme}
                    />
                    <StatCard
                        icon="checkmark-circle"
                        value={stats.safeAnimals}
                        label={t('safe_for_sale')}
                        color="#10b981"
                        theme={theme}
                    />
                    <StatCard
                        icon="cash"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        label={t('total_revenue')}
                        color="#8b5cf6"
                        theme={theme}
                    />
                    <StatCard
                        icon="time"
                        value={stats.recentSales}
                        label={t('recent_sales_30d')}
                        color="#f59e0b"
                        theme={theme}
                    />
                </View>

                {/* Safe Animals List */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('safe_for_sale')}</Text>
                    {safeToSellAnimals.length > 0 ? (
                        safeToSellAnimals.map(animal => (
                            <View key={animal._id} style={[styles.card, { backgroundColor: theme.card }]}>
                                <View style={styles.cardRow}>
                                    <View>
                                        <Text style={[styles.cardTitle, { color: theme.text }]}>{animal.tagId}</Text>
                                        <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>{animal.name || animal.species}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                                        <Text style={[styles.badgeText, { color: '#166534' }]}>{t('safe')}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_safe_animals')}</Text>
                    )}
                </View>

                {/* Sales History */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('sales_history')}</Text>
                    {sales.length > 0 ? (
                        sales.map(sale => (
                            <View key={sale._id} style={[styles.card, { backgroundColor: theme.card }]}>
                                <View style={styles.cardRow}>
                                    <View>
                                        <Text style={[styles.cardTitle, { color: theme.text }]}>{sale.productType} - {sale.quantity} {sale.unit}</Text>
                                        <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>
                                            {new Date(sale.saleDate).toLocaleDateString()} • {sale.animalId}
                                        </Text>
                                    </View>
                                    <Text style={[styles.priceText, { color: theme.primary }]}>
                                        ₹{sale.price.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_sales_recorded')}</Text>
                    )}
                </View>
            </ScrollView>

            {/* Add Sale Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('log_new_sale')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.label, { color: theme.text }]}>{t('animal')} *</Text>
                            <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                                <Picker
                                    selectedValue={formData.animalId}
                                    onValueChange={(itemValue) => setFormData({ ...formData, animalId: itemValue })}
                                    style={{ color: theme.text }}
                                    dropdownIconColor={theme.text}
                                >
                                    <Picker.Item label={t('select_animal')} value="" />
                                    {safeToSellAnimals.map(animal => (
                                        <Picker.Item key={animal.tagId} label={`${animal.tagId} (${animal.name || animal.species})`} value={animal.tagId} />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={[styles.label, { color: theme.text }]}>{t('product_type')} *</Text>
                            <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                                <Picker
                                    selectedValue={formData.productType}
                                    onValueChange={(itemValue) => setFormData({ ...formData, productType: itemValue })}
                                    style={{ color: theme.text }}
                                    dropdownIconColor={theme.text}
                                >
                                    <Picker.Item label={t('select_product')} value="" />
                                    <Picker.Item label={t('milk')} value="Milk" />
                                    <Picker.Item label={t('meat')} value="Meat" />
                                    <Picker.Item label={t('other')} value="Other" />
                                </Picker>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('quantity')} *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="e.g. 50"
                                        placeholderTextColor={theme.subtext}
                                        keyboardType="numeric"
                                        value={formData.quantity}
                                        onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>{t('unit')} *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="e.g. Liters"
                                        placeholderTextColor={theme.subtext}
                                        value={formData.unit}
                                        onChangeText={(text) => setFormData({ ...formData, unit: text })}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.label, { color: theme.text }]}>{t('total_price')} *</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="e.g. 1500"
                                placeholderTextColor={theme.subtext}
                                keyboardType="numeric"
                                value={formData.price}
                                onChangeText={(text) => setFormData({ ...formData, price: text })}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>{t('date_of_sale')}</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, { borderColor: theme.border, backgroundColor: theme.background }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: theme.text }}>{formData.saleDate.toDateString()}</Text>
                                <Ionicons name="calendar" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={formData.saleDate}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}

                            <Text style={[styles.label, { color: theme.text }]}>{t('notes')}</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, height: 80 }]}
                                placeholder={t('optional_notes')}
                                placeholderTextColor={theme.subtext}
                                multiline
                                value={formData.notes}
                                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
                                onPress={handleSaveSale}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>{t('record_sale')}</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const StatCard = ({ icon, value, label, color, theme }) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.subtext }]}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerContent: {},
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { color: '#cbd5e1', fontSize: 14, marginBottom: 16 },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 6,
    },
    addButtonText: { color: '#fff', fontWeight: '600' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: { padding: 8, borderRadius: 20, marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    statLabel: { fontSize: 12 },
    section: { padding: 16, paddingTop: 0 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '600' },
    cardSubtitle: { fontSize: 12, marginTop: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    priceText: { fontSize: 16, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalBody: {},
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
    pickerContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12 },
    submitButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default SalesScreen;
