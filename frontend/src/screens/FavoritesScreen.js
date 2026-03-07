import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, ImageBackground } from 'react-native';
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
            <LinearGradient colors={[COLORS.primary + '25', COLORS.background]} style={styles.header}>
                <View style={styles.headingBox}>
                    <Heart color={COLORS.primary} size={32} fill={COLORS.primary} style={styles.headerHeart} />
                    <View>
                        <Text style={styles.headerTitle}>Curated Looks</Text>
                        <Text style={styles.headerSubtitle}>{favorites.length} Items in your collection</Text>
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.favCard}
                            onPress={() => navigation.navigate('Booking', { item, isPackage: item.isPackage })}
                            activeOpacity={0.8}
                        >
                            <ImageBackground
                                source={{ uri: item.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600' }}
                                style={styles.favImage}
                                imageStyle={{ borderRadius: 24 }}
                            >
                                <LinearGradient
                                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
                                    style={styles.favOverlay}
                                >
                                    <View style={styles.favTop}>
                                        <View style={styles.favTypeTag}>
                                            {item.isPackage ? <Package size={12} color="#000" /> : <Scissors size={12} color="#000" />}
                                            <Text style={styles.favTypeText}>{item.isPackage ? 'PACKAGE' : 'STYLE'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleWishlistToggle(item.id)} style={styles.glassHeart}>
                                            <Heart color={COLORS.primary} fill={COLORS.primary} size={18} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.favInfo}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.favName}>{item.name || item.title || item.packageName || item.service || 'Grooming Look'}</Text>
                                            <View style={styles.favMeta}>
                                                <Star color="#FFD700" size={14} fill="#FFD700" />
                                                <Text style={styles.favRating}>{item.avgRating?.toFixed(1) || '0.0'}</Text>
                                                <Text style={styles.favPrice}>• ${item.price}</Text>
                                            </View>
                                        </View>
                                        <ChevronRight color="#FFF" size={24} />
                                    </View>
                                </LinearGradient>
                            </ImageBackground>
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.favList}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBox}>
                                <Heart color={COLORS.textSecondary} size={48} opacity={0.2} />
                            </View>
                            <Text style={styles.emptyText}>Your wishlist is waiting</Text>
                            <TouchableOpacity
                                style={styles.exploreBtn}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.exploreText}>Explore Latest Styles</Text>
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
    header: { padding: 24, paddingBottom: 32 },
    headingBox: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    headerHeart: { opacity: 0.9 },
    headerTitle: { color: COLORS.text, fontSize: 32, fontWeight: 'bold' },
    headerSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    favList: { padding: 20, paddingTop: 4, paddingBottom: 100 },
    favCard: { height: 260, marginBottom: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
    favImage: { flex: 1, width: '100%', height: '100%' },
    favOverlay: { flex: 1, padding: 16, justifyContent: 'space-between' },
    favTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    favTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    favTypeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
    glassHeart: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    favInfo: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    favName: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    favMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    favRating: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
    favPrice: { color: COLORS.primary, fontSize: 15, fontWeight: 'bold' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 80, gap: 16 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    emptyText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
    exploreBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 12 },
    exploreText: { color: '#000', fontWeight: 'bold', fontSize: 15 }
});
