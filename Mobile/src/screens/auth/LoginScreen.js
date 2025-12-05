// Mobile/src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            console.log('Login attempt started');
            await login(email, password);
            console.log('Login successful');
            // Navigation will be handled automatically by AppNavigator
        } catch (error) {
            console.error('Login failed in screen:', error);
            const errorMessage = error.message || 'Invalid credentials. Please check your email and password.';
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Ionicons name="paw" size={60} color="#10b981" />
                    <Text style={styles.title}>LivestockIQ</Text>
                    <Text style={styles.subtitle}>{t('farm_management_system')}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('email')}
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('password')}
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>{t('login')}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signupLink}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={styles.signupText}>
                            {t('dont_have_account')} <Text style={styles.signupTextBold}>{t('signup')}</Text>
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 5,
    },
    form: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#f9fafb',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#1f2937',
    },
    button: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    infoText: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 20,
        fontSize: 14,
    },
    signupLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    signupText: {
        color: '#6b7280',
        fontSize: 16,
    },
    signupTextBold: {
        color: '#10b981',
        fontWeight: 'bold',
    },
});

export default LoginScreen;
