import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';
import { useSync } from '../contexts/SyncContext';

const OfflineBanner = () => {
    const { isConnected } = useNetwork();
    const { isSyncing, syncQueue } = useSync();

    if (isConnected && syncQueue.length === 0) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.banner, !isConnected ? styles.offline : styles.syncing]}>
                <Text style={styles.text}>
                    {!isConnected
                        ? 'You are offline. Changes will be saved locally.'
                        : isSyncing
                            ? 'Syncing data...'
                            : `${syncQueue.length} pending changes`
                    }
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
    },
    banner: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    offline: {
        backgroundColor: '#ef4444', // Red-500
    },
    syncing: {
        backgroundColor: '#f59e0b', // Amber-500
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default OfflineBanner;
