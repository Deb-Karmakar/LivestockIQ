import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
    FlatList,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    createOfflineTreatment,
    getOfflineTreatments,
    deleteOfflineTreatment,
    resendPrescriptionEmail
} from '../../services/offlineTreatmentService';

const SPECIES_OPTIONS = ['Cattle', 'Buffalo', 'Sheep', 'Goat', 'Pig', 'Poultry', 'Other'];
const ROUTE_OPTIONS = ['Oral', 'Injection', 'Topical', 'IV', 'IM', 'SC', 'Other'];

const OfflineTreatmentsScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('create');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [treatments, setTreatments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecies, setSelectedSpecies] = useState('all');
    const [speciesPickerVisible, setSpeciesPickerVisible] = useState(false);
    const [routePickerVisible, setRoutePickerVisible] = useState(false);
    const [currentPrescriptionIndex, setCurrentPrescriptionIndex] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        farmerName: '',
        farmerPhone: '',
        farmerAddress: '',
        farmName: '',
        animalTagId: '',
        animalSpecies: 'Cattle',
        animalBreed: '',
        animalAge: '',
        animalWeight: '',
        diagnosis: '',
        symptoms: '',
        generalNotes: '',
        totalCost: ''
    });

    const [prescriptions, setPrescriptions] = useState([{
        drugName: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '',
        withdrawalPeriod: '',
        route: 'Oral',
        notes: ''
    }]);

    useEffect(() => {
        if (activeTab === 'past') {
            fetchTreatments();
        }
    }, [activeTab, searchTerm, selectedSpecies]);

    const fetchTreatments = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await getOfflineTreatments({
                search: searchTerm,
                species: selectedSpecies !== 'all' ? selectedSpecies : undefined
            });
            setTreatments(data.data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to load treatments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAddPrescription = () => {
        setPrescriptions([...prescriptions, {
            drugName: '',
            dosage: '',
            frequency: 'Once daily',
            duration: '',
            withdrawalPeriod: '',
            route: 'Oral',
            notes: ''
        }]);
    };

    const handleRemovePrescription = (index) => {
        if (prescriptions.length > 1) {
            setPrescriptions(prescriptions.filter((_, i) => i !== index));
        }
    };

    const handlePrescriptionChange = (index, field, value) => {
        const updated = [...prescriptions];
        updated[index][field] = value;
        setPrescriptions(updated);
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.farmerName.trim()) {
            Alert.alert('Error', 'Farmer name is required');
            return;
        }
        if (!formData.diagnosis.trim()) {
            Alert.alert('Error', 'Diagnosis is required');
            return;
        }
        if (prescriptions.some(p => !p.drugName.trim() || !p.dosage.trim())) {
            Alert.alert('Error', 'All prescriptions must have drug name and dosage');
            return;
        }

        try {
            setLoading(true);
            const submitData = {
                ...formData,
                animalWeight: formData.animalWeight ? parseFloat(formData.animalWeight) : undefined,
                totalCost: formData.totalCost ? parseFloat(formData.totalCost) : undefined,
                prescriptions: prescriptions.map(p => ({
                    ...p,
                    withdrawalPeriod: p.withdrawalPeriod ? parseInt(p.withdrawalPeriod) : undefined
                }))
            };

            const result = await createOfflineTreatment(submitData);

            if (result.emailSent) {
                Alert.alert('Success', 'Treatment record created and prescription email sent successfully');
            } else {
                Alert.alert('Partial Success', 'Treatment record created but email failed. You can resend it from Past Records.');
            }

            // Reset form
            resetForm();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create treatment');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            farmerName: '', farmerPhone: '', farmerAddress: '', farmName: '',
            animalTagId: '', animalSpecies: 'Cattle', animalBreed: '', animalAge: '',
            animalWeight: '', diagnosis: '', symptoms: '', generalNotes: '', totalCost: ''
        });
        setPrescriptions([{
            drugName: '', dosage: '', frequency: 'Once daily', duration: '',
            withdrawalPeriod: '', route: 'Oral', notes: ''
        }]);
    };

    const handleResendEmail = async (id) => {
        try {
            await resendPrescriptionEmail(id);
            Alert.alert('Success', 'Prescription email resent successfully');
            fetchTreatments();
        } catch (error) {
            Alert.alert('Error', 'Failed to resend email');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Treatment',
            'Are you sure you want to delete this treatment record?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteOfflineTreatment(id);
                            Alert.alert('Success', 'Treatment record deleted');
                            fetchTreatments();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete treatment');
                        }
                    }
                }
            ]
        );
    };

    const renderHeader = () => (
        <LinearGradient
            colors={['#064e3b', '#047857', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
            <View style={styles.headerContent}>
                <View style={styles.headerTopRow}>
                    <Ionicons name="people" size={16} color="#6ee7b7" />
                    <Text style={styles.headerLabel}>Offline Treatment Records</Text>
                </View>
                <Text style={styles.headerTitle}>Non-Registered Farmers</Text>
                <Text style={styles.headerSubtitle}>
                    Log treatments for farmers not in the system
                </Text>
            </View>
        </LinearGradient>
    );

    const renderTabs = () => (
        <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'create' && styles.activeTab]}
                onPress={() => setActiveTab('create')}
            >
                <Ionicons name="add-circle" size={18} color={activeTab === 'create' ? '#059669' : theme.subtext} />
                <Text style={[styles.tabText, { color: activeTab === 'create' ? '#059669' : theme.subtext }]}>
                    Create
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                onPress={() => setActiveTab('past')}
            >
                <Ionicons name="document-text" size={18} color={activeTab === 'past' ? '#059669' : theme.subtext} />
                <Text style={[styles.tabText, { color: activeTab === 'past' ? '#059669' : theme.subtext }]}>
                    Past Records
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderCreateTab = () => (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Farmer Details */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Farmer Details</Text>
                <View style={styles.formGrid}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Farmer Name *</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Enter farmer name"
                            placeholderTextColor={theme.subtext}
                            value={formData.farmerName}
                            onChangeText={(text) => setFormData({ ...formData, farmerName: text })}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Enter phone"
                            placeholderTextColor={theme.subtext}
                            keyboardType="phone-pad"
                            value={formData.farmerPhone}
                            onChangeText={(text) => setFormData({ ...formData, farmerPhone: text })}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Farm Name</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Enter farm name"
                            placeholderTextColor={theme.subtext}
                            value={formData.farmName}
                            onChangeText={(text) => setFormData({ ...formData, farmName: text })}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Address</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Enter address"
                            placeholderTextColor={theme.subtext}
                            value={formData.farmerAddress}
                            onChangeText={(text) => setFormData({ ...formData, farmerAddress: text })}
                        />
                    </View>
                </View>
            </View>

            {/* Animal Details */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Animal Details</Text>
                <View style={styles.formGrid}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Species *</Text>
                        <TouchableOpacity
                            style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.background }]}
                            onPress={() => setSpeciesPickerVisible(true)}
                        >
                            <Text style={{ color: theme.text }}>{formData.animalSpecies}</Text>
                            <Ionicons name="chevron-down" size={20} color={theme.subtext} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Tag ID</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Optional"
                            placeholderTextColor={theme.subtext}
                            value={formData.animalTagId}
                            onChangeText={(text) => setFormData({ ...formData, animalTagId: text })}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Breed</Text>
                        <TextInput
                            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Enter breed"
                            placeholderTextColor={theme.subtext}
                            value={formData.animalBreed}
                            onChangeText={(text) => setFormData({ ...formData, animalBreed: text })}
                        />
                    </View>
                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: theme.text }]}>Age</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                placeholder="e.g., 3 years"
                                placeholderTextColor={theme.subtext}
                                value={formData.animalAge}
                                onChangeText={(text) => setFormData({ ...formData, animalAge: text })}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                placeholder="Enter weight"
                                placeholderTextColor={theme.subtext}
                                keyboardType="numeric"
                                value={formData.animalWeight}
                                onChangeText={(text) => setFormData({ ...formData, animalWeight: text })}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* Diagnosis */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Diagnosis & Symptoms</Text>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Diagnosis *</Text>
                    <TextInput
                        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                        placeholder="Enter diagnosis"
                        placeholderTextColor={theme.subtext}
                        value={formData.diagnosis}
                        onChangeText={(text) => setFormData({ ...formData, diagnosis: text })}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Symptoms</Text>
                    <TextInput
                        style={[styles.textArea, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                        placeholder="Describe symptoms"
                        placeholderTextColor={theme.subtext}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={formData.symptoms}
                        onChangeText={(text) => setFormData({ ...formData, symptoms: text })}
                    />
                </View>
            </View>

            {/* Prescriptions */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Prescriptions</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddPrescription}>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.addBtnText}>Add Drug</Text>
                    </TouchableOpacity>
                </View>

                {prescriptions.map((prescription, index) => (
                    <View key={index} style={[styles.prescriptionCard, { borderColor: theme.border }]}>
                        <View style={styles.prescriptionHeader}>
                            <Text style={[styles.prescriptionTitle, { color: theme.text }]}>Drug #{index + 1}</Text>
                            {prescriptions.length > 1 && (
                                <TouchableOpacity onPress={() => handleRemovePrescription(index)}>
                                    <Ionicons name="trash" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Drug Name *</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                placeholder="Enter drug name"
                                placeholderTextColor={theme.subtext}
                                value={prescription.drugName}
                                onChangeText={(text) => handlePrescriptionChange(index, 'drugName', text)}
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.text }]}>Dosage *</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                    placeholder="e.g., 10ml"
                                    placeholderTextColor={theme.subtext}
                                    value={prescription.dosage}
                                    onChangeText={(text) => handlePrescriptionChange(index, 'dosage', text)}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.text }]}>Frequency</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                    placeholder="Once daily"
                                    placeholderTextColor={theme.subtext}
                                    value={prescription.frequency}
                                    onChangeText={(text) => handlePrescriptionChange(index, 'frequency', text)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.text }]}>Duration</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                    placeholder="e.g., 5 days"
                                    placeholderTextColor={theme.subtext}
                                    value={prescription.duration}
                                    onChangeText={(text) => handlePrescriptionChange(index, 'duration', text)}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.text }]}>Route</Text>
                                <TouchableOpacity
                                    style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.background }]}
                                    onPress={() => {
                                        setCurrentPrescriptionIndex(index);
                                        setRoutePickerVisible(true);
                                    }}
                                >
                                    <Text style={{ color: theme.text }}>{prescription.route}</Text>
                                    <Ionicons name="chevron-down" size={20} color={theme.subtext} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Withdrawal Period (days)</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                                placeholder="Enter days"
                                placeholderTextColor={theme.subtext}
                                keyboardType="numeric"
                                value={prescription.withdrawalPeriod}
                                onChangeText={(text) => handlePrescriptionChange(index, 'withdrawalPeriod', text)}
                            />
                        </View>
                    </View>
                ))}
            </View>

            {/* Additional Info */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Additional Information</Text>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>General Notes</Text>
                    <TextInput
                        style={[styles.textArea, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                        placeholder="Additional notes..."
                        placeholderTextColor={theme.subtext}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={formData.generalNotes}
                        onChangeText={(text) => setFormData({ ...formData, generalNotes: text })}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Total Cost (₹)</Text>
                    <TextInput
                        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                        placeholder="Enter cost"
                        placeholderTextColor={theme.subtext}
                        keyboardType="numeric"
                        value={formData.totalCost}
                        onChangeText={(text) => setFormData({ ...formData, totalCost: text })}
                    />
                </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="send" size={20} color="#fff" />
                        <Text style={styles.submitBtnText}>Submit & Send Email</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );

    const renderPastTab = () => (
        <View style={{ flex: 1 }}>
            {/* Search & Filter */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                <View style={[styles.searchInput, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.subtext} />
                    <TextInput
                        style={[styles.searchTextInput, { color: theme.text }]}
                        placeholder="Search farmer, diagnosis..."
                        placeholderTextColor={theme.subtext}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={() => setSpeciesPickerVisible(true)}
                >
                    <Ionicons name="filter" size={18} color={theme.subtext} />
                    <Text style={[styles.filterBtnText, { color: theme.text }]}>
                        {selectedSpecies === 'all' ? 'All' : selectedSpecies}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Records List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#059669" />
                </View>
            ) : (
                <FlatList
                    data={treatments}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchTreatments(true)} colors={['#059669']} />
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.recordCard, { backgroundColor: theme.card }]}>
                            <View style={styles.recordHeader}>
                                <View>
                                    <Text style={[styles.recordDate, { color: theme.subtext }]}>
                                        {new Date(item.treatmentDate).toLocaleDateString()}
                                    </Text>
                                    <Text style={[styles.recordFarmer, { color: theme.text }]}>{item.farmerName}</Text>
                                    {item.farmerPhone && (
                                        <Text style={[styles.recordPhone, { color: theme.subtext }]}>{item.farmerPhone}</Text>
                                    )}
                                </View>
                                <View style={[
                                    styles.emailBadge,
                                    { backgroundColor: item.emailSent ? '#dcfce7' : '#fef2f2' }
                                ]}>
                                    <Ionicons
                                        name={item.emailSent ? 'checkmark-circle' : 'close-circle'}
                                        size={14}
                                        color={item.emailSent ? '#16a34a' : '#dc2626'}
                                    />
                                    <Text style={[
                                        styles.emailBadgeText,
                                        { color: item.emailSent ? '#16a34a' : '#dc2626' }
                                    ]}>
                                        {item.emailSent ? 'Sent' : 'Failed'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.recordBody}>
                                <View style={styles.recordRow}>
                                    <Text style={[styles.recordLabel, { color: theme.subtext }]}>Animal:</Text>
                                    <Text style={[styles.recordValue, { color: theme.text }]}>
                                        {item.animalSpecies} {item.animalTagId ? `(${item.animalTagId})` : ''}
                                    </Text>
                                </View>
                                <View style={styles.recordRow}>
                                    <Text style={[styles.recordLabel, { color: theme.subtext }]}>Diagnosis:</Text>
                                    <Text style={[styles.recordValue, { color: theme.text }]}>{item.diagnosis}</Text>
                                </View>
                            </View>

                            <View style={styles.recordActions}>
                                {!item.emailSent && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#dbeafe' }]}
                                        onPress={() => handleResendEmail(item._id)}
                                    >
                                        <Ionicons name="refresh" size={16} color="#2563eb" />
                                        <Text style={[styles.actionBtnText, { color: '#2563eb' }]}>Resend</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
                                    onPress={() => handleDelete(item._id)}
                                >
                                    <Ionicons name="trash" size={16} color="#dc2626" />
                                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color={theme.subtext} />
                            <Text style={[styles.emptyText, { color: theme.subtext }]}>No treatment records found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderHeader()}
            {renderTabs()}
            {activeTab === 'create' ? renderCreateTab() : renderPastTab()}

            {/* Species Picker Modal */}
            <Modal visible={speciesPickerVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSpeciesPickerVisible(false)}
                >
                    <View style={[styles.pickerModal, { backgroundColor: theme.card }]}>
                        <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Species</Text>
                        {activeTab === 'past' && (
                            <TouchableOpacity
                                style={[styles.pickerOption, { borderBottomColor: theme.border }]}
                                onPress={() => {
                                    setSelectedSpecies('all');
                                    setSpeciesPickerVisible(false);
                                }}
                            >
                                <Text style={[styles.pickerOptionText, { color: theme.text }]}>All Species</Text>
                                {selectedSpecies === 'all' && <Ionicons name="checkmark" size={20} color="#059669" />}
                            </TouchableOpacity>
                        )}
                        {SPECIES_OPTIONS.map((species) => (
                            <TouchableOpacity
                                key={species}
                                style={[styles.pickerOption, { borderBottomColor: theme.border }]}
                                onPress={() => {
                                    if (activeTab === 'create') {
                                        setFormData({ ...formData, animalSpecies: species });
                                    } else {
                                        setSelectedSpecies(species);
                                    }
                                    setSpeciesPickerVisible(false);
                                }}
                            >
                                <Text style={[styles.pickerOptionText, { color: theme.text }]}>{species}</Text>
                                {(activeTab === 'create' ? formData.animalSpecies : selectedSpecies) === species && (
                                    <Ionicons name="checkmark" size={20} color="#059669" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Route Picker Modal */}
            <Modal visible={routePickerVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setRoutePickerVisible(false)}
                >
                    <View style={[styles.pickerModal, { backgroundColor: theme.card }]}>
                        <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Route</Text>
                        {ROUTE_OPTIONS.map((route) => (
                            <TouchableOpacity
                                key={route}
                                style={[styles.pickerOption, { borderBottomColor: theme.border }]}
                                onPress={() => {
                                    handlePrescriptionChange(currentPrescriptionIndex, 'route', route);
                                    setRoutePickerVisible(false);
                                }}
                            >
                                <Text style={[styles.pickerOptionText, { color: theme.text }]}>{route}</Text>
                                {prescriptions[currentPrescriptionIndex]?.route === route && (
                                    <Ionicons name="checkmark" size={20} color="#059669" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 50, paddingBottom: 24 },
    headerContent: {},
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    headerLabel: { color: '#6ee7b7', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: '#a7f3d0' },

    tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderRadius: 8 },
    activeTab: { backgroundColor: '#d1fae5' },
    tabText: { fontSize: 14, fontWeight: '600' },

    formContainer: { padding: 16 },
    card: { borderRadius: 16, padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },

    formGrid: {},
    inputGroup: { marginBottom: 12 },
    inputRow: { flexDirection: 'row', gap: 12 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
    textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 80 },
    picker: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    prescriptionCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 12 },
    prescriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    prescriptionTitle: { fontSize: 15, fontWeight: '600' },

    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', padding: 16, borderRadius: 12 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    searchContainer: { flexDirection: 'row', padding: 16, gap: 12 },
    searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, gap: 8 },
    searchTextInput: { flex: 1, height: 44, fontSize: 15 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
    filterBtnText: { fontSize: 14 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16 },

    recordCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
    recordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    recordDate: { fontSize: 12, marginBottom: 2 },
    recordFarmer: { fontSize: 16, fontWeight: '600' },
    recordPhone: { fontSize: 13, marginTop: 2 },
    emailBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    emailBadgeText: { fontSize: 12, fontWeight: '600' },

    recordBody: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, marginBottom: 12 },
    recordRow: { flexDirection: 'row', marginBottom: 6 },
    recordLabel: { fontSize: 13, width: 80 },
    recordValue: { fontSize: 14, flex: 1, fontWeight: '500' },

    recordActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    actionBtnText: { fontSize: 13, fontWeight: '600' },

    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, marginTop: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    pickerModal: { width: '100%', maxWidth: 320, borderRadius: 16, padding: 8, maxHeight: '70%' },
    pickerTitle: { fontSize: 17, fontWeight: '600', padding: 16, textAlign: 'center' },
    pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    pickerOptionText: { fontSize: 15 },
});

export default OfflineTreatmentsScreen;
