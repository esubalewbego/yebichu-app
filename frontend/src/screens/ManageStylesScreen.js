import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getStyles, createStyle, updateStyle, deleteStyle, getCategories, uploadImage } from '../services/api';
import { Plus, Edit3, Trash2, X, Scissors, DollarSign, AlignLeft, ChevronLeft, Image as ImageIcon, Tag } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/Button';
import * as ImagePicker from 'expo-image-picker';

export default function ManageStylesScreen({ navigation }) {
    const { user } = useAuth();
    const [styles, setStyles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStyle, setEditingStyle] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', description: '', image: '', categoryId: null });
    const [uploadingImage, setUploadingImage] = useState(false);

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

    const handleSave = async () => {
        if (!formData.name || !formData.price) {
            Alert.alert('Error', 'Name and price are required');
            return;
        }

        try {
            if (editingStyle) {
                await updateStyle(editingStyle.id, formData);
            } else {
                await createStyle(formData);
            }
            setModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to save style');
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadImageToBackend(result.assets[0]);
        }
    };

    const uploadImageToBackend = async (asset) => {
        setUploadingImage(true);
        try {
            const reqData = new FormData();
            reqData.append('image', {
                uri: asset.uri,
                type: 'image/jpeg',
                name: 'style.jpg',
            });
            const { data } = await uploadImage(reqData);
            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (error) {
            Alert.alert('Upload Error', 'Failed to upload image');
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
                description: style.description || '',
                image: style.image || '',
                categoryId: style.categoryId || null
            });
        } else {
            setEditingStyle(null);
            setFormData({ name: '', price: '', description: '', image: '', categoryId: null });
        }
        setModalVisible(true);
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Delete style?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteStyle(id);
                    fetchData();
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.thumb} />
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>${item.price}</Text>
                {item.categoryId && (
                    <View style={styles.catBadge}>
                        <Text style={styles.catText}>{categories.find(c => c.id === item.categoryId)?.name || 'Category'}</Text>
                    </View>
                )}
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => openModal(item)}><Edit3 color={COLORS.primary} size={18} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 color="#F44336" size={18} /></TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={[COLORS.primary + '20', COLORS.background]} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color={COLORS.text} size={28} /></TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}><Plus color="#000" size={24} /></TouchableOpacity>
                </View>
                <Text style={styles.title}>Manage Styles</Text>
            </LinearGradient>

            {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} /> : (
                <FlatList
                    data={styles}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}

            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingStyle ? 'Edit Style' : 'New Style'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><X color={COLORS.text} size={24} /></TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
                                {uploadingImage ? <ActivityIndicator color={COLORS.primary} /> :
                                    formData.image ? <Image source={{ uri: formData.image }} style={styles.fullImage} /> :
                                        <View style={{ alignItems: 'center' }}><ImageIcon color={COLORS.textSecondary} size={32} /><Text style={{ color: COLORS.textSecondary }}>Add Image</Text></View>}
                            </TouchableOpacity>

                            <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#666" value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} />
                            <TextInput style={styles.input} placeholder="Price" placeholderTextColor="#666" value={formData.price} onChangeText={t => setFormData({ ...formData, price: t })} keyboardType="numeric" />
                            <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="Description" placeholderTextColor="#666" value={formData.description} onChangeText={t => setFormData({ ...formData, description: t })} />

                            <Text style={styles.label}>Select Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.miniBadge, formData.categoryId === cat.id && styles.activeMiniBadge]}
                                        onPress={() => setFormData({ ...formData, categoryId: cat.id })}
                                    >
                                        <Text style={[styles.miniBadgeText, formData.categoryId === cat.id && styles.activeMiniBadgeText]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <CustomButton title="Save Style" onPress={handleSave} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    addBtn: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 12 },
    title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
    list: { padding: 20 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
    thumb: { width: 60, height: 60, borderRadius: 12 },
    info: { flex: 1, marginLeft: 16, gap: 2 },
    name: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    price: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
    catBadge: { alignSelf: 'flex-start', backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
    catText: { color: COLORS.textSecondary, fontSize: 10 },
    actions: { flexDirection: 'row', gap: 16, marginRight: 8 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.card, padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    imageBox: { width: '100%', height: 160, backgroundColor: COLORS.background, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#444', overflow: 'hidden' },
    fullImage: { width: '100%', height: '100%' },
    input: { backgroundColor: COLORS.background, color: COLORS.text, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
    label: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    miniBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#333', marginRight: 8 },
    activeMiniBadge: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    miniBadgeText: { color: COLORS.textSecondary, fontSize: 12 },
    activeMiniBadgeText: { color: '#000', fontWeight: 'bold' }
});
