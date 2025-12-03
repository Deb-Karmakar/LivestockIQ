// Mobile/src/screens/vet/VetSettingsScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const VetSettingsScreen = () => {
    const { user, logout } = useAuth();
    const { t, language, changeLanguage } = useLanguage();
    const { theme, themeMode, changeTheme } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showThemeModal, setShowThemeModal] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            t('logout'),
            t('delete_animal_confirm').replace('delete this animal', 'logout'), // Reusing confirm message structure
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('logout'),
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const SettingsItem = ({ icon, title, subtitle, onPress, color, rightElement }) => (
        <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: theme.border }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.settingsContent}>
                <Text style={[styles.settingsTitle, { color: theme.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingsSubtitle, { color: theme.subtext }]}>{subtitle}</Text>}
            </View>
            {rightElement || <Ionicons name="chevron-forward" size={20} color={theme.subtext} />}
        </TouchableOpacity>
    );

    const ThemeModal = () => (
        <Modal
            visible={showThemeModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowThemeModal(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowThemeModal(false)}
            >
                <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{t('theme')}</Text>

                    {['light', 'dark', 'colorBlind'].map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.themeOption,
                                themeMode === mode && { backgroundColor: theme.primary + '20' }
                            ]}
                            onPress={() => {
                                changeTheme(mode);
                                setShowThemeModal(false);
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={[styles.themePreview, { backgroundColor: mode === 'dark' ? '#111827' : mode === 'colorBlind' ? '#ffffff' : '#f3f4f6', borderColor: theme.border, borderWidth: 1 }]} />
                                <Text style={[
                                    styles.themeText,
                                    { color: theme.text },
                                    themeMode === mode && { color: theme.primary, fontWeight: 'bold' }
                                ]}>
                                    {t(mode === 'colorBlind' ? 'color_blind' : mode)}
                                </Text>
                            </View>
                            {themeMode === mode && (
                                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.profileSection}>
                    <View style={[styles.avatar, { backgroundColor: theme.background }]}>
                        <Ionicons name="medical" size={40} color={theme.primary} />
                    </View>
                    <Text style={[styles.name, { color: theme.text }]}>Dr. {user?.fullName || 'Veterinarian'}</Text>
                    <Text style={[styles.email, { color: theme.subtext }]}>{user?.email}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>{t('account')}</Text>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <SettingsItem
                        icon="person-circle-outline"
                        title={t('edit_profile')}
                        subtitle={t('update_profile_desc')}
                        color={theme.primary}
                        onPress={() => { }}
                    />
                    <SettingsItem
                        icon="lock-closed-outline"
                        title={t('change_password')}
                        subtitle={t('update_password_desc')}
                        color={theme.info}
                        onPress={() => { }}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>{t('settings')}</Text>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <SettingsItem
                        icon="color-palette-outline"
                        title={t('theme')}
                        subtitle={t(themeMode === 'colorBlind' ? 'color_blind' : themeMode)}
                        color="#ec4899"
                        onPress={() => setShowThemeModal(true)}
                    />
                    <SettingsItem
                        icon="notifications-outline"
                        title={t('notifications')}
                        subtitle={t('manage_notifications')}
                        color={theme.warning}
                        rightElement={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#767577', true: theme.primary }}
                                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
                            />
                        }
                    />
                    <SettingsItem
                        icon="language-outline"
                        title={t('language')}
                        subtitle={language === 'en' ? 'English' : 'हिंदी'}
                        color="#8b5cf6"
                        onPress={() => changeLanguage(language === 'en' ? 'hi' : 'en')}
                        rightElement={
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 16 }}>{language === 'en' ? '🇺🇸' : '🇮🇳'}</Text>
                                <Ionicons name="swap-horizontal" size={20} color={theme.subtext} />
                            </View>
                        }
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>{t('support')}</Text>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <SettingsItem
                        icon="help-circle-outline"
                        title={t('help_center')}
                        subtitle={t('get_help')}
                        color="#06b6d4"
                        onPress={() => { }}
                    />
                    <SettingsItem
                        icon="document-text-outline"
                        title={t('terms_privacy')}
                        subtitle={t('read_policies')}
                        color={theme.subtext}
                        onPress={() => { }}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: theme.card }]}
                onPress={handleLogout}
            >
                <Ionicons name="log-out-outline" size={20} color={theme.error} />
                <Text style={[styles.logoutText, { color: theme.error }]}>{t('logout')}</Text>
            </TouchableOpacity>

            <Text style={[styles.version, { color: theme.subtext }]}>{t('version')} 1.0.0</Text>

            <ThemeModal />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomWidth: 1,
    },
    profileSection: {
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        marginBottom: 2,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingsContent: {
        flex: 1,
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingsSubtitle: {
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        marginBottom: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    themePreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    themeText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default VetSettingsScreen;
