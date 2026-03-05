import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getPackages, createPackage, updatePackage, deletePackage, uploadImage } from '../services/api';
import { Plus, Edit3, Trash2, X, Check, Package, Clock, DollarSign, AlignLeft, ChevronLeft, Image as ImageIcon } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function ManagePackagesScreen() {
    const { user } = useAuth();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    if (user?.role !== 'admin') {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: COLORS.text, fontSize: 18 }}>Access Denied</Text>
            </View>
        );
    }
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', description: '', duration: '', image: '' });
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const { data } = await getPackages();
            setPackages(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) {
            Alert.alert('Error', 'Name and price are required');
            return;
        }

        try {
            if (editingPackage) {
                await updatePackage(editingPackage.id, formData);
                Alert.alert('Success', 'Package updated');
            } else {
                await createPackage(formData);
                Alert.alert('Success', 'Package created');
            }
            setModalVisible(false);
            fetchPackages();
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save package: ' + (error.response?.data?.error || error.message));
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadImageToBackend(result.assets[0]);
        }
    };

    const uploadImageToBackend = async (asset) => {
        setUploadingImage(true);
        try {
            const formDataToUpload = new FormData();
            formDataToUpload.append('image', {
                uri: asset.uri,
                type: 'image/jpeg',
                name: 'upload.jpg',
            });
            const { data } = await uploadImage(formDataToUpload);
            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (error) {
            console.error('Image upload failed:', error);
            Alert.alert('Upload Error', 'Failed to upload the image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Are you sure you want to delete this package?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deletePackage(id);
                        fetchPackages();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const openModal = (pkg = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({ name: pkg.name, price: pkg.price.toString(), description: pkg.description, duration: pkg.duration, image: pkg.image || '' });
        } else {
            setEditingPackage(null);
            setFormData({ name: '', price: '', description: '', duration: '', image: '' });
        }
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardIconBox}>
                <Package color={COLORS.primary} size={24} />
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>${item.price}</Text>
                    {item.duration && (
                        <View style={styles.durationTag}>
                            <Clock color={COLORS.textSecondary} size={12} />
                            <Text style={styles.durationText}>{item.duration}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => openModal(item)} style={[styles.actionBtn, styles.editBtn]}>
                    <Edit3 color={COLORS.primary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, styles.deleteBtn]}>
                    <Trash2 color="#F44336" size={18} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Services</Text>
                        <Text style={styles.subtitle}>Package Management</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                        <Plus color={COLORS.background} size={24} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={packages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Package color={COLORS.textSecondary} size={48} style={{ opacity: 0.3 }} />
                            <Text style={styles.emptyText}>No services added yet.</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{editingPackage ? 'Edit Service' : 'New Service'}</Text>
                                <Text style={styles.modalSubtitle}>Fill in the details below</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                                <X color={COLORS.text} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Package Image</Text>
                                <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage} disabled={uploadingImage}>
                                    {uploadingImage ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : formData.image ? (
                                        <Image source={{ uri: formData.image }} style={styles.uploadedImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <ImageIcon color={COLORS.textSecondary} size={28} />
                                            <Text style={styles.imagePlaceholderText}>Tap to select an image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Name</Text>
                                <View style={styles.inputWrapper}>
                                    <Package color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Wedding Package"
                                        placeholderTextColor="#666"
                                        value={formData.name}
                                        onChangeText={text => setFormData({ ...formData, name: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Price ($)</Text>
                                <View style={styles.inputWrapper}>
                                    <DollarSign color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        placeholderTextColor="#666"
                                        value={formData.price}
                                        onChangeText={text => setFormData({ ...formData, price: text })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Duration</Text>
                                <View style={styles.inputWrapper}>
                                    <Clock color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 45 min"
                                        placeholderTextColor="#666"
                                        value={formData.duration}
                                        onChangeText={text => setFormData({ ...formData, duration: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
                                    <AlignLeft color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                        placeholder="Describe the service..."
                                        placeholderTextColor="#666"
                                        value={formData.description}
                                        onChangeText={text => setFormData({ ...formData, description: text })}
                                        multiline
                                    />
                                </View>
                            </View>

                            <View style={styles.modalFooter}>
                                <CustomButton title={editingPackage ? "Update Service" : "Create Service"} onPress={handleSave} />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 30,
    },
    headerGradient: {
        paddingBottom: 0,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    addBtn: {
        backgroundColor: COLORS.primary,
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    list: {
        padding: 24,
        paddingTop: 0,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    info: {
        flex: 1,
    },
    name: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: 'bold',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    price: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    durationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    durationText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    desc: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 6,
        lineHeight: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 12,
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    editBtn: {
        borderColor: COLORS.primary + '40',
        backgroundColor: COLORS.primary + '10',
    },
    deleteBtn: {
        borderColor: '#F4433640',
        backgroundColor: '#F4433610',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: '#333',
        borderBottomWidth: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#444',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        color: COLORS.text,
        fontSize: 16,
    },
    imageUploadBox: {
        width: '100%',
        height: 150,
        backgroundColor: COLORS.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#444',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
        opacity: 0.6,
    },
    imagePlaceholderText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 8,
    },
    modalFooter: {
        marginTop: 10,
        marginBottom: 30,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});
