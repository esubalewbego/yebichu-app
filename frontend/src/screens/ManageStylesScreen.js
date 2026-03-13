import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getStyles, createStyle, updateStyle, deleteStyle, getCategories, uploadImage } from '../services/api';
import { Plus, Edit3, Trash2, X, Scissors, DollarSign, AlignLeft, ChevronLeft, Image as ImageIcon, Tag, Clock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/Button';
import * as ImagePicker from 'expo-image-picker';

export default function ManageStylesScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [stylesData, setStyles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStyle, setEditingStyle] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', category: '', description: '', image: '', duration: '' });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [stylesRes, catsRes] = await Promise.all([getStyles(), getCategories()]);
            setStyles(stylesRes.data);
            setCategories(catsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStyles = stylesData.filter(style =>
        style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.category) {
            Alert.alert('Error', 'Name, price, and category are required');
            return;
        }

        try {
            if (editingStyle) {
                await updateStyle(editingStyle.id, formData);
                Alert.alert('Success', 'Style updated');
            } else {
                await createStyle(formData);
                Alert.alert('Success', 'Style created');
            }
            setModalVisible(false);
            fetchData();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save');
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
                allowsEditing: false, // Disabling editing to save memory on Android
                quality: 0.5, // Reduced quality for better stability in Expo Go
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
            const ext = match ? match[1] : 'jpg';
            const type = `image/${ext}`;

            formDataToUpload.append('image', {
                uri: asset.uri,
                type: type,
                name: filename || 'upload.jpg',
            });
            const { data } = await uploadImage(formDataToUpload);
            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (error) {
            console.error('Image upload failed:', error);
            Alert.alert('Upload Error', 'Failed to upload image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const openModal = (style = null) => {
        if (style) {
            setEditingStyle(style);
            setFormData({
                name: style.name,
                price: style.price.toString(),
                category: style.category || '',
                description: style.description || '',
                image: style.image || '',
                duration: style.duration || ''
            });
        } else {
            setEditingStyle(null);
            setFormData({ name: '', price: '', category: '', description: '', image: '', duration: '' });
        }
        setModalVisible(true);
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteStyle(id);
                        fetchData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardVisual}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImg} />
                ) : (
                    <View style={styles.cardIconBox}>
                        <Scissors color={COLORS.primary} size={32} />
                    </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.statusText}>Active</Text>
                </View>
            </View>

            <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.price}>${item.price}</Text>
                </View>

                <View style={styles.tagRow}>
                    <View style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{item.category || 'Style'}</Text>
                    </View>
                    {item.duration && (
                        <View style={styles.durationTag}>
                            <Clock color={COLORS.textSecondary} size={10} />
                            <Text style={styles.durationText}>{item.duration}</Text>
                        </View>
                    )}
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
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={[styles.headerGradient, { paddingTop: insets.top }]}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Hair Styles</Text>
                        <Text style={styles.subtitle}>{stylesData.length} Styles listed</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                        <Plus color="#000" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Scissors color={COLORS.textSecondary} size={20} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search styles or categories..."
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
                    data={filteredStyles}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Scissors color={COLORS.textSecondary} size={48} style={{ opacity: 0.3 }} />
                            </View>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No match found for your search.' : 'No hair styles available.'}
                            </Text>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{editingStyle ? 'Edit Style' : 'New Style'}</Text>
                                <Text style={styles.modalSubtitle}>Configure your style details</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                                <X color={COLORS.text} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage} disabled={uploadingImage}>
                                {uploadingImage ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : formData.image ? (
                                    <Image source={{ uri: formData.image }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <ImageIcon color={COLORS.textSecondary} size={28} />
                                        <Text style={styles.imagePlaceholderText}>Upload Preview</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Basic Info</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Style Name"
                                        placeholderTextColor="#666"
                                        value={formData.name}
                                        onChangeText={text => setFormData({ ...formData, name: text })}
                                    />
                                </View>
                                <View style={styles.row}>
                                    <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Price"
                                            placeholderTextColor="#666"
                                            value={formData.price}
                                            onChangeText={text => setFormData({ ...formData, price: text })}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Duration"
                                            placeholderTextColor="#666"
                                            value={formData.duration}
                                            onChangeText={text => setFormData({ ...formData, duration: text })}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.catOption,
                                                formData.category === cat.name && styles.catOptionActive
                                            ]}
                                            onPress={() => setFormData({ ...formData, category: cat.name })}
                                        >
                                            <Text style={[
                                                styles.catOptionText,
                                                formData.category === cat.name && styles.catOptionTextActive
                                            ]}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start' }]}>
                                    <TextInput
                                        style={[styles.input, { textAlignVertical: 'top' }]}
                                        placeholder="Add a few words about this look..."
                                        placeholderTextColor="#666"
                                        value={formData.description}
                                        onChangeText={text => setFormData({ ...formData, description: text })}
                                        multiline
                                    />
                                </View>
                            </View>

                            <View style={styles.modalFooter}>
                                <CustomButton
                                    title={editingStyle ? "Update Style" : "Save Style"}
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
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 13,
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
    },
    searchContainer: {
        paddingHorizontal: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 14,
        marginLeft: 12,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    card: {
        backgroundColor: COLORS.card,
        width: '48.5%',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    cardVisual: {
        height: 140,
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
        height: '50%',
        justifyContent: 'flex-end',
        padding: 10,
    },
    statusBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardIconBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.3,
    },
    cardInfo: {
        padding: 12,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: 'bold',
        flex: 1,
    },
    price: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    categoryTag: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryTagText: {
        color: COLORS.textSecondary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    durationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
    },
    durationText: {
        color: COLORS.textSecondary,
        fontSize: 10,
    },
    desc: {
        color: COLORS.textSecondary,
        fontSize: 11,
        lineHeight: 15,
        height: 30,
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    actionBtn: {
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        gap: 4,
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primary + '10',
    },
    editBtnText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: 'bold',
    },
    deleteBtn: {
        width: 36,
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
        marginBottom: 20,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    imageUploadBox: {
        width: '100%',
        height: 160,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
        overflow: 'hidden',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.5,
    },
    imagePlaceholderText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        backgroundColor: COLORS.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    input: {
        paddingVertical: 12,
        color: COLORS.text,
        fontSize: 15,
    },
    row: {
        flexDirection: 'row',
    },
    catScroll: {
        marginBottom: 4,
    },
    catOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        marginRight: 8,
    },
    catOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    catOptionText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    catOptionTextActive: {
        color: COLORS.primary,
    },
    modalFooter: {
        marginTop: 10,
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
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        textAlign: 'center',
    },
});
