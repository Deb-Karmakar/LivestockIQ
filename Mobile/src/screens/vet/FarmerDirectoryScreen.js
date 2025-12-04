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
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyFarmers, getAnimalsForFarmer, reportFarmer } from '../../services/vetService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSync } from '../../contexts/SyncContext';

const FarmerDirectoryScreen = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { isConnected } = useNetwork();
    const { addToQueue } = useSync();
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
            Alert.alert(t('error'), t('failed_load_dashboard'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

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
            Alert.alert(t('error'), t('failed_load_dashboard'));
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
            Alert.alert(t('error'), t('select_reason_error'));
            return;
        }

        try {
            if (!isConnected) {
                await addToQueue({
                    type: 'REPORT_FARMER',
                    payload: {
                        farmerId: selectedFarmer._id,
                        reason: reportReason,
                        details: reportDetails
                    }
                });
                setReportModalVisible(false);
                Alert.alert(t('offline'), t('report_queued'));
                return;
            }

            await reportFarmer({
                farmerId: selectedFarmer._id,
                reason: reportReason,
                details: reportDetails
            });
            setReportModalVisible(false);
            Alert.alert(t('success'), t('report_submitted'));
        } catch (error) {
            Alert.alert(t('error'), t('failed_submit_report'));
        }
    };

    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        } else {
            Alert.alert(t('error'), t('no_phone'));
        }
    };

    const handleEmail = (email) => {
        if (email) {
            Linking.openURL(`mailto:${email}`);
        } else {
            Alert.alert(t('error'), t('no_email'));
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
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                        {item.farmOwner?.charAt(0) || 'F'}
                    </Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={[styles.farmerName, { color: theme.text }]}>{item.farmOwner}</Text>
                    <Text style={[styles.farmName, { color: theme.subtext }]}>{item.farmName}</Text>
                </View>
                <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => handleReportPress(item)}
                >
                    <Ionicons name="alert-circle-outline" size={24} color={theme.error} />
                </TouchableOpacity>
            </View>

            <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: `${theme.primary}10` }]}
                    onPress={() => handleViewAnimals(item)}
                >
                    <Ionicons name="paw" size={16} color={theme.primary} />
                    <Text style={[styles.primaryBtnText, { color: theme.primary }]}>{t('view_animals')}</Text>
                </TouchableOpacity>
                <View style={styles.contactActions}>
                    <TouchableOpacity
                        style={[styles.iconBtn, { borderColor: theme.border }]}
                        onPress={() => handleCall(item.phoneNumber)}
                    >
                        <Ionicons name="call-outline" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconBtn, { borderColor: theme.border }]}
                        onPress={() => handleEmail(item.email)}
                    >
                        <Ionicons name="mail-outline" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <Ionicons name="people" size={16} color="#60a5fa" />
                        <Text style={styles.headerLabel}>{t('farmer_management')}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{t('farmer_directory')}</Text>
                    <Text style={styles.headerSubtitle}>
                        {t('manage_farmers', { count: farmers.length }).split(/<bold>(.*?)<\/bold>/).map((part, index) => {
                            if (index === 1) return <Text key={index} style={styles.highlightText}>{part}</Text>;
                            return <Text key={index}>{part}</Text>;
                        })}
                    </Text>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('search_placeholder')}
                            placeholderTextColor="#9ca3af"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                </View>
                {!isConnected && (
                    <Text style={{ textAlign: 'center', color: theme.warning, marginTop: 8, fontSize: 12 }}>
                        {t('offline_mode_cached_data')}
                    </Text>
                )}
            </LinearGradient>

            {loading ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredFarmers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderFarmer}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} enabled={isConnected} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color={theme.border} />
                            <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_farmers')}</Text>
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
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('livestock_registry')}</Text>
                        <TouchableOpacity onPress={() => setAnimalsModalVisible(false)}>
                            <Text style={[styles.closeBtnText, { color: theme.primary }]}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.modalSubHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                            {t('animals_for', { farm: selectedFarmer?.farmName })}
                        </Text>
                    </View>

                    {animalsLoading ? (
                        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={farmerAnimals}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.animalsList}
                            renderItem={({ item }) => (
                                <View style={[styles.animalRow, { backgroundColor: theme.card }]}>
                                    <View>
                                        <Text style={[styles.animalId, { color: theme.text }]}>{item.tagId}</Text>
                                        <Text style={[styles.animalSpecies, { color: theme.subtext }]}>{item.species} • {item.gender}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.animalAge, { color: theme.text }]}>{calculateAge(item.dob)}</Text>
                                        <Text style={[styles.animalName, { color: theme.subtext }]}>{item.name || 'No Name'}</Text>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_animals_farmer')}</Text>
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
                    <View style={[styles.reportModalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.reportTitle, { color: theme.error }]}>{t('report_non_compliance')}</Text>
                        <Text style={[styles.reportSubtitle, { color: theme.subtext }]}>
                            {t('report_subtitle', { farm: selectedFarmer?.farmName })}
                        </Text>

                        <Text style={[styles.label, { color: theme.text }]}>{t('reason')}</Text>
                        <View style={styles.reasonButtons}>
                            {[
                                'suspected_overuse',
                                'poor_records',
                                'failure_withdrawal',
                                'other'
                            ].map((reasonKey) => (
                                <TouchableOpacity
                                    key={reasonKey}
                                    style={[
                                        styles.reasonBtn,
                                        { borderColor: theme.border, backgroundColor: theme.background },
                                        reportReason === reasonKey && { borderColor: theme.error, backgroundColor: `${theme.error}10` }
                                    ]}
                                    onPress={() => setReportReason(reasonKey)}
                                >
                                    <Text style={[
                                        styles.reasonBtnText,
                                        { color: theme.subtext },
                                        reportReason === reasonKey && { color: theme.error, fontWeight: '600' }
                                    ]}>
                                        {t(reasonKey)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: theme.text }]}>{t('details')}</Text>
                        <TextInput
                            style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
                            placeholder={t('provide_details')}
                            placeholderTextColor={theme.subtext}
                            value={reportDetails}
                            onChangeText={setReportDetails}
                            multiline
                            textAlignVertical="top"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: theme.background }]}
                                onPress={() => setReportModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: theme.subtext }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.submitReportBtn, { backgroundColor: theme.error }]}
                                onPress={submitReport}
                            >
                                <Text style={styles.submitReportBtnText}>{t('submit_report')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    card: { borderRadius: 12, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 18, fontWeight: 'bold' },
    headerInfo: { flex: 1 },
    farmerName: { fontSize: 16, fontWeight: '600' },
    farmName: { fontSize: 14 },
    moreBtn: { padding: 4 },
    cardActions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, paddingTop: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
    primaryBtn: {},
    primaryBtnText: { fontWeight: '600', fontSize: 14 },
    contactActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 16 },

    // Animals Modal
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    closeBtnText: { fontSize: 16, fontWeight: '600' },
    modalSubHeader: { padding: 16, borderBottomWidth: 1 },
    modalSubtitle: { fontSize: 14 },
    animalsList: { padding: 16 },
    animalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
    animalId: { fontSize: 16, fontWeight: '600' },
    animalSpecies: { fontSize: 14, marginTop: 2 },
    animalAge: { fontSize: 14, fontWeight: '500' },
    animalName: { fontSize: 12, marginTop: 2 },

    // Report Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    reportModalContent: { borderRadius: 12, padding: 20, maxHeight: '80%' },
    reportTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    reportSubtitle: { fontSize: 14, marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    reasonButtons: { gap: 8, marginBottom: 20 },
    reasonBtn: { padding: 12, borderRadius: 8, borderWidth: 1 },
    activeReasonBtn: {},
    reasonBtnText: { fontSize: 13 },
    activeReasonBtnText: { fontWeight: '600' },
    textArea: { borderWidth: 1, borderRadius: 8, padding: 12, height: 100, marginBottom: 20, fontSize: 14 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    cancelBtn: {},
    submitReportBtn: {},
    cancelBtnText: { fontWeight: '600' },
    submitReportBtnText: { color: '#fff', fontWeight: '600' },
});

export default FarmerDirectoryScreen;
