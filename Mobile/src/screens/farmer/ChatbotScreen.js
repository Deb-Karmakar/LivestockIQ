// Mobile/src/screens/farmer/ChatbotScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Modal,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { sendChatMessage, synthesizeSpeech, transcribeSpeech } from '../../services/aiService';

const CHAT_STORAGE_KEY = '@livestockiq_chat_history';

// Simple markdown-like text formatter component
const FormattedText = ({ content, theme }) => {
    const lines = content.split('\n');

    return (
        <View>
            {lines.map((line, index) => {
                // Headers
                if (line.startsWith('### ')) {
                    return (
                        <Text key={index} style={{ color: theme.text, fontSize: 15, fontWeight: '600', marginTop: 8, marginBottom: 4 }}>
                            {line.replace('### ', '')}
                        </Text>
                    );
                }
                if (line.startsWith('## ')) {
                    return (
                        <Text key={index} style={{ color: theme.text, fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 4 }}>
                            {line.replace('## ', '')}
                        </Text>
                    );
                }
                if (line.startsWith('# ')) {
                    return (
                        <Text key={index} style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 6 }}>
                            {line.replace('# ', '')}
                        </Text>
                    );
                }

                // Bullet points
                if (line.match(/^[\-\*•]\s/)) {
                    const bulletContent = line.replace(/^[\-\*•]\s/, '');
                    return (
                        <View key={index} style={{ flexDirection: 'row', marginVertical: 2, paddingLeft: 4 }}>
                            <Text style={{ color: theme.primary, marginRight: 8 }}>•</Text>
                            <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22, flex: 1 }}>
                                {formatInlineStyles(bulletContent, theme)}
                            </Text>
                        </View>
                    );
                }

                // Numbered lists
                if (line.match(/^\d+\.\s/)) {
                    const match = line.match(/^(\d+)\.\s(.*)$/);
                    if (match) {
                        return (
                            <View key={index} style={{ flexDirection: 'row', marginVertical: 2, paddingLeft: 4 }}>
                                <Text style={{ color: theme.primary, marginRight: 8, minWidth: 20 }}>{match[1]}.</Text>
                                <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22, flex: 1 }}>
                                    {formatInlineStyles(match[2], theme)}
                                </Text>
                            </View>
                        );
                    }
                }

                // Empty lines - add spacing
                if (line.trim() === '') {
                    return <View key={index} style={{ height: 8 }} />;
                }

                // Regular text with inline formatting
                return (
                    <Text key={index} style={{ color: theme.text, fontSize: 15, lineHeight: 22, marginVertical: 2 }}>
                        {formatInlineStyles(line, theme)}
                    </Text>
                );
            })}
        </View>
    );
};

// Helper to format inline bold and italic
const formatInlineStyles = (text, theme) => {
    // Simple implementation - just return text for now
    // Bold: **text**
    // Italic: *text*
    const parts = [];
    let remaining = text;
    let key = 0;

    // Process bold first (**text**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<Text key={key++}>{text.substring(lastIndex, match.index)}</Text>);
        }
        parts.push(<Text key={key++} style={{ fontWeight: 'bold' }}>{match[1]}</Text>);
        lastIndex = match.index + match[0].length;
    }

    if (parts.length > 0) {
        if (lastIndex < text.length) {
            parts.push(<Text key={key++}>{text.substring(lastIndex)}</Text>);
        }
        return parts;
    }

    return text;
};

const ChatbotScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const { isConnected } = useNetwork();

    // Chat state
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [voiceLang, setVoiceLang] = useState('hi'); // Voice input language toggle

    // History state
    const [chatHistory, setChatHistory] = useState([]); // List of all chats
    const [currentChatId, setCurrentChatId] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Keyboard state
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const scrollViewRef = useRef();
    const inputRef = useRef();
    const recordingRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Load chat history on mount
    useEffect(() => {
        loadChatHistory();
    }, []);

    // Keyboard listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    const loadChatHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
            if (stored) {
                const history = JSON.parse(stored);
                setChatHistory(history);
                // Load most recent chat or create new
                if (history.length > 0) {
                    const recent = history[0];
                    setCurrentChatId(recent.id);
                    setMessages(recent.messages);
                } else {
                    createNewChat();
                }
            } else {
                createNewChat();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            createNewChat();
        }
    };

    const saveChatHistory = async (updatedHistory) => {
        try {
            await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    };

    const createNewChat = () => {
        const welcomeMsg = language === 'hi'
            ? 'नमस्ते! मैं LivestockIQ AI सहायक हूं। मैं आपकी पशुपालन से जुड़ी समस्याओं में मदद कर सकता हूं।'
            : 'Hello! I am the LivestockIQ AI Assistant. How can I help you today?';

        const newChat = {
            id: Date.now().toString(),
            title: language === 'hi' ? 'नई बातचीत' : 'New Chat',
            createdAt: new Date().toISOString(),
            messages: [{
                id: 'welcome',
                role: 'assistant',
                content: welcomeMsg,
                timestamp: new Date().toISOString(),
            }]
        };

        setCurrentChatId(newChat.id);
        setMessages(newChat.messages);

        const updatedHistory = [newChat, ...chatHistory];
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory);
        setShowHistoryModal(false);
    };

    const switchToChat = (chat) => {
        setCurrentChatId(chat.id);
        setMessages(chat.messages);
        setShowHistoryModal(false);
    };

    const deleteChat = (chatId) => {
        Alert.alert(
            language === 'hi' ? 'चैट हटाएं?' : 'Delete Chat?',
            language === 'hi' ? 'यह चैट हटा दी जाएगी' : 'This chat will be deleted',
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: () => {
                        const updatedHistory = chatHistory.filter(c => c.id !== chatId);
                        setChatHistory(updatedHistory);
                        saveChatHistory(updatedHistory);

                        if (chatId === currentChatId) {
                            if (updatedHistory.length > 0) {
                                switchToChat(updatedHistory[0]);
                            } else {
                                createNewChat();
                            }
                        }
                    }
                }
            ]
        );
    };

    const updateCurrentChat = (newMessages) => {
        const updatedHistory = chatHistory.map(chat => {
            if (chat.id === currentChatId) {
                // Update title based on first user message
                const firstUserMsg = newMessages.find(m => m.role === 'user');
                const title = firstUserMsg
                    ? firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
                    : chat.title;
                return { ...chat, messages: newMessages, title };
            }
            return chat;
        });
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory);
    };

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        if (!isConnected) {
            Alert.alert(
                t('error'),
                language === 'hi'
                    ? 'इंटरनेट कनेक्शन आवश्यक है'
                    : 'Internet connection required'
            );
            return;
        }

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date().toISOString(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputText('');
        setIsLoading(true);
        scrollToBottom();
        Keyboard.dismiss();

        try {
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const result = await sendChatMessage(userMessage.content, language, history);

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.response,
                timestamp: new Date().toISOString(),
            };

            const finalMessages = [...newMessages, assistantMessage];
            setMessages(finalMessages);
            updateCurrentChat(finalMessages);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: language === 'hi'
                    ? 'क्षमा करें, कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।'
                    : 'Sorry, something went wrong. Please try again.',
                timestamp: new Date().toISOString(),
                isError: true,
            };
            const finalMessages = [...newMessages, errorMsg];
            setMessages(finalMessages);
            updateCurrentChat(finalMessages);
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    // Audio player reference for cloud TTS
    const soundRef = useRef(null);

    const speakMessage = async (text) => {
        if (isSpeaking) {
            // Stop current playback
            if (soundRef.current) {
                try {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                } catch (e) { }
                soundRef.current = null;
            }
            Speech.stop();
            setIsSpeaking(false);
            return;
        }

        setIsSpeaking(true);

        // Try Google Cloud TTS first (better Hindi quality)
        if (isConnected) {
            try {
                console.log('Trying Google TTS...');
                const result = await synthesizeSpeech(text, language);

                if (result?.audio && result.audio.length > 100) {
                    console.log('Got audio from Google TTS, length:', result.audio.length);

                    // Convert base64 to audio URI and play
                    const audioUri = `data:audio/mpeg;base64,${result.audio}`;

                    const { sound } = await Audio.Sound.createAsync(
                        { uri: audioUri },
                        { shouldPlay: true }
                    );
                    soundRef.current = sound;

                    // Set up completion handler
                    sound.setOnPlaybackStatusUpdate((status) => {
                        if (status.didJustFinish) {
                            setIsSpeaking(false);
                            sound.unloadAsync();
                            soundRef.current = null;
                        }
                    });

                    console.log('Playing Google TTS audio...');
                    return; // Success with cloud TTS
                }
            } catch (cloudError) {
                console.warn('Cloud TTS failed:', cloudError.message);
            }
        }

        // Fallback to device TTS
        console.log('Using device TTS as fallback...');
        try {
            await Speech.speak(text, {
                language: language === 'hi' ? 'hi-IN' : 'en-US',
                pitch: 1.0,
                rate: language === 'hi' ? 0.9 : 0.95,
                onDone: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false),
                onError: (error) => {
                    console.error('Speech error:', error);
                    setIsSpeaking(false);
                },
            });
        } catch (error) {
            console.error('Speech error:', error);
            setIsSpeaking(false);
        }
    };

    // Start pulse animation when recording
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    // Voice input handler
    const handleVoiceInput = async () => {
        if (!isConnected) {
            Alert.alert(
                language === 'hi' ? 'त्रुटि' : 'Error',
                language === 'hi' ? 'इंटरनेट कनेक्शन आवश्यक है' : 'Internet connection required'
            );
            return;
        }

        if (isRecording) {
            // Stop recording
            try {
                console.log('Stopping recording...');
                await recordingRef.current?.stopAndUnloadAsync();
                const uri = recordingRef.current?.getURI();
                console.log('Recording URI:', uri);

                setIsRecording(false);
                setIsTranscribing(true);

                if (uri) {
                    // Read file as base64
                    const response = await fetch(uri);
                    const blob = await response.blob();

                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        try {
                            const base64Audio = reader.result.split(',')[1];
                            console.log('Sending audio for transcription, size:', base64Audio.length, 'lang:', voiceLang);

                            // Use selected voice language
                            const result = await transcribeSpeech(base64Audio, voiceLang);
                            console.log('Transcription result:', result);

                            if (result?.text) {
                                setInputText(prev => prev + (prev ? ' ' : '') + result.text);
                            }
                        } catch (err) {
                            console.error('Transcription error:', err);
                            Alert.alert(
                                language === 'hi' ? 'त्रुटि' : 'Error',
                                language === 'hi' ? 'आवाज पहचानने में समस्या हुई' : 'Failed to recognize speech'
                            );
                        } finally {
                            setIsTranscribing(false);
                        }
                    };
                    reader.readAsDataURL(blob);
                } else {
                    setIsTranscribing(false);
                }

                recordingRef.current = null;
            } catch (error) {
                console.error('Stop recording error:', error);
                setIsRecording(false);
                setIsTranscribing(false);
            }
        } else {
            // Start recording
            try {
                console.log('Requesting audio permissions...');
                const permission = await Audio.requestPermissionsAsync();

                if (permission.status !== 'granted') {
                    Alert.alert(
                        language === 'hi' ? 'अनुमति आवश्यक' : 'Permission Required',
                        language === 'hi' ? 'माइक्रोफ़ोन की अनुमति दें' : 'Please grant microphone permission'
                    );
                    return;
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                console.log('Starting recording...');
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );

                recordingRef.current = recording;
                setIsRecording(true);

            } catch (error) {
                console.error('Start recording error:', error);
                Alert.alert(
                    language === 'hi' ? 'त्रुटि' : 'Error',
                    language === 'hi' ? 'रिकॉर्डिंग शुरू नहीं हो सकी' : 'Could not start recording'
                );
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return language === 'hi' ? 'आज' : 'Today';
        if (diffDays === 1) return language === 'hi' ? 'कल' : 'Yesterday';
        if (diffDays < 7) return language === 'hi' ? `${diffDays} दिन पहले` : `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const renderMessage = (message) => {
        const isUser = message.role === 'user';

        return (
            <View
                key={message.id}
                style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                    isUser
                        ? { backgroundColor: theme.primary }
                        : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
                    message.isError && { backgroundColor: `${theme.error}20`, borderColor: theme.error },
                ]}
            >
                {!isUser && (
                    <View style={styles.assistantHeader}>
                        <Ionicons name="sparkles" size={14} color={theme.primary} />
                        <Text style={[styles.assistantLabel, { color: theme.primary }]}>
                            AI {language === 'hi' ? 'सहायक' : 'Assistant'}
                        </Text>
                    </View>
                )}
                {isUser ? (
                    <Text style={[styles.messageText, { color: '#fff' }]}>
                        {message.content}
                    </Text>
                ) : (
                    <FormattedText content={message.content} theme={theme} />
                )}

                {!isUser && !message.isError && (
                    <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => speakMessage(message.content)}
                    >
                        <Ionicons
                            name={isSpeaking ? "stop-circle" : "volume-high"}
                            size={18}
                            color={theme.primary}
                        />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.historyItem,
                { backgroundColor: theme.card, borderColor: theme.border },
                item.id === currentChatId && { borderColor: theme.primary, borderWidth: 2 }
            ]}
            onPress={() => switchToChat(item)}
        >
            <View style={styles.historyItemContent}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
                <View style={styles.historyItemText}>
                    <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={[styles.historyDate, { color: theme.subtext }]}>
                        {formatDate(item.createdAt)} • {item.messages.length} {language === 'hi' ? 'संदेश' : 'messages'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteChat(item.id)}
            >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerCenter}
                    onPress={() => setShowHistoryModal(true)}
                >
                    <View style={[styles.headerIcon, { backgroundColor: `${theme.primary}20` }]}>
                        <Ionicons name="chatbubbles" size={20} color={theme.primary} />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>
                            {language === 'hi' ? 'AI सहायक' : 'AI Assistant'}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
                            {language === 'hi' ? 'इतिहास देखने के लिए टैप करें' : 'Tap to view history'}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={createNewChat} style={styles.newChatButton}>
                    <Ionicons name="add-circle-outline" size={26} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {/* Offline Banner */}
            {!isConnected && (
                <View style={[styles.offlineBanner, { backgroundColor: theme.warning }]}>
                    <Ionicons name="cloud-offline" size={16} color="#fff" />
                    <Text style={styles.offlineText}>
                        {language === 'hi' ? 'ऑफ़लाइन - इंटरनेट आवश्यक' : 'Offline - Internet required'}
                    </Text>
                </View>
            )}

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={scrollToBottom}
                keyboardShouldPersistTaps="handled"
            >
                {messages.map(renderMessage)}

                {isLoading && (
                    <View style={[styles.loadingBubble, { backgroundColor: theme.card }]}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.subtext }]}>
                            {language === 'hi' ? 'सोच रहा हूं...' : 'Thinking...'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: theme.card,
                        borderTopColor: theme.border,
                    }
                ]}
            >
                {/* Voice Language Toggle */}
                <TouchableOpacity
                    style={[
                        styles.langToggle,
                        { backgroundColor: voiceLang === 'hi' ? '#FF9800' : '#2196F3' }
                    ]}
                    onPress={() => setVoiceLang(voiceLang === 'hi' ? 'en' : 'hi')}
                    disabled={isRecording}
                >
                    <Text style={styles.langToggleText}>
                        {voiceLang === 'hi' ? 'हि' : 'EN'}
                    </Text>
                </TouchableOpacity>

                {/* Microphone Button */}
                <TouchableOpacity
                    style={[
                        styles.micButton,
                        { backgroundColor: isRecording ? theme.error : theme.background },
                    ]}
                    onPress={handleVoiceInput}
                    disabled={isLoading || isTranscribing}
                >
                    {isTranscribing ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
                            <Ionicons
                                name={isRecording ? 'stop' : 'mic'}
                                size={22}
                                color={isRecording ? '#fff' : theme.primary}
                            />
                        </Animated.View>
                    )}
                </TouchableOpacity>

                <TextInput
                    ref={inputRef}
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder={isRecording
                        ? (language === 'hi' ? '🎤 बोलें...' : '🎤 Speak...')
                        : (language === 'hi' ? 'अपना सवाल लिखें...' : 'Type your message...')}
                    placeholderTextColor={isRecording ? theme.error : theme.subtext}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                    editable={!isLoading && !isRecording}
                    onFocus={scrollToBottom}
                />

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        { backgroundColor: inputText.trim() ? theme.primary : theme.border }
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isLoading}
                >
                    <Ionicons
                        name="send"
                        size={20}
                        color={inputText.trim() ? '#fff' : theme.subtext}
                    />
                </TouchableOpacity>
            </View>

            {/* History Modal */}
            <Modal
                visible={showHistoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {language === 'hi' ? 'चैट इतिहास' : 'Chat History'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.newChatRow, { backgroundColor: `${theme.primary}15` }]}
                            onPress={createNewChat}
                        >
                            <Ionicons name="add-circle" size={24} color={theme.primary} />
                            <Text style={[styles.newChatText, { color: theme.primary }]}>
                                {language === 'hi' ? 'नई बातचीत शुरू करें' : 'Start New Chat'}
                            </Text>
                        </TouchableOpacity>

                        <FlatList
                            data={chatHistory}
                            renderItem={renderHistoryItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.historyList}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: theme.subtext }]}>
                                    {language === 'hi' ? 'कोई चैट इतिहास नहीं' : 'No chat history'}
                                </Text>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 12,
    },
    newChatButton: {
        padding: 8,
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    offlineText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
    },
    messageBubble: {
        maxWidth: '85%',
        marginBottom: 12,
        padding: 14,
        borderRadius: 16,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    assistantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 4,
    },
    assistantLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    speakButton: {
        marginTop: 10,
        alignSelf: 'flex-start',
        padding: 6,
    },
    loadingBubble: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        gap: 8,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    langToggle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    langToggleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '75%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    newChatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        gap: 12,
    },
    newChatText: {
        fontSize: 16,
        fontWeight: '600',
    },
    historyList: {
        padding: 16,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    historyItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    historyItemText: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    historyDate: {
        fontSize: 12,
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 15,
    },
});

export default ChatbotScreen;
