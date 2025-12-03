// Mobile/src/screens/farmer/AddTreatmentScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { createTreatment } from '../../services/treatmentService';
import { getAnimals } from '../../services/animalService';
import { getFarmerProfile } from '../../services/farmerService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const AddTreatmentScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [animals, setAnimals] = useState([]);
    const [vetId, setVetId] = useState(null);

    const [formData, setFormData] = useState({
        animalId: '',
        drugName: '',
        dose: '',
        route: 'Oral',
        startDate: new Date(),
        reason: '',
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchAnimals();
        fetchFarmerProfile();
    }, []);

    const fetchAnimals = async () => {
        try {
            const data = await getAnimals();
            setAnimals(data);
        } catch (error) {
            console.error('Failed to fetch animals', error);
        }
    };

    const fetchFarmerProfile = async () => {
        try {
            const profile = await getFarmerProfile();
            if (profile && profile.associatedVetId) {
                setVetId(profile.associatedVetId);
            }
        } catch (error) {
            console.error('Failed to fetch farmer profile', error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.animalId || !formData.drugName || !formData.dose) {
            Alert.alert(t('error'), t('fill_required'));
            return;
        }

        setLoading(true);
        try {
            await createTreatment({
                ...formData,
                vetId: vetId, // Associate with the farmer's vet
            });
            Alert.alert(t('success'), t('treatment_submitted'));
            navigation.goBack();
        } catch (error) {
            Alert.alert(t('error'), error.response?.data?.message || 'Failed to save treatment');
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

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>{t('add_treatment')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Animal Selection */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('animal_required')}</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Picker
                            selectedValue={formData.animalId}
                            onValueChange={(itemValue) => setFormData({ ...formData, animalId: itemValue })}
                            style={{ color: theme.text }}
                            dropdownIconColor={theme.text}
                        >
                            <Picker.Item label={t('select_animal')} value="" color={theme.text} />
                            {animals.map((animal) => (
                                <Picker.Item
                                    key={animal._id}
                                    label={`${animal.tagId} - ${animal.name || 'No Name'}`}
                                    value={animal.tagId}
                                    color={theme.text}
                                />
                            ))}
                        </Picker>
                    </View>
                    {animals.length === 0 && (
                        <Text style={styles.helperText}>{t('no_eligible_animals')}</Text>
                    )}
                </View>

                {/* Drug Name */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('drug_name_label')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                        placeholder="e.g., Amoxicillin"
                        placeholderTextColor={theme.subtext}
                        value={formData.drugName}
                        onChangeText={(text) => setFormData({ ...formData, drugName: text })}
                    />
                </View>

                {/* Dose & Route */}
                <View style={styles.row}>
                    <View style={[styles.field, styles.halfWidth]}>
                        <Text style={[styles.label, { color: theme.text }]}>{t('dose')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                            placeholder="e.g., 10ml"
                            placeholderTextColor={theme.subtext}
                            value={formData.dose}
                            onChangeText={(text) => setFormData({ ...formData, dose: text })}
                        />
                    </View>
                    <View style={[styles.field, styles.halfWidth]}>
                        <Text style={[styles.label, { color: theme.text }]}>{t('route')}</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Picker
                                selectedValue={formData.route}
                                onValueChange={(itemValue) => setFormData({ ...formData, route: itemValue })}
                                style={{ color: theme.text }}
                                dropdownIconColor={theme.text}
                            >
                                <Picker.Item label="Oral" value="Oral" color={theme.text} />
                                <Picker.Item label="Injection" value="Injection" color={theme.text} />
                                <Picker.Item label="Topical" value="Topical" color={theme.text} />
                            </Picker>
                        </View>
                    </View>
                </View>

                {/* Start Date */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('start_date')}</Text>
                    <TouchableOpacity
                        style={[styles.dateInput, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar" size={20} color={theme.subtext} />
                        <Text style={[styles.dateText, { color: theme.text }]}>
                            {formData.startDate.toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.startDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                {/* Reason */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('reason_notes')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                        placeholder="e.g., Respiratory infection"
                        placeholderTextColor={theme.subtext}
                        value={formData.reason}
                        onChangeText={(text) => setFormData({ ...formData, reason: text })}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
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
                        <Text style={styles.submitButtonText}>{t('submit_review')}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
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
    submitButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        // Handled dynamically
    },
    helperText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
});

export default AddTreatmentScreen;
