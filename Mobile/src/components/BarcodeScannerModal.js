import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = 250;

const BarcodeScannerModal = ({ visible, onClose, onScan }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible) {
            setScanned(false);
            if (!permission?.granted) {
                requestPermission();
            }
        }
    }, [visible, permission]);

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        // Add a small vibration or sound here if desired
        onScan(data);
        onClose();
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" transparent={false}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-off-outline" size={64} color="#6b7280" />
                    <Text style={styles.permissionText}>
                        We need your permission to show the camera
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_e", "upc_a"],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.overlayTop}>
                            <Text style={styles.scanText}>Scan Animal Tag</Text>
                        </View>
                        <View style={styles.overlayCenter}>
                            <View style={styles.overlaySide} />
                            <View style={styles.scanArea}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>
                            <View style={styles.overlaySide} />
                        </View>
                        <View style={styles.overlayBottom}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Ionicons name="close-circle" size={48} color="#fff" />
                                <Text style={styles.cancelText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f3f4f6',
    },
    permissionText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#374151',
        marginVertical: 20,
    },
    permissionButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    permissionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    closeButton: {
        padding: 12,
    },
    closeButtonText: {
        color: '#6b7280',
        fontSize: 16,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 20,
    },
    overlayCenter: {
        flexDirection: 'row',
        height: SCAN_AREA_SIZE,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    scanArea: {
        width: SCAN_AREA_SIZE,
        height: SCAN_AREA_SIZE,
        position: 'relative',
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    cancelButton: {
        alignItems: 'center',
    },
    cancelText: {
        color: '#fff',
        marginTop: 8,
        fontSize: 16,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#10b981',
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
});

export default BarcodeScannerModal;
