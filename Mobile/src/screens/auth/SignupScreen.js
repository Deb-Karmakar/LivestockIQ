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
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    SafeAreaView,
    TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import districtsData from '../../data/districts';

const SignupScreen = ({ navigation }) => {
    const { register, registerVet } = useAuth();
    const { t } = useLanguage();
    const [role, setRole] = useState(null); // 'farmer' or 'veterinarian'
    const [loading, setLoading] = useState(false);

    // Common Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Farmer Specific
    const [farmName, setFarmName] = useState('');
    const [vetId, setVetId] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');

    // Vet Specific
    const [licenseNumber, setLicenseNumber] = useState('');
    const [university, setUniversity] = useState('');
    const [degree, setDegree] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState(new Date());
    const [showDobPicker, setShowDobPicker] = useState(false);

    // Location (Mocked for simplicity, can use expo-location)
    const [location, setLocation] = useState(null);

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(null); // 'state' | 'district' | 'vet_state' | 'vet_district'

    // Checkbox State for Vet
    const [infoAccurate, setInfoAccurate] = useState(false);
    const [dataConsent, setDataConsent] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission to access location was denied');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
                console.log('Location fetched:', location.coords);
            } catch (error) {
                console.error('Error fetching location:', error);
                // Fallback or alert
            }
        })();
    }, []);

    const openPicker = (type) => {
        setPickerType(type);
        setPickerVisible(true);
    };

    const handlePickerSelect = (item) => {
        if (pickerType === 'state') {
            setState(item);
            setDistrict(''); // Reset district
        } else if (pickerType === 'district') {
            setDistrict(item);
        } else if (pickerType === 'vet_state') {
            // Reusing state/district vars for vet if needed, but vet form uses 'state'/'district' vars?
            // Wait, Vet form in previous code didn't have state/district fields in the UI shown in previous turn?
            // Let's check the previous file content.
            // Vet form had: License, University, Degree, Specialization.
            // It did NOT have State/District in the UI, but the backend might need it for location.
            // The previous code had:
            // location: { ...location, state: 'Telangana', district: 'Hyderabad' }
            // So I should probably add State/District to Vet form too if we want them to select it.
            // For now, I'll stick to Farmer form which DEFINITELY has it.
        }
        setPickerVisible(false);
    };

    const getPickerData = () => {
        if (pickerType === 'state') {
            return Object.keys(districtsData).sort();
        } else if (pickerType === 'district') {
            return state ? (districtsData[state] || []).sort() : [];
        }
        return [];
    };

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword || !fullName || !phoneNumber) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            if (role === 'farmer') {
                if (!farmName || !vetId || !state || !district) {
                    Alert.alert('Error', 'Please fill in all farm details');
                    setLoading(false);
                    return;
                }
                await register({
                    farmOwner: fullName,
                    email,
                    password,
                    phoneNumber,
                    farmName,
                    vetId,
                    state,
                    district,
                    location: {
                        ...location,
                        state,
                        district
                    }
                });
            } else {

                if (!licenseNumber || !state || !district) {
                    Alert.alert('Error', 'Please fill in all professional and location details');
                    setLoading(false);
                    return;
                }
                if (!infoAccurate || !dataConsent) {
                    Alert.alert('Error', 'Please accept the terms and conditions');
                    setLoading(false);
                    return;
                }
                await registerVet({
                    fullName,
                    email,
                    password,
                    phoneNumber,
                    licenseNumber,
                    university,
                    degree,
                    specialization,
                    gender,
                    dob,
                    location: {
                        ...location,
                        state,
                        district
                    }
                });
            }
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            console.error('Signup error:', error);
            Alert.alert('Signup Failed', error.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const renderRoleSelection = () => (
        <View style={styles.roleContainer}>
            <Text style={styles.headerTitle}>{t('join_livestockiq')}</Text>
            <Text style={styles.headerSubtitle}>{t('select_role')}</Text>

            <TouchableOpacity style={styles.roleCard} onPress={() => setRole('farmer')}>
                <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="leaf" size={32} color="#16a34a" />
                </View>
                <View>
                    <Text style={styles.roleTitle}>{t('iam_farmer')}</Text>
                    <Text style={styles.roleDesc}>{t('farmer_desc')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9ca3af" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleCard} onPress={() => setRole('veterinarian')}>
                <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                    <Ionicons name="medkit" size={32} color="#2563eb" />
                </View>
                <View>
                    <Text style={styles.roleTitle}>{t('iam_vet')}</Text>
                    <Text style={styles.roleDesc}>{t('vet_desc')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9ca3af" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>{t('back_to_login')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderForm = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setRole(null)} style={styles.backIcon}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.formTitle}>{role === 'farmer' ? t('farmer_registration') : t('vet_registration')}</Text>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t('account_details')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('full_name')}
                    placeholderTextColor="#9ca3af"
                    value={fullName}
                    onChangeText={setFullName}
                />
                <TextInput
                    style={styles.input}
                    placeholder={t('email')}
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder={t('phone_number')}
                    placeholderTextColor="#9ca3af"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder={t('password')}
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder={t('confirm_password')}
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                />
            </View>

            {role === 'farmer' ? (
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>{t('farm_details')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('farm_name')}
                        placeholderTextColor="#9ca3af"
                        value={farmName}
                        onChangeText={setFarmName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={t('vet_id')}
                        placeholderTextColor="#9ca3af"
                        value={vetId}
                        onChangeText={setVetId}
                    />
                    <Text style={styles.helperText}>{t('vet_id_helper')}</Text>


                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => openPicker('state')}
                    >
                        <Text style={[styles.pickerButtonText, !state && styles.placeholderText]}>
                            {state || "Select State"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pickerButton, !state && styles.disabledPicker]}
                        onPress={() => state && openPicker('district')}
                        disabled={!state}
                    >
                        <Text style={[styles.pickerButtonText, !district && styles.placeholderText]}>
                            {district || "Select District"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>{t('professional_details')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('license_number')}
                        placeholderTextColor="#9ca3af"
                        value={licenseNumber}
                        onChangeText={setLicenseNumber}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={t('university')}
                        placeholderTextColor="#9ca3af"
                        value={university}
                        onChangeText={setUniversity}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={t('degree')}
                        placeholderTextColor="#9ca3af"
                        value={degree}
                        onChangeText={setDegree}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={t('specialization')}
                        placeholderTextColor="#9ca3af"
                        value={specialization}
                        onChangeText={setSpecialization}
                    />
                    <TouchableOpacity onPress={() => setShowDobPicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateButtonText}>{t('dob')}: {dob.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {showDobPicker && (
                        <DateTimePicker
                            value={dob}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDobPicker(Platform.OS === 'ios');
                                if (selectedDate) setDob(selectedDate);
                            }}
                        />
                    )}
                    {/* State and District for Vet */}
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => openPicker('state')}
                    >
                        <Text style={[styles.pickerButtonText, !state && styles.placeholderText]}>
                            {state || "Select State"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pickerButton, !state && styles.disabledPicker]}
                        onPress={() => state && openPicker('district')}
                        disabled={!state}
                    >
                        <Text style={[styles.pickerButtonText, !district && styles.placeholderText]}>
                            {district || "Select District"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    {/* Consent Checkboxes */}
                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setInfoAccurate(!infoAccurate)}
                        >
                            <View style={[styles.checkbox, infoAccurate && styles.checkboxChecked]}>
                                {infoAccurate && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                {t('confirm_accurate')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setDataConsent(!dataConsent)}
                        >
                            <View style={[styles.checkbox, dataConsent && styles.checkboxChecked]}>
                                {dataConsent && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                {t('consent_share')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )
            }

            <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('create_account')}</Text>}
            </TouchableOpacity>

            {/* Picker Modal */}
            <Modal
                visible={pickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setPickerVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        Select {pickerType === 'state' ? 'State' : 'District'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                        <Ionicons name="close" size={24} color="#1f2937" />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={getPickerData()}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.modalItem}
                                            onPress={() => handlePickerSelect(item)}
                                        >
                                            <Text style={styles.modalItemText}>{item}</Text>
                                            {(pickerType === 'state' ? state === item : district === item) && (
                                                <Ionicons name="checkmark" size={20} color="#10b981" />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ScrollView >
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            {!role ? renderRoleSelection() : renderForm()}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    roleContainer: { flex: 1, padding: 20, justifyContent: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
    headerSubtitle: { fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    iconContainer: { padding: 12, borderRadius: 12, marginRight: 16 },
    roleTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    roleDesc: { fontSize: 14, color: '#6b7280' },
    backButton: { marginTop: 20, padding: 16, alignItems: 'center' },
    backButtonText: { color: '#6b7280', fontSize: 16 },

    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 40 },
    backIcon: { padding: 8, marginRight: 8 },
    formTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    formSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 16 },
    input: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 16
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingRight: 16
    },
    passwordInput: { flex: 1, padding: 16, fontSize: 16 },
    helperText: { fontSize: 12, color: '#6b7280', marginBottom: 12, marginTop: -8, marginLeft: 4 },
    dateButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    dateButtonText: { fontSize: 16, color: '#1f2937' },
    submitButton: {
        backgroundColor: '#10b981',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8
    },
    buttonDisabled: { backgroundColor: '#9ca3af' },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    // Picker Styles
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    disabledPicker: {
        backgroundColor: '#f3f4f6',
        borderColor: '#e5e7eb',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#1f2937',
    },
    placeholderText: {
        color: '#9ca3af',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalItemText: {
        fontSize: 16,
        color: '#374151',
    },
    modalItemText: {
        fontSize: 16,
        color: '#374151',
    },

    // Checkbox Styles
    checkboxContainer: {
        marginTop: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#10b981',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#10b981',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
});

export default SignupScreen;
