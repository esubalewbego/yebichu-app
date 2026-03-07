import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getAllUsers, updateUserRole, deleteUserById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Trash2, Shield, User, Scissors, ChevronDown, RefreshCw, Search, X } from 'lucide-react-native';

const ROLES = ['user', 'barber', 'admin'];

const roleColor = {
    admin: '#FF6B6B',
    barber: COLORS.primary,
    user: '#4CAF50',
};

const roleIcon = (role, size = 15) => {
    if (role === 'admin') return <Shield color={roleColor.admin} size={size} />;
    if (role === 'barber') return <Scissors color={roleColor.barber} size={size} />;
    return <User color={roleColor.user} size={size} />;
};

export default function ManageUsersScreen() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleModalUser, setRoleModalUser] = useState(null);
    const [updatingRole, setUpdatingRole] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    if (currentUser?.role !== 'admin') {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: COLORS.text, fontSize: 18 }}>Access Denied</Text>
            </View>
        );
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            Alert.alert('Error', 'Could not load users.');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRoleChange = async (newRole) => {
        if (!roleModalUser || newRole === roleModalUser.role) {
            setRoleModalUser(null);
            return;
        }
        setUpdatingRole(true);
        try {
            await updateUserRole(roleModalUser.id, newRole);
            setUsers(prev => prev.map(u => u.id === roleModalUser.id ? { ...u, role: newRole } : u));
            Alert.alert('Success', `Role updated to ${newRole}`);
            setRoleModalUser(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to update role');
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleDelete = (user) => {
        if (user.id === currentUser?.uid) {
            Alert.alert('Cannot Delete', 'You cannot delete your own account.');
            return;
        }
        Alert.alert(
            'Delete User',
            `Are you sure you want to permanently delete ${user.firstName} ${user.lastName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await deleteUserById(user.id);
                            setUsers(prev => prev.filter(u => u.id !== user.id));
                            Alert.alert('Deleted', 'User removed.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete user.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: roleColor[item.role] + '20' }]}>
                    <Text style={[styles.avatarText, { color: roleColor[item.role] }]}>
                        {(item.firstName?.[0] || '') + (item.lastName?.[0] || '')}
                    </Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Trash2 color="#F44336" size={18} />
                </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={[styles.roleBadge, { backgroundColor: roleColor[item.role] + '10', borderColor: roleColor[item.role] + '40' }]}
                    onPress={() => setRoleModalUser(item)}
                >
                    {roleIcon(item.role, 14)}
                    <Text style={[styles.roleText, { color: roleColor[item.role] }]}>{item.role}</Text>
                    <ChevronDown color={roleColor[item.role]} size={14} />
                </TouchableOpacity>
                <Text style={styles.joinDate}>Joined: {new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
            </View>
        </View>
    );

    const counts = {
        admin: users.filter(u => u.role === 'admin').length,
        barber: users.filter(u => u.role === 'barber').length,
        user: users.filter(u => u.role === 'user').length,
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={[COLORS.primary + '20', COLORS.background]} style={styles.headerGradient}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Community</Text>
                        <Text style={styles.subtitle}>{users.length} Total Members</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsers}>
                        <RefreshCw color={COLORS.primary} size={20} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search color={COLORS.textSecondary} size={20} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name, email or role..."
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

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                    {Object.entries(counts).map(([role, count]) => (
                        <TouchableOpacity
                            key={role}
                            style={[styles.chip, { borderColor: roleColor[role] + '40', backgroundColor: roleColor[role] + '05' }]}
                            onPress={() => setSearchQuery(role)}
                        >
                            {roleIcon(role, 14)}
                            <Text style={[styles.chipText, { color: roleColor[role] }]}>{count} {role}s</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Users color={COLORS.textSecondary} size={48} style={{ opacity: 0.2 }} />
                            <Text style={styles.emptyText}>No members found</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={!!roleModalUser} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setRoleModalUser(null)}
                >
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Update Privilege</Text>
                                <Text style={styles.modalSubtitle}>{roleModalUser?.firstName} {roleModalUser?.lastName}</Text>
                            </View>
                            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setRoleModalUser(null)}>
                                <X color={COLORS.text} size={20} />
                            </TouchableOpacity>
                        </View>

                        {updatingRole ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
                        ) : (
                            <View style={styles.roleOptions}>
                                {ROLES.map(role => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            styles.roleOption,
                                            roleModalUser?.role === role && { backgroundColor: roleColor[role] + '15', borderColor: roleColor[role] }
                                        ]}
                                        onPress={() => handleRoleChange(role)}
                                    >
                                        <View style={[styles.roleIconBox, { backgroundColor: roleColor[role] + '20' }]}>
                                            {roleIcon(role, 20)}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.roleOptionText, { color: roleModalUser?.role === role ? roleColor[role] : COLORS.text }]}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </Text>
                                            <Text style={styles.roleDesc}>
                                                {role === 'admin' ? 'Full system access' : role === 'barber' ? 'Service management' : 'Regular client'}
                                            </Text>
                                        </View>
                                        {roleModalUser?.role === role && (
                                            <View style={[styles.checkDot, { backgroundColor: roleColor[role] }]} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerGradient: { paddingBottom: 16 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
    subtitle: { fontSize: 13, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    refreshBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: COLORS.card,
        borderWidth: 1, borderColor: '#333',
        justifyContent: 'center', alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
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
    searchInput: { flex: 1, color: COLORS.text, fontSize: 14, marginLeft: 12 },
    chips: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 12, borderWidth: 1,
    },
    chipText: { fontSize: 12, fontWeight: 'bold' },
    list: { padding: 16, paddingTop: 4, paddingBottom: 100 },
    card: {
        backgroundColor: COLORS.card, borderRadius: 20, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#333',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 50, height: 50, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    avatarText: { fontWeight: 'bold', fontSize: 18 },
    info: { flex: 1 },
    name: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    email: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
    deleteBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#F4433610', borderWidth: 1, borderColor: '#F4433630',
        justifyContent: 'center', alignItems: 'center',
    },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#333',
    },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1,
    },
    roleText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
    joinDate: { color: '#666', fontSize: 11 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 16 },
    emptyText: { color: COLORS.textSecondary, fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
    modalBox: {
        backgroundColor: COLORS.card, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: '#333',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    closeModalBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
    modalSubtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
    roleOptions: { gap: 12 },
    roleOption: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 16, borderWidth: 1, borderColor: '#333',
        backgroundColor: COLORS.background,
    },
    roleIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    roleOptionText: { fontSize: 16, fontWeight: 'bold' },
    roleDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
    checkDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
});
