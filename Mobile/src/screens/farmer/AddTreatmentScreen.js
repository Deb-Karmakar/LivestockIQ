import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAnimals } from '../../services/animalService';
import { addTreatment } from '../../services/treatmentService';
import { getMyProfile } from '../../services/farmerService';

const AddTreatmentScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [animals, setAnimals] = useState([]);
    const [vetId, setVetId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        animalId: '',
        drugName: '',
        dose: '',
        route: 'Oral',
        notes: '',
        startDate: new Date(),
    });

    // UI State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAnimalPicker, setShowAnimalPicker] = useState(false);
    const [showRoutePicker, setShowRoutePicker] = useState(false);

    const routes = ['Oral', 'Injection', 'Subcutaneous', 'Topical'];

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [animalsData, profileData] = await Promise.all([
                getAnimals(),
                getMyProfile(),
            ]);

            // Filter eligible animals (SAFE or NEW or no status)
            const eligible = (animalsData || []).filter(a =>
                !a.mrlStatus || a.mrlStatus === 'SAFE' || a.mrlStatus === 'NEW'
            );
            setAnimals(eligible);
            setVetId(profileData?.vetId);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load initial data');
        }
    };

    const handleSubmit = async () => {
        if (!formData.animalId || !formData.drugName) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                vetId: vetId,
            };
            await addTreatment(submitData);
            Alert.alert('Success', 'Treatment record submitted for review');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save treatment');
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData({ ...formData, startDate: selectedDate });
        }
    };

    const renderAnimalItem = ({ item }) => (
        <TouchableOpacity
            style={styles.pickerItem}
            onPress={() => {
                setFormData({ ...formData, animalId: item.tagId });
                setShowAnimalPicker(false);
            }}
        >
            <View style={styles.pickerItemContent}>
                <Text style={styles.pickerItemTitle}>{item.tagId}</Text>
                <Text style={styles.pickerItemSubtitle}>{item.name || item.species}</Text>
            </View>
            {formData.animalId === item.tagId && (
                <Ionicons name="checkmark" size={20} color="#10b981" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Add Treatment</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Animal Selection */}
                <View style={styles.field}>
                    <Text style={styles.label}>Animal *</Text>
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => setShowAnimalPicker(true)}
                    >
                        <Text style={[styles.selectButtonText, !formData.animalId && styles.placeholderText]}>
                            {formData.animalId || 'Select Animal'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                {/* Drug Name */}
                <View style={styles.field}>
                    <Text style={styles.label}>Drug Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Amoxicillin"
                        value={formData.drugName}
                        onChangeText={(text) => setFormData({ ...formData, drugName: text })}
                    />
                </View>

                {/* Dose & Route Row */}
                <View style={styles.row}>
                    <View style={[styles.field, styles.halfWidth]}>
                        <Text style={styles.label}>Dose</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 10ml"
                            value={formData.dose}
                            onChangeText={(text) => setFormData({ ...formData, dose: text })}
                        />
                    </View>

                    <View style={[styles.field, styles.halfWidth]}>
                        <Text style={styles.label}>Route</Text>
                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setShowRoutePicker(true)}
                        >
                            <Text style={styles.selectButtonText}>{formData.route}</Text>
                            <Ionicons name="chevron-down" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Start Date */}
                <View style={styles.field}>
                    <Text style={styles.label}>Start Date</Text>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar" size={20} color="#6b7280" />
                        <Text style={styles.dateText}>
                            {formData.startDate.toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.startDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}
                </View>

                {/* Notes */}
                <View style={styles.field}>
                    <Text style={styles.label}>Reason / Notes</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="e.g., Respiratory infection"
                        value={formData.notes}
                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit for Review</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Animal Picker Modal */}
            <Modal visible={showAnimalPicker} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Animal</Text>
                        <TouchableOpacity onPress={() => setShowAnimalPicker(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={animals}
                        keyExtractor={(item) => item._id}
                        renderItem={renderAnimalItem}
                        contentContainerStyle={styles.modalList}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No eligible animals found</Text>
                            </View>
                        }
                    />
                </View>
            </Modal>

            {/* Route Picker Modal */}
            <Modal visible={showRoutePicker} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowRoutePicker(false)}
                >
                    <View style={styles.pickerModal}>
                        {routes.map((route) => (
                            <TouchableOpacity
                                key={route}
                                style={styles.pickerModalItem}
                                onPress={() => {
                                    setFormData({ ...formData, route });
                                    setShowRoutePicker(false);
                                }}
                            >
                                <Text style={[
                                    styles.pickerModalText,
                                    formData.route === route && styles.pickerModalTextSelected
                                ]}>
                                    {route}
                                </Text>
                                {formData.route === route && (
                                    <Ionicons name="checkmark" size={20} color="#10b981" />
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
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    form: {
        flex: 1,
        padding: 20,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
    },
    selectButtonText: {
        fontSize: 16,
        color: '#1f2937',
    },
    placeholderText: {
        color: '#9ca3af',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    dateText: {
        fontSize: 16,
        color: '#1f2937',
    },
    submitButton: {
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '600',
    },
    modalList: {
        padding: 20,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    pickerItemContent: {
        flex: 1,
    },
    pickerItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    pickerItemSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    pickerModal: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
    },
    pickerModalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
    },
    pickerModalText: {
        fontSize: 16,
        color: '#1f2937',
    },
    pickerModalTextSelected: {
        color: '#10b981',
        fontWeight: '600',
    },
});

export default AddTreatmentScreen;
