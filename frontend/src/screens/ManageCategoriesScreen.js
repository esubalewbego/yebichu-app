import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { Plus, Edit3, Trash2, X, ChevronLeft, Scissors } from 'lucide-react-native';

export default function ManageCategoriesScreen({ navigation }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [name, setName] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name) return;
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, { name });
            } else {
                await createCategory({ name });
            }
            setModalVisible(false);
            fetchCategories();
        } catch (error) {
            Alert.alert('Error', 'Failed to save category');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Delete this category?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteCategory(id);
                    fetchCategories();
                }
            }
        ]);
    };

    const openModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat);
            setName(cat.name);
        } else {
            setEditingCategory(null);
            setName('');
        }
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={[COLORS.primary + '20', COLORS.background]} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ChevronLeft color={COLORS.text} size={28} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                        <Plus color="#000" size={24} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.title}>Categories</Text>
            </LinearGradient>

            <FlatList
                data={categories}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Scissors color={COLORS.primary} size={20} />
                        <Text style={styles.cardText}>{item.name}</Text>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => openModal(item)}><Edit3 color={COLORS.primary} size={18} /></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 color="#F44336" size={18} /></TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.list}
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'New Category'}</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Category Name"
                            placeholderTextColor="#666"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    addBtn: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 12 },
    title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
    list: { padding: 24 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
    cardText: { flex: 1, color: COLORS.text, fontSize: 16, marginLeft: 12 },
    actions: { flexDirection: 'row', gap: 16 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: COLORS.card, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    input: { backgroundColor: COLORS.background, color: COLORS.text, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#444' },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
    cancelText: { color: COLORS.textSecondary },
    saveBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    saveText: { color: '#000', fontWeight: 'bold' }
});
