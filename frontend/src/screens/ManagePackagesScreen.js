import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getPackages, createPackage, updatePackage, deletePackage, uploadImage } from '../services/api';
import { Plus, Edit3, Trash2, X, Check, Package, Clock, DollarSign, AlignLeft, ChevronLeft, Image as ImageIcon } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/Button';
import * as ImagePicker from 'expo-image-picker';

export default function ManagePackagesScreen() {
    const insets = useSafeAreaInsets();
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
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredPackages = packages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                await uploadImageToBackend(result.assets[0]);
            }
        } catch (error) {
            console.error('Pick image error:', error);
            Alert.alert('Error', 'Failed to open image gallery.');
        }
    };

    const uploadImageToBackend = async (asset) => {
        setUploadingImage(true);
        try {
            const formDataToUpload = new FormData();
            const filename = asset.uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formDataToUpload.append('image', {
                uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                type: type,
                name: filename || 'upload.jpg',
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
            <View style={styles.cardContent}>
                <View style={styles.cardVisual}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.cardImg} />
                    ) : (
                        <View style={styles.cardIconBox}>
                            <Package color={COLORS.primary} size={28} />
                        </View>
                    )}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.cardImgOverlay}
                    >
                        <View style={styles.cardBadge}>
                            <Text style={styles.cardBadgeText}>${item.price}</Text>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        {item.duration && (
                            <View style={styles.metaItem}>
                                <Clock color={COLORS.textSecondary} size={12} />
                                <Text style={styles.metaText}>{item.duration}</Text>
                            </View>
                        )}
                        <View style={styles.metaItem}>
                            <DollarSign color={COLORS.primary} size={12} />
                            <Text style={[styles.metaText, { color: COLORS.primary, fontWeight: 'bold' }]}>PRO</Text>
                        </View>
                    </View>
                    <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

                    <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => openModal(item)} style={[styles.actionBtn, styles.editBtn]}>
                            <Edit3 color={COLORS.primary} size={16} />
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, styles.deleteBtn]}>
                            <Trash2 color="#F44336" size={16} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={[styles.headerGradient, { paddingTop: insets.top }]}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Services</Text>
                        <Text style={styles.subtitle}>{packages.length} Packages Available</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                        <Plus color="#000" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Package color={COLORS.textSecondary} size={20} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search services..."
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X color={COLORS.textSecondary} size={20} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredPackages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Package color={COLORS.textSecondary} size={48} style={{ opacity: 0.3 }} />
                            </View>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No results found for your search.' : 'No services added yet.'}
                            </Text>
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
                                <Text style={styles.inputLabel}>Visual Branding</Text>
                                <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage} disabled={uploadingImage}>
                                    {uploadingImage ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : formData.image ? (
                                        <Image source={{ uri: formData.image }} style={styles.uploadedImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <ImageIcon color={COLORS.textSecondary} size={28} />
                                            <Text style={styles.imagePlaceholderText}>Tap to select showcase image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 2 }]}>
                                    <Text style={styles.inputLabel}>Package Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. Wedding Package"
                                            placeholderTextColor="#666"
                                            value={formData.name}
                                            onChangeText={text => setFormData({ ...formData, name: text })}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.inputLabel}>Price</Text>
                                    <View style={styles.inputWrapper}>
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
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Expected Duration</Text>
                                <View style={styles.inputWrapper}>
                                    <Clock color={COLORS.textSecondary} size={18} style={styles.inputIcon} />
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
                                    <TextInput
                                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                        placeholder="Describe what's included in this service..."
                                        placeholderTextColor="#666"
                                        value={formData.description}
                                        onChangeText={text => setFormData({ ...formData, description: text })}
                                        multiline
                                    />
                                </View>
                            </View>

                            <View style={styles.modalFooter}>
                                <CustomButton
                                    title={editingPackage ? "Update Service" : "Create Service"}
                                    onPress={handleSave}
                                    loading={loading}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerGradient: {
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
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
        letterSpacing: 1,
        marginTop: 4,
    },
    addBtn: {
        backgroundColor: COLORS.primary,
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    searchContainer: {
        paddingHorizontal: 24,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 15,
        marginLeft: 12,
    },
    list: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    cardContent: {
        flexDirection: 'row',
    },
    cardVisual: {
        width: 120,
        height: '100%',
        backgroundColor: '#222',
        position: 'relative',
    },
    cardImg: {
        width: '100%',
        height: '100%',
    },
    cardImgOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        justifyContent: 'flex-end',
        padding: 8,
    },
    cardBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    cardBadgeText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardIconBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.5,
    },
    cardInfo: {
        flex: 1,
        padding: 16,
    },
    name: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 6,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    metaText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    desc: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 10,
        lineHeight: 18,
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    actionBtn: {
        paddingVertical: 8,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primary + '10',
    },
    editBtnText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    deleteBtn: {
        width: 40,
        borderColor: '#F4433630',
        backgroundColor: '#F4433610',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: '#333',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
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
    row: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    inputLabel: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        color: COLORS.text,
        fontSize: 16,
    },
    imageUploadBox: {
        width: '100%',
        height: 180,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
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
        marginTop: 20,
        marginBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 16,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        textAlign: 'center',
    },
});
