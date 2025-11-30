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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAnimal } from '../../services/animalService';

const AddAnimalScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tagId: '',
        name: '',
        species: 'Cattle',
        breed: '',
        gender: 'Male',
        ageYears: '',
        ageMonths: '',
    });

    const species = ['Cattle', 'Goat', 'Sheep', 'Pig', 'Poultry', 'Buffalo'];
    const genders = ['Male', 'Female'];

    const handleSubmit = async () => {
        if (!formData.tagId || !formData.species) {
            Alert.alert('Error', 'Please fill in Tag ID and Species');
            return;
        }

        setLoading(true);
        try {
            const animalData = {
                ...formData,
                ageYears: parseInt(formData.ageYears) || 0,
                ageMonths: parseInt(formData.ageMonths) || 0,
            };

            await createAnimal(animalData);
            Alert.alert('Success', 'Animal added successfully!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to add animal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Add New Animal</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.form}>
                <Text style={styles.label}>Tag ID *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter 12-digit tag ID"
                    value={formData.tagId}
                    onChangeText={(text) => setFormData({ ...formData, tagId: text })}
                    maxLength={12}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Animal Name (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                />

                <Text style={styles.label}>Species *</Text>
                <View style={styles.chipContainer}>
                    {species.map((s) => (
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

                <Text style={styles.label}>Breed (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter breed"
                    value={formData.breed}
                    onChangeText={(text) => setFormData({ ...formData, breed: text })}
                />

                <Text style={styles.label}>Gender *</Text>
                <View style={styles.chipContainer}>
                    {genders.map((g) => (
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

                <View style={styles.row}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Age (Years)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            value={formData.ageYears}
                            onChangeText={(text) =>
                                setFormData({ ...formData, ageYears: text })
                            }
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Age (Months)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            value={formData.ageMonths}
                            onChangeText={(text) =>
                                setFormData({ ...formData, ageMonths: text })
                            }
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Add Animal</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    form: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
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
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
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
        fontSize: 14,
        color: '#6b7280',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 40,
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default AddAnimalScreen;
