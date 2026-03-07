import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { getPackages, getStyles, rateStyle, getAdminInfo, toggleWishlist as apiToggleWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Scissors, Star, MapPin, Bell, Clock, ChevronRight, Search, Heart, Filter, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [packages, setPackages] = useState([]);
    const [stylesData, setHairStyles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [userRating, setUserRating] = useState(5);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [wishlist, setWishlist] = useState(user?.wishlist || []);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'

    useEffect(() => {
        if (user) {
            fetchData();
            loadAdminInfo();
            fetchCategories();
        }
    }, [user]);

    const loadAdminInfo = async () => {
        try {
            const { data } = await getAdminInfo();
            setAdminUid(data.uid);
        } catch (error) {
            console.error('Failed to load admin info:', error);
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

    const fetchCategories = async () => {
        try {
            const { getCategories } = require('../services/api');
            const { data } = await getCategories();
            setCategories([{ id: null, name: 'All' }, ...data]);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [pkgs, sts] = await Promise.all([getPackages(), getStyles()]);
            setPackages(pkgs.data);
            setHairStyles(sts.data);
        } catch (error) {
            console.error('Failed to fetch Home Data:', error);
            setPackages([]);
            setHairStyles([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = () => {
        setLoading(true);
        fetchData();
    };

    const handleRatePress = (style) => {
        setSelectedStyle(style);
        setRatingModalVisible(true);
    };

    const submitRating = async () => {
        if (!selectedStyle) return;
        setSubmittingRating(true);
        try {
            await rateStyle(selectedStyle.id, { rating: userRating, userId: user?.uid });
            setRatingModalVisible(false);
            fetchData(); // Refresh to show new average
        } catch (error) {
            console.error('Failed to submit rating:', error);
            Alert.alert('Error', 'Failed to submit rating. Please try again.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const renderPackage = ({ item }) => (
        <TouchableOpacity
            style={styles.packageCard}
            onPress={() => navigation.navigate('Booking', { item, isPackage: true })}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600' }}
                style={styles.packageImage}
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.95)']}
                style={styles.packageGradient}
            >
                <View style={styles.packageContent}>
                    <View style={styles.packageTag}>
                        <Text style={styles.packageTagText}>POPULAR</Text>
                    </View>
                    <Text style={styles.packageTitle}>{item.name}</Text>
                    <View style={styles.packageFooter}>
                        <Text style={styles.packagePrice}>${item.price}</Text>
                        <View style={styles.packageDot} />
                        <Text style={styles.packageDuration}>{item.duration || '60 min'}</Text>
                    </View>
                </View>
            </LinearGradient>
            <TouchableOpacity
                style={styles.wishlistBtn}
                onPress={() => handleWishlistToggle(item.id)}
            >
                <Heart
                    color={wishlist.includes(item.id) ? COLORS.primary : "#fff"}
                    fill={wishlist.includes(item.id) ? COLORS.primary : "transparent"}
                    size={18}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderStyle = ({ item }) => (
        <TouchableOpacity
            style={styles.styleCard}
            onPress={() => navigation.navigate('Booking', { item, isPackage: false })}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1621605815841-28565f57fc97?auto=format&fit=crop&q=80&w=200' }}
                style={styles.styleThumb}
            />
            <View style={styles.styleInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={styles.styleName}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleWishlistToggle(item.id)} style={{ padding: 4 }}>
                        <Heart
                            color={wishlist.includes(item.id) ? COLORS.primary : COLORS.textSecondary}
                            fill={wishlist.includes(item.id) ? COLORS.primary : "transparent"}
                            size={16}
                        />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.styleMeta} onPress={() => handleRatePress(item)}>
                    <Star color="#FFD700" size={12} fill="#FFD700" />
                    <Text style={styles.styleRating}>
                        {`${item.avgRating?.toFixed(1) || '0.0'} (${item.ratingCount || 0})`}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.stylePrice}>Starting from <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>${item.price}</Text></Text>
            </View>
            <View style={styles.styleAction}>
                <ChevronRight color={COLORS.textSecondary} size={20} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <LinearGradient
                colors={[COLORS.primary + '15', COLORS.background]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userNameText}>{user?.displayName || user?.email?.split('@')[0] || 'Gentleman'}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => navigation.navigate('Chat', { receiverId: adminUid || 'admin', userName: 'Admin Support' })}
                        >
                            <MessageSquare color={COLORS.primary} size={22} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Bell color={COLORS.text} size={22} />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.searchRow}>
                    <View style={styles.searchContainer}>
                        <Search color={COLORS.textSecondary} size={20} style={styles.searchIcon} />
                        <Text style={styles.placeholderText}>Find your next look...</Text>
                    </View>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter color={COLORS.text} size={20} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                <View style={styles.statusBanner}>
                    <View style={styles.locBox}>
                        <MapPin color={COLORS.primary} size={16} />
                        <Text style={styles.locText}>Studio Location</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statusBox}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.statusText}>Studio Open</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loaderBox}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.categoriesContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id || 'all'}
                                        style={[styles.catBadge, selectedCategory === cat.id && styles.activeCatBadge]}
                                        onPress={() => setSelectedCategory(cat.id)}
                                    >
                                        <Text style={[styles.catText, selectedCategory === cat.id && styles.activeCatText]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.carouselContainer}>
                            <FlatList
                                data={stylesData.filter(s => !selectedCategory || s.categoryId === selectedCategory)}
                                renderItem={({ item }) => (
                                    <View style={styles.carouselItem}>
                                        {renderStyle({ item })}
                                    </View>
                                )}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                decelerationRate="fast"
                                snapToInterval={330}
                                contentContainerStyle={{ paddingHorizontal: 24 }}
                            />
                        </View>

                        <View style={styles.stylesList}>
                            {stylesData
                                .filter(item => activeTab === 'all' || wishlist.includes(item.id))
                                .map(item => (
                                    <View key={item.id}>
                                        {renderStyle({ item })}
                                    </View>
                                ))}
                            {activeTab === 'favorites' && stylesData.filter(item => wishlist.includes(item.id)).length === 0 && (
                                <View style={styles.emptyFavorites}>
                                    <Heart color={COLORS.textSecondary} size={48} style={{ opacity: 0.2 }} />
                                    <Text style={styles.emptyFavoritesText}>No favorites yet</Text>
                                    <TouchableOpacity style={styles.discoverBtn} onPress={() => setActiveTab('all')}>
                                        <Text style={styles.discoverBtnText}>Discover Styles</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                    </>
                )}
            </ScrollView>

            <Modal visible={ratingModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.ratingModal}>
                        <Text style={styles.modalTitle}>Rate This Style</Text>
                        <Text style={styles.modalStyleName}>{selectedStyle?.name}</Text>

                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                                    <Star
                                        color={star <= userRating ? "#FFD700" : "#444"}
                                        fill={star <= userRating ? "#FFD700" : "transparent"}
                                        size={32}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setRatingModalVisible(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitBtn, submittingRating && { opacity: 0.5 }]}
                                onPress={submitRating}
                                disabled={submittingRating}
                            >
                                {submittingRating ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Text style={styles.submitText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 24,
    },
    headerGradient: {
        paddingTop: 0,
        paddingBottom: 20,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        position: 'relative',
    },
    notifDot: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.card,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchIcon: {
        marginRight: 10,
    },
    placeholderText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    filterBtn: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    welcomeText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        fontWeight: '500',
    },
    userNameText: {
        color: COLORS.text,
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 2,
    },
    profileBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#333',
    },
    locBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '500',
    },
    divider: {
        width: 1,
        height: 14,
        backgroundColor: '#444',
        marginHorizontal: 16,
    },
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
    },
    statusText: {
        color: COLORS.success,
        fontSize: 12,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: 'bold',
    },
    sectionSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 4,
    },
    viewAllText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    packagesList: {
        paddingLeft: 24,
        paddingRight: 8,
    },
    packageCard: {
        width: 270,
        height: 380,
        marginRight: 16,
        borderRadius: 28,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: COLORS.card,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    packageImage: {
        width: '100%',
        height: '100%',
    },
    packageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        justifyContent: 'flex-end',
        padding: 24,
    },
    packageContent: {
        gap: 8,
    },
    packageTag: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    packageTagText: {
        color: COLORS.background,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    packageTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        lineHeight: 28,
    },
    packageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    packagePrice: {
        color: COLORS.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    packageDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#666',
    },
    packageDuration: {
        color: '#aaa',
        fontSize: 14,
    },
    wishlistBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoriesContainer: {
        marginTop: 32,
        marginBottom: 8
    },
    categoriesScroll: {
        paddingHorizontal: 24,
        gap: 12
    },
    catBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: '#333'
    },
    activeCatBadge: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
    catText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600'
    },
    activeCatText: {
        color: COLORS.background,
        fontWeight: 'bold'
    },
    carouselContainer: {
        marginTop: 16,
        marginBottom: 40
    },
    carouselItem: {
        width: 330,
        marginRight: 0
    },
    styleCard: {
        backgroundColor: COLORS.card,
        borderRadius: 22,
        padding: 14,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    styleThumb: {
        width: 72,
        height: 72,
        borderRadius: 16,
        marginRight: 16,
    },
    styleInfo: {
        flex: 1,
        gap: 4,
    },
    styleName: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: 'bold',
    },
    styleMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    styleRating: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    stylePrice: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    styleAction: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    promoCard: {
        marginHorizontal: 24,
        marginTop: 24,
        borderRadius: 24,
        overflow: 'hidden',
    },
    promoGradient: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    promoInfo: {
        flex: 1,
        gap: 4,
    },
    promoTitle: {
        color: COLORS.background,
        fontSize: 20,
        fontWeight: 'bold',
    },
    promoDesc: {
        color: COLORS.background,
        fontSize: 14,
        opacity: 0.8,
    },
    promoBtn: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    promoBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    loaderBox: {
        padding: 50,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    ratingModal: {
        backgroundColor: COLORS.card,
        width: '100%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold'
    },
    modalStyleName: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 4,
        marginBottom: 24
    },
    starsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444'
    },
    cancelText: {
        color: COLORS.text,
        fontWeight: '600'
    },
    submitBtn: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    submitText: {
        color: '#000',
        fontWeight: 'bold'
    }
});
