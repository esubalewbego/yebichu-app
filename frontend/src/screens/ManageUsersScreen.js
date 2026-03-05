import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getAllUsers, updateUserRole, deleteUserById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Trash2, Shield, User, Scissors, ChevronDown, RefreshCw } from 'lucide-react-native';

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

    const handleRoleChange = async (newRole) => {
        if (!roleModalUser || newRole === roleModalUser.role) {
            setRoleModalUser(null);
            return;
        }
        setUpdatingRole(true);
        try {
            await updateUserRole(roleModalUser.id, newRole);
            setUsers(prev => prev.map(u => u.id === roleModalUser.id ? { ...u, role: newRole } : u));
            Alert.alert('Success', `${roleModalUser.firstName}'s role updated to ${newRole}`);
            setRoleModalUser(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to update role: ' + (error.response?.data?.error || error.message));
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
            `Are you sure you want to permanently delete ${user.firstName} ${user.lastName}?\n\nThis action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await deleteUserById(user.id);
                            setUsers(prev => prev.filter(u => u.id !== user.id));
                            Alert.alert('Deleted', 'User has been removed.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete: ' + (error.response?.data?.error || error.message));
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {(item.firstName?.[0] || '') + (item.lastName?.[0] || '')}
                </Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                <TouchableOpacity
                    style={[styles.roleBadge, { backgroundColor: roleColor[item.role] + '20', borderColor: roleColor[item.role] + '60' }]}
                    onPress={() => setRoleModalUser(item)}
                >
                    {roleIcon(item.role)}
                    <Text style={[styles.roleText, { color: roleColor[item.role] }]}>{item.role}</Text>
                    <ChevronDown color={roleColor[item.role]} size={12} />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Trash2 color="#F44336" size={20} />
            </TouchableOpacity>
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
                        <Text style={styles.title}>Users</Text>
                        <Text style={styles.subtitle}>User Management</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsers}>
                        <RefreshCw color={COLORS.primary} size={20} />
                    </TouchableOpacity>
                </View>

                {/* Summary Chips */}
                <View style={styles.chips}>
                    {Object.entries(counts).map(([role, count]) => (
                        <View key={role} style={[styles.chip, { borderColor: roleColor[role] + '60', backgroundColor: roleColor[role] + '15' }]}>
                            {roleIcon(role, 13)}
                            <Text style={[styles.chipText, { color: roleColor[role] }]}>{count} {role}s</Text>
                        </View>
                    ))}
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Users color={COLORS.textSecondary} size={48} style={{ opacity: 0.3 }} />
                            <Text style={styles.emptyText}>No users found.</Text>
                        </View>
                    }
                />
            )}

            {/* Role Change Modal */}
            <Modal visible={!!roleModalUser} transparent animationType="fade" onRequestClose={() => setRoleModalUser(null)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRoleModalUser(null)}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Change Role</Text>
                        <Text style={styles.modalSubtitle}>
                            {roleModalUser?.firstName} {roleModalUser?.lastName}
                        </Text>
                        {updatingRole ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : (
                            ROLES.map(role => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.roleOption,
                                        roleModalUser?.role === role && { backgroundColor: roleColor[role] + '20', borderColor: roleColor[role] }
                                    ]}
                                    onPress={() => handleRoleChange(role)}
                                >
                                    {roleIcon(role, 18)}
                                    <Text style={[styles.roleOptionText, { color: roleModalUser?.role === role ? roleColor[role] : COLORS.text }]}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Text>
                                    {roleModalUser?.role === role && (
                                        <Text style={{ color: roleColor[role], fontSize: 12, marginLeft: 'auto' }}>Current</Text>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerGradient: { paddingBottom: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 16,
    },
    title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
    subtitle: { fontSize: 14, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2 },
    refreshBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: COLORS.card,
        borderWidth: 1, borderColor: '#333',
        justifyContent: 'center', alignItems: 'center',
    },
    chips: { flexDirection: 'row', paddingHorizontal: 24, gap: 10 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1,
    },
    chipText: { fontSize: 12, fontWeight: '600' },
    list: { padding: 24, paddingTop: 8 },
    card: {
        backgroundColor: COLORS.card, borderRadius: 18, padding: 16,
        flexDirection: 'row', alignItems: 'center', marginBottom: 12,
        borderWidth: 1, borderColor: '#333',
    },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: COLORS.primary + '30',
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    avatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 18 },
    info: { flex: 1 },
    name: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    email: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        alignSelf: 'flex-start', marginTop: 8,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 10, borderWidth: 1,
    },
    roleText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    deleteBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#F4433610', borderWidth: 1, borderColor: '#F4433640',
        justifyContent: 'center', alignItems: 'center',
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalBox: {
        backgroundColor: COLORS.card, borderRadius: 24, padding: 24,
        width: '100%', borderWidth: 1, borderColor: '#333',
    },
    modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
    modalSubtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 20 },
    roleOption: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#333',
    },
    roleOptionText: { fontSize: 16, fontWeight: '600' },
});
