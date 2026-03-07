import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { getStyles, getPackages, toggleWishlist as apiToggleWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Heart, ChevronRight, Star, Scissors, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function FavoritesScreen({ navigation }) {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState(user?.wishlist || []);

    useEffect(() => {
        fetchFavorites();
    }, [wishlist]);

    const fetchFavorites = async () => {
        try {
            const [pkgs, sts] = await Promise.all([getPackages(), getStyles()]);
            const allItems = [...pkgs.data.map(p => ({ ...p, isPackage: true })), ...sts.data.map(s => ({ ...s, isPackage: false }))];
            const filtered = allItems.filter(item => wishlist.includes(item.id));
            setFavorites(filtered);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWishlistToggle = async (id) => {
        try {
            const { data } = await apiToggleWishlist(id);
            setWishlist(data.wishlist);
        } catch (error) {
            console.error('Wishlist toggle failed:', error);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Booking', { item, isPackage: item.isPackage })}
        >
            <Image
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=200' }}
                style={styles.thumb}
            />
            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleWishlistToggle(item.id)} style={styles.heartBtn}>
                        <Heart color={COLORS.primary} fill={COLORS.primary} size={18} />
                    </TouchableOpacity>
                </View>
                <View style={styles.meta}>
                    {item.isPackage ? (
                        <View style={styles.tag}>
                            <Package color={COLORS.primary} size={12} />
                            <Text style={styles.tagText}>Package</Text>
                        </View>
                    ) : (
                        <View style={styles.tag}>
                            <Star color="#FFD700" size={12} fill="#FFD700" />
                            <Text style={styles.tagText}>{item.avgRating?.toFixed(1) || '0.0'}</Text>
                        </View>
                    )}
                    <Text style={styles.price}>${item.price}</Text>
                </View>
            </View>
            <ChevronRight color={COLORS.textSecondary} size={20} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient colors={[COLORS.primary + '20', COLORS.background]} style={styles.header}>
                <Text style={styles.headerTitle}>My Favorites</Text>
                <Text style={styles.headerSubtitle}>Your curated grooming collection</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Heart color={COLORS.textSecondary} size={64} style={{ opacity: 0.2 }} />
                            <Text style={styles.emptyText}>Nothing favorited yet</Text>
                            <TouchableOpacity
                                style={styles.discoverBtn}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.discoverText}>Explore Styles</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchFavorites} tintColor={COLORS.primary} />
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
    headerSubtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
    list: { padding: 20 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333'
    },
    thumb: { width: 64, height: 64, borderRadius: 12, marginRight: 16 },
    info: { flex: 1, gap: 4 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    heartBtn: { padding: 4 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    tagText: { color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
    price: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16 },
    discoverBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
    discoverText: { color: COLORS.background, fontWeight: 'bold' }
});
