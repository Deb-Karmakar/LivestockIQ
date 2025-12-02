// Mobile/src/screens/farmer/AddAnimalScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createAnimal, updateAnimal } from '../../services/animalService';
import { useLanguage } from '../../contexts/LanguageContext';

import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const AddAnimalScreen = ({ navigation, route }) => {
    const { t } = useLanguage();
    const { animal } = route.params || {};
    const isEditing = !!animal;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tagId: animal?.tagId || '',
        name: animal?.name || '',
        species: animal?.species || 'Cattle',
        gender: animal?.gender || 'Male',
        weight: animal?.weight ? animal.weight.split(' ')[0] : '',
        weightUnit: animal?.weight ? animal.weight.split(' ')[1] : 'kg',
        notes: animal?.notes || '',
        dob: animal?.dob ? new Date(animal.dob) : new Date(),
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const speciesList = ['Cattle', 'Buffalo', 'Sheep', 'Goat', 'Pig', 'Horse', 'Yak'];
    const genderList = ['Male', 'Female'];
    const weightUnits = ['kg', 'lbs'];

    const handleSubmit = async () => {
        if (!formData.tagId || formData.tagId.length !== 12) {
            Alert.alert(t('error'), t('tag_id_error'));
            return;
        }
        if (!formData.species) {
            Alert.alert(t('error'), t('species_error'));
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                weight: formData.weight ? `${formData.weight} ${formData.weightUnit}` : '',
            };

            if (isEditing) {
                await updateAnimal(animal._id, submitData);
                Alert.alert(t('success'), t('animal_updated_success'));
            } else {
                await createAnimal(submitData);
                Alert.alert(t('success'), t('animal_added_success'));
            }

            navigation.goBack();
        } catch (error) {
            Alert.alert(t('error'), error.response?.data?.message || 'Failed to save animal');
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData({ ...formData, dob: selectedDate });
        }
    };

    const handleScan = (data) => {
        setFormData({ ...formData, tagId: data });
        setShowScanner(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEditing ? t('edit_animal') : t('add_new_animal')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Tag ID */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('tag_id_label')}</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, styles.flexInput, isEditing && styles.inputDisabled]}
                            placeholder={t('tag_id_placeholder')}
                            value={formData.tagId}
                            onChangeText={(text) => setFormData({ ...formData, tagId: text })}
                            maxLength={12}
                            keyboardType="numeric"
                            editable={!isEditing}
                        />
                        <TouchableOpacity
                            style={[styles.scanButton, isEditing && styles.buttonDisabled]}
                            disabled={isEditing}
                            onPress={() => setShowScanner(true)}
                        >
                            <Ionicons name="qr-code" size={20} color={isEditing ? '#9ca3af' : '#10b981'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Name */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('animal_name_label')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('animal_name_placeholder')}
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                </View>

                {/* Species & Gender Row */}
                <View style={styles.row}>
                    <View style={[styles.field, styles.halfWidth]}>
                        <Text style={styles.label}>{t('species_label')}</Text>
                        <View style={styles.chipContainer}>
                            {speciesList.slice(0, 4).map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.chip,
                                        formData.species === s && styles.chipSelected,
                                    ]}
                                    onPress={() => setFormData({ ...formData, species: s })}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.species === s && styles.chipTextSelected,
                                        ]}
                                    >
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={[styles.chipContainer, { marginTop: 8 }]}>
                            {speciesList.slice(4).map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.chip,
                                        formData.species === s && styles.chipSelected,
                                    ]}
                                    onPress={() => setFormData({ ...formData, species: s })}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.species === s && styles.chipTextSelected,
                                        ]}
                                    >
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.field, styles.halfWidth]}>
                        <Text style={styles.label}>{t('gender_label')}</Text>
                        <View style={styles.chipContainer}>
                            {genderList.map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.chip,
                                        formData.gender === g && styles.chipSelected,
                                    ]}
                                    onPress={() => setFormData({ ...formData, gender: g })}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.gender === g && styles.chipTextSelected,
                                        ]}
                                    >
                                        {g}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Date of Birth */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('dob_label')}</Text>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar" size={20} color="#6b7280" />
                        <Text style={styles.dateText}>
                            {formData.dob.toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.dob}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                {/* Weight */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('weight_label')}</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, styles.flexInput]}
                            placeholder={t('weight_placeholder')}
                            value={formData.weight}
                            onChangeText={(text) => setFormData({ ...formData, weight: text })}
                            keyboardType="numeric"
                        />
                        <View style={styles.chipContainer}>
                            {weightUnits.map((unit) => (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        styles.unitChip,
                                        formData.weightUnit === unit && styles.chipSelected,
                                    ]}
                                    onPress={() => setFormData({ ...formData, weightUnit: unit })}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.weightUnit === unit && styles.chipTextSelected,
                                        ]}
                                    >
                                        {unit}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.field}>
                    <Text style={styles.label}>{t('notes_label')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={t('notes_placeholder')}
                        value={formData.notes}
                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {isEditing ? t('save_changes') : t('add_animal_btn')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <BarcodeScannerModal
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleScan}
            />
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
    inputDisabled: {
        backgroundColor: '#f3f4f6',
        color: '#9ca3af',
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    flexInput: {
        flex: 1,
    },
    scanButton: {
        width: 48,
        height: 48,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    chipSelected: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    chipText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    unitChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
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
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        marginBottom: 40,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    submitButton: {
        backgroundColor: '#10b981',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
        borderColor: '#9ca3af',
    },
});

export default AddAnimalScreen;
