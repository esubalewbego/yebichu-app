import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { Plus, Edit3, Trash2, X, ChevronLeft, Scissors, Search, Tag, Hash } from 'lucide-react-native';
import CustomButton from '../components/Button';

export default function ManageCategoriesScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data } = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = async () => {
        if (!name) {
            Alert.alert('Required', 'Please enter a category name');
            return;
        }
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, { name });
                Alert.alert('Success', 'Category updated');
            } else {
                await createCategory({ name });
                Alert.alert('Success', 'Category created');
            }
            setModalVisible(false);
            fetchCategories();
        } catch (error) {
            Alert.alert('Error', 'Failed to save category');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Removing this category might affect styles using it. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteCategory(id);
                        fetchCategories();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete');
                    }
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

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardIconBox}>
                <Hash color={COLORS.primary} size={20} />
            </View>
            <View style={styles.info}>
                <Text style={styles.cardText}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>Main Category</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => openModal(item)} style={[styles.actionBtn, styles.editBtn]}>
                    <Edit3 color={COLORS.primary} size={16} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, styles.deleteBtn]}>
                    <Trash2 color="#F44336" size={16} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.primary + '20', COLORS.background]} style={[styles.headerGradient, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Categories</Text>
                        <Text style={styles.subtitle}>{categories.length} Collections</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                        <Plus color="#000" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search color={COLORS.textSecondary} size={20} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search categories..."
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
                    data={filteredCategories}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Tag color={COLORS.textSecondary} size={48} style={{ opacity: 0.2 }} />
                            <Text style={styles.emptyText}>No categories found</Text>
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
                                <Text style={styles.modalTitle}>{editingCategory ? 'Edit Entry' : 'New Collection'}</Text>
                                <Text style={styles.modalSubtitle}>Organize your styles</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                                <X color={COLORS.text} size={20} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Display Name</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Modern Fades"
                                    placeholderTextColor="#666"
                                    autoFocus
                                />
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <CustomButton
                                title={editingCategory ? "Update Category" : "Create Category"}
                                onPress={handleSave}
                                loading={loading}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerGradient: { paddingBottom: 16 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
    subtitle: { fontSize: 13, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    addBtn: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    searchContainer: { paddingHorizontal: 24 },
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
    searchInput: { flex: 1, color: COLORS.text, fontSize: 14, marginLeft: 12 },
    list: { padding: 24, paddingTop: 8, paddingBottom: 100 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.card, padding: 16,
        borderRadius: 20, marginBottom: 12,
        borderWidth: 1, borderColor: '#333'
    },
    cardIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: COLORS.background,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16, borderWidth: 1, borderColor: '#333'
    },
    info: { flex: 1 },
    cardText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    cardSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    editBtn: { borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '10' },
    deleteBtn: { borderColor: '#F4433630', backgroundColor: '#F4433610' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16 },
    emptyText: { color: COLORS.textSecondary, fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.card, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: '#333'
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
    modalSubtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
    inputContainer: { marginBottom: 24 },
    inputLabel: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginLeft: 4 },
    inputWrapper: { backgroundColor: COLORS.background, borderRadius: 14, borderWidth: 1, borderColor: '#333', paddingHorizontal: 16 },
    input: { paddingVertical: 14, color: COLORS.text, fontSize: 16 },
    modalFooter: { marginTop: 10 },
});
