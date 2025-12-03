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
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { createTreatment } from '../../services/treatmentService';
import { getAnimals } from '../../services/animalService';
import { getFarmerProfile } from '../../services/farmerService';
import { getVetDetailsByCode } from '../../services/vetService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const AddTreatmentScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [animals, setAnimals] = useState([]);
    const [eligibleAnimals, setEligibleAnimals] = useState([]);
    const [ineligibleCount, setIneligibleCount] = useState(0);
    const [vetId, setVetId] = useState(null);
    const [vetName, setVetName] = useState(null);

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

            // Filter eligible animals (SAFE, NEW, or no status)
            const eligible = (data || []).filter(animal =>
                animal.mrlStatus === 'SAFE' ||
                animal.mrlStatus === 'NEW' ||
                !animal.mrlStatus
            );
            setEligibleAnimals(eligible);
            setIneligibleCount((data || []).length - eligible.length);
        } catch (error) {
            console.error('Failed to fetch animals', error);
        }
    };

    const fetchFarmerProfile = async () => {
        try {
            const profile = await getFarmerProfile();
            // The backend returns 'vetId', not 'associatedVetId'
            if (profile && profile.vetId) {
                setVetId(profile.vetId);
                // Fetch vet details using the vetId
                const vetDetails = await getVetDetailsByCode(profile.vetId);
                if (vetDetails) {
                    setVetName(vetDetails.fullName);
                }
            }
        } catch (error) {
            console.error('Failed to fetch farmer profile or vet details', error);
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
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>{t('add_treatment')}</Text>
                        <Text style={styles.headerSubtitle}>{t('treatment_subtitle')}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Ineligible Warning */}
                {ineligibleCount > 0 && (
                    <View style={[styles.warningBox, { backgroundColor: '#fffbeb', borderColor: '#fcd34d' }]}>
                        <Ionicons name="warning" size={20} color="#b45309" />
                        <Text style={[styles.warningText, { color: '#92400e' }]}>
                            {t('ineligible_animals_warning', { count: ineligibleCount })}
                        </Text>
                    </View>
                )}

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
                            {eligibleAnimals.map((animal) => (
                                <Picker.Item
                                    key={animal._id}
                                    label={`${animal.tagId} - ${animal.name || 'No Name'}`}
                                    value={animal.tagId}
                                    color={theme.text}
                                />
                            ))}
                        </Picker>
                    </View>
                    {eligibleAnimals.length === 0 && (
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
                                <Picker.Item label="Subcutaneous" value="Subcutaneous" color={theme.text} />
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

                {/* Supervising Vet Info */}
                <View style={[styles.vetInfoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Ionicons name="medkit" size={20} color={theme.primary} />
                    <View style={styles.vetInfoText}>
                        <Text style={[styles.vetLabel, { color: theme.subtext }]}>{t('supervising_vet')}</Text>
                        <Text style={[styles.vetValue, { color: theme.text }]}>
                            {vetName ? `${vetName} (${vetId})` : (vetId ? `${t('vet_id')}: ${vetId}` : t('no_vet_assigned'))}
                        </Text>
                    </View>
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
        padding: 20,
        paddingTop: 50,
        paddingBottom: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    form: {
        flex: 1,
        padding: 20,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 20,
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
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
    vetInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        gap: 12,
    },
    vetInfoText: {
        flex: 1,
    },
    vetLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    vetValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 40,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    helperText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
});

export default AddTreatmentScreen;
