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
import { useTheme } from '../../contexts/ThemeContext';

import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const AddAnimalScreen = ({ navigation, route }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
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
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>{isEditing ? t('edit_animal') : t('add_new_animal')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Tag ID */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('tag_id_label')}</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[
                                styles.input,
                                styles.flexInput,
                                { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
                                isEditing && { backgroundColor: theme.background, color: theme.subtext }
                            ]}
                            placeholder={t('tag_id_placeholder')}
                            placeholderTextColor={theme.subtext}
                            value={formData.tagId}
                            onChangeText={(text) => setFormData({ ...formData, tagId: text })}
                            maxLength={12}
                            keyboardType="numeric"
                            editable={!isEditing}
                        />
                        <TouchableOpacity
                            style={[
                                styles.scanButton,
                                { backgroundColor: theme.card, borderColor: theme.border },
                                isEditing && { backgroundColor: theme.background, borderColor: theme.border }
                            ]}
                            disabled={isEditing}
                            onPress={() => setShowScanner(true)}
                        >
                            <Ionicons name="qr-code" size={20} color={isEditing ? theme.subtext : theme.success} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Name */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('animal_name_label')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                        placeholder={t('animal_name_placeholder')}
                        placeholderTextColor={theme.subtext}
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                </View>

                {/* Species & Gender Row */}
                <View style={styles.row}>
                    <View style={[styles.field, styles.halfWidth]}>
                        <Text style={[styles.label, { color: theme.text }]}>{t('species_label')}</Text>
                        <View style={styles.chipContainer}>
                            {speciesList.slice(0, 4).map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: theme.background, borderColor: theme.border },
                                        formData.species === s && { backgroundColor: theme.primary, borderColor: theme.primary },
                                    ]}
                                    onPress={() => setFormData({ ...formData, species: s })}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: theme.subtext },
                                            formData.species === s && { color: '#fff' },
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
                                        { backgroundColor: theme.background, borderColor: theme.border },
                                        formData.species === s && { backgroundColor: theme.primary, borderColor: theme.primary },
                                    ]}
                                    onPress={() => setFormData({ ...formData, species: s })}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: theme.subtext },
                                            formData.species === s && { color: '#fff' },
                                        ]}
                                    >
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.field, styles.halfWidth]}>
                        <Text style={[styles.label, { color: theme.text }]}>{t('gender_label')}</Text>
                        <View style={styles.chipContainer}>
                            {genderList.map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: theme.background, borderColor: theme.border },
                                        formData.gender === g && { backgroundColor: theme.primary, borderColor: theme.primary },
                                    ]}
                                    onPress={() => setFormData({ ...formData, gender: g })}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: theme.subtext },
                                            formData.gender === g && { color: '#fff' },
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
                    <Text style={[styles.label, { color: theme.text }]}>{t('dob_label')}</Text>
                    <TouchableOpacity
                        style={[styles.dateInput, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar" size={20} color={theme.subtext} />
                        <Text style={[styles.dateText, { color: theme.text }]}>
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
                    <Text style={[styles.label, { color: theme.text }]}>{t('weight_label')}</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, styles.flexInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                            placeholder={t('weight_placeholder')}
                            placeholderTextColor={theme.subtext}
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
                                        { backgroundColor: theme.background, borderColor: theme.border },
                                        formData.weightUnit === unit && { backgroundColor: theme.primary, borderColor: theme.primary },
                                    ]}
                                    onPress={() => setFormData({ ...formData, weightUnit: unit })}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: theme.subtext },
                                            formData.weightUnit === unit && { color: '#fff' },
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
                    <Text style={[styles.label, { color: theme.text }]}>{t('notes_label')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                        placeholder={t('notes_placeholder')}
                        placeholderTextColor={theme.subtext}
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
                        style={[styles.button, styles.cancelButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={[styles.cancelButtonText, { color: theme.text }]}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.submitButton,
                            { backgroundColor: theme.primary },
                            loading && { backgroundColor: theme.subtext }
                        ]}
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
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
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    inputDisabled: {
        // Handled dynamically
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
        borderWidth: 1,
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
        borderWidth: 1,
    },
    chipSelected: {
        // Handled dynamically
    },
    chipText: {
        fontSize: 13,
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
        borderWidth: 1,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    dateText: {
        fontSize: 16,
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
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        // Handled dynamically
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        // Handled dynamically
    },
});

export default AddAnimalScreen;
