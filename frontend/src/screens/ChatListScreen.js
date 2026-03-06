import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { getConversations } from '../services/api';
import { MessageSquare, ChevronRight, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatListScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const { data } = await getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        // Find the other participant's ID (not the admin's)
        // For simplicity in this demo, we'll just show the conversation ID or last message
        return (
            <TouchableOpacity
                style={styles.convoCard}
                onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
            >
                <View style={styles.avatar}>
                    <User color={COLORS.primary} size={24} />
                </View>
                <div style={styles.convoInfo}>
                    <Text style={styles.convoTitle}>Customer Support Chat</Text>
                    <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMessage || 'No messages yet'}</Text>
                </div>
                <View style={styles.convoMeta}>
                    <Text style={styles.timeText}>{item.lastUpdate ? new Date(item.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                    <ChevronRight color={COLORS.textSecondary} size={20} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient colors={[COLORS.primary + '20', COLORS.background]} style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchConversations} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MessageSquare color={COLORS.textSecondary} size={48} style={{ opacity: 0.3 }} />
                            <Text style={styles.emptyText}>No active conversations</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 24, paddingBottom: 30 },
    headerTitle: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
    list: { padding: 20 },
    convoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333'
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    convoInfo: { flex: 1 },
    convoTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    lastMsg: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
    convoMeta: { alignItems: 'flex-end', gap: 4 },
    timeText: { color: COLORS.textSecondary, fontSize: 11 },
    empty: { alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16 }
});
