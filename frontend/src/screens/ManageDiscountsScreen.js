import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
    Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Edit2, Tag, Percent, Calendar, FileText } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { getDiscounts, updateDiscount, deleteDiscount, createDiscount } from '../services/api';
import Button from '../components/Button';

export default function ManageDiscountsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);

    // Form State
    const [code, setCode] = useState('');
    const [percentage, setPercentage] = useState('');
    const [description, setDescription] = useState('');
    const [active, setActive] = useState(true);
    const [expiryDate, setExpiryDate] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await getDiscounts();
            setDiscounts(data);
        } catch (error) {
            console.error('Fetch discounts error:', error);
            Alert.alert('Error', 'Failed to fetch discounts');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (discount = null) => {
        if (discount) {
            setEditingDiscount(discount);
            setCode(discount.code);
            setPercentage(discount.percentage.toString());
            setDescription(discount.description || '');
            setActive(discount.active !== undefined ? discount.active : true);
            setExpiryDate(discount.expiryDate || '');
        } else {
            setEditingDiscount(null);
            setCode('');
            setPercentage('');
            setDescription('');
            setActive(true);
            setExpiryDate('');
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!code || !percentage) {
            Alert.alert('Error', 'Code and percentage are required');
            return;
        }

        try {
            const payload = {
                code: code.toUpperCase(),
                percentage: Number(percentage),
                description,
                active,
                expiryDate: expiryDate || null
            };

            if (editingDiscount) {
                await updateDiscount(editingDiscount.id, payload);
            } else {
                await createDiscount(payload);
            }

            setModalVisible(false);
            fetchData();
            Alert.alert('Success', `Discount ${editingDiscount ? 'updated' : 'created'} successfully`);
        } catch (error) {
            console.error('Save discount error:', error);
            Alert.alert('Error', 'Failed to save discount');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Discount',
            'Are you sure you want to delete this discount code?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDiscount(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete discount');
                        }
                    }
                }
            ]
        );
    };

    const renderDiscountItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.codeContainer}>
                    <Tag size={16} color={COLORS.primary} strokeWidth={3} />
                    <Text style={styles.codeText}>{item.code}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.active ? COLORS.primary + '20' : '#444' }]}>
                    <Text style={[styles.statusText, { color: item.active ? COLORS.primary : '#888' }]}>
                        {item.active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.percentageText}>{item.percentage}% OFF</Text>
                {item.description ? (
                    <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {item.expiryDate && (
                    <View style={styles.expiryBox}>
                        <Calendar size={14} color={COLORS.textSecondary} />
                        <Text style={styles.expiryText}>Expires: {item.expiryDate}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenModal(item)}>
                    <Edit2 size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <Trash2 size={18} color="#FF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Discounts</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
                    <Plus color={COLORS.background} size={24} strokeWidth={3} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={discounts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDiscountItem}
                    contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Tag size={64} color="#333" />
                            <Text style={styles.emptyTitle}>No Discounts Yet</Text>
                            <Text style={styles.emptySubtitle}>Tap the + button to create your first promo code.</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingDiscount ? 'Edit Discount' : 'New Discount'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Promo Code</Text>
                                <View style={styles.inputWrapper}>
                                    <Tag size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="SAVE50"
                                        placeholderTextColor="#555"
                                        value={code}
                                        onChangeText={setCode}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Discount Percentage (%)</Text>
                                <View style={styles.inputWrapper}>
                                    <Percent size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="20"
                                        placeholderTextColor="#555"
                                        value={percentage}
                                        onChangeText={setPercentage}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                                    <FileText size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { height: 80 }]}
                                        placeholder="Limited time offer..."
                                        placeholderTextColor="#555"
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Expiry Date (Optional)</Text>
                                <View style={styles.inputWrapper}>
                                    <Calendar size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#555"
                                        value={expiryDate}
                                        onChangeText={setExpiryDate}
                                    />
                                </View>
                            </View>

                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={styles.switchLabel}>Status</Text>
                                    <Text style={styles.switchSub}>{active ? 'Code is currently usable' : 'Code is disabled'}</Text>
                                </View>
                                <Switch
                                    value={active}
                                    onValueChange={setActive}
                                    trackColor={{ false: '#444', true: COLORS.primary + '50' }}
                                    thumbColor={active ? COLORS.primary : '#888'}
                                />
                            </View>

                            <Button
                                title={editingDiscount ? 'Update Discount' : 'Create Discount'}
                                onPress={handleSave}
                                style={styles.saveBtn}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backBtn: {
        padding: 8,
        backgroundColor: COLORS.card,
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    addBtn: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
    },
    codeText: {
        color: COLORS.primary,
        fontWeight: '800',
        fontSize: 14,
        marginLeft: 6,
        letterSpacing: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardBody: {
        marginBottom: 16,
    },
    percentageText: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 4,
    },
    descriptionText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    expiryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    expiryText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginLeft: 6,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 12,
    },
    actionBtn: {
        marginLeft: 16,
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
    },
    closeText: {
        color: '#888',
        fontSize: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        color: COLORS.text,
        fontSize: 16,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#333',
    },
    switchLabel: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    switchSub: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    saveBtn: {
        marginTop: 10,
    },
});
