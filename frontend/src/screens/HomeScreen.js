import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ScrollView, ActivityIndicator, RefreshControl,
    Modal, Alert, Dimensions, ImageBackground, TextInput
} from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { getPackages, getStyles, rateStyle, getAdminInfo, getCategories, getDiscounts, toggleWishlist as apiToggleWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Scissors, Star, MapPin, Bell, Clock, ChevronRight, Search, Heart, Filter, MessageSquare, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
    const { user, updateUser } = useAuth();
    const insets = useSafeAreaInsets();
    const [stylesData, setHairStyles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [userRating, setUserRating] = useState(5);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [adminUid, setAdminUid] = useState(null);
    const [discounts, setDiscounts] = useState([]);

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
            updateUser({ wishlist: data.wishlist });
        } catch (error) {
            console.error('Wishlist toggle failed:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await getCategories();
            setCategories([{ id: null, name: 'All' }, ...data]);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [stylesRes, packagesRes, discountsRes] = await Promise.all([
                getStyles(),
                getPackages(),
                getDiscounts()
            ]);

            const mergedData = [
                ...stylesRes.data.map(s => ({ ...s, isPackage: false })),
                ...packagesRes.data.map(p => ({ ...p, isPackage: true }))
            ];
            setHairStyles(mergedData);
            setDiscounts(discountsRes.data.filter(d => d.active));
        } catch (error) {
            console.error('Failed to fetch Home Data:', error);
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
            await rateStyle(selectedStyle.id, {
                rating: userRating,
                userId: user?.uid,
                isPackage: !!selectedStyle.isPackage
            });
            setRatingModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Failed to submit rating:', error);
            Alert.alert('Error', 'Failed to submit rating.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const flatListRef = React.useRef(null);

    const handleNextStyle = (index) => {
        const filtered = stylesData.filter(s => !selectedCategory || s.category === selectedCategory);
        if (flatListRef.current && index < filtered.length - 1) {
            flatListRef.current.scrollToIndex({ index: index + 1, animated: true });
        } else if (flatListRef.current) {
            flatListRef.current.scrollToIndex({ index: 0, animated: true });
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary + '15', COLORS.background]}
                style={[styles.headerSection, { paddingTop: insets.top }]}
            >
                <View style={styles.topBar}>
                    <View>
                        <Text style={styles.greeting}>Good Day,</Text>
                        <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'Gentleman'}</Text>
                    </View>
                    <View style={styles.topActions}>
                        <TouchableOpacity
                            style={styles.roundAction}
                            onPress={() => navigation.navigate('Chat', { receiverId: adminUid || 'admin', userName: 'Admin Support' })}
                        >
                            <MessageSquare color={COLORS.primary} size={22} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.roundAction}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <Bell color={COLORS.text} size={22} />
                            {/* Placeholder for unread dot logic */}
                            <View style={styles.activeDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.searchWrapper}>
                    <View style={styles.searchGlass}>
                        <Search color={COLORS.primary} size={20} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search your favorite look..."
                            placeholderTextColor="#666"
                        />
                    </View>
                    <TouchableOpacity style={styles.filterBox}>
                        <Filter color={COLORS.text} size={20} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollArea}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <>
                        {discounts.length > 0 && (
                            <View style={styles.discountsContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discountsScroll}>
                                    {discounts.map(discount => (
                                        <TouchableOpacity key={discount.id} style={styles.discountCard} activeOpacity={0.8}>
                                            <LinearGradient
                                                colors={[COLORS.primary, '#D4AF37']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.discountGradient}
                                            >
                                                <View style={styles.discountInfo}>
                                                    <Text style={styles.discountPercent}>{discount.percentage}% OFF</Text>
                                                    <Text style={styles.discountCode}>{discount.code}</Text>
                                                </View>
                                                <View style={styles.discountDivider} />
                                                <Text style={styles.discountDesc} numberOfLines={1}>{discount.description || 'Special offer for you'}</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.catsContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsScroll}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id || 'all'}
                                        style={[styles.catPill, selectedCategory === (cat.id ? cat.name : null) && styles.activePill]}
                                        onPress={() => setSelectedCategory(cat.id ? cat.name : null)}
                                    >
                                        <Text style={[styles.catLabel, selectedCategory === (cat.id ? cat.name : null) && styles.activeLabel]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.mainDiscovery}>
                            <View style={styles.sectionHeading}>
                                <View>
                                    <Text style={styles.sectionTitle}>Style Hub</Text>
                                    <Text style={styles.sectionDesc}>Find your signature look</Text>
                                </View>
                                <TouchableOpacity>
                                    <Text style={styles.seeAll}>See All</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                ref={flatListRef}
                                data={stylesData.filter(s => !selectedCategory || s.category === selectedCategory)}
                                renderItem={({ item, index }) => (
                                    <View style={styles.premiumSlide}>
                                        <TouchableOpacity
                                            style={styles.premiumCard}
                                            onPress={() => navigation.navigate('Booking', { 
                                                item, 
                                                isPackage: !!item.isPackage,
                                                activeDiscount: discounts.length > 0 ? discounts[0] : null
                                            })}
                                            activeOpacity={0.95}
                                        >
                                            <ImageBackground
                                                source={item.image ? { uri: item.image } : null}
                                                style={styles.slideImg}
                                                imageStyle={{ borderRadius: 32 }}
                                            >
                                                {!item.image && (
                                                    <View style={styles.placeholder}>
                                                        <Scissors color={COLORS.primary} size={48} opacity={0.2} />
                                                    </View>
                                                )}
                                                <LinearGradient
                                                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                                                    style={styles.slideOverlay}
                                                >
                                                    <View style={styles.slideTop}>
                                                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                                            <View style={styles.priceTag}>
                                                                <Text style={styles.priceText}>
                                                                    ${discounts.length > 0 
                                                                        ? (item.price * (1 - discounts[0].percentage / 100)).toFixed(2)
                                                                        : item.price}
                                                                </Text>
                                                            </View>
                                                            {discounts.length > 0 && (
                                                                <View style={[styles.priceTag, { backgroundColor: '#FFD700' }]}>
                                                                    <Text style={[styles.priceText, { fontSize: 12 }]}>-{discounts[0].percentage}%</Text>
                                                                </View>
                                                            )}
                                                            {discounts.length > 0 && (
                                                                <Text style={{ color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through', fontSize: 14 }}>
                                                                    ${item.price}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                handleWishlistToggle(item.id);
                                                            }}
                                                            style={styles.glassFav}
                                                        >
                                                            <Heart
                                                                color={user?.wishlist?.includes(item.id) ? COLORS.primary : '#FFF'}
                                                                fill={user?.wishlist?.includes(item.id) ? COLORS.primary : "transparent"}
                                                                size={20}
                                                            />
                                                        </TouchableOpacity>
                                                    </View>

                                                    <View style={styles.slideInfo}>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.itemName}>{item.name || item.title || item.packageName || item.service || 'Grooming Style'}</Text>
                                                            <TouchableOpacity
                                                                style={styles.ratingRow}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRatePress(item);
                                                                }}
                                                            >
                                                                <Star color="#FFD700" size={14} fill="#FFD700" />
                                                                <Text style={styles.ratingText}>
                                                                    {`${item.avgRating?.toFixed(1) || '0.0'} (${item.ratingCount || 0})`}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                        <TouchableOpacity
                                                            style={styles.swapCircle}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                handleNextStyle(index);
                                                            }}
                                                        >
                                                            <RefreshCw color="#000" size={20} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </LinearGradient>
                                            </ImageBackground>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                decelerationRate="fast"
                                snapToInterval={SCREEN_WIDTH - 16}
                                snapToAlignment="center"
                                contentContainerStyle={{ paddingHorizontal: 16 }}
                            />
                        </View>
                    </>
                )}
            </ScrollView>

            <Modal visible={ratingModalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.ratingBox}>
                        <Text style={styles.modalTitle}>Rate This Style</Text>
                        <Text style={styles.modalSub}>{selectedStyle?.name}</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                                    <Star
                                        color={star <= userRating ? "#FFD700" : "#444"}
                                        fill={star <= userRating ? "#FFD700" : "transparent"}
                                        size={36}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setRatingModalVisible(false)}>
                                <Text style={styles.cancelTxt}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmit} onPress={submitRating}>
                                {submittingRating ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.submitTxt}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerSection: { paddingBottom: 24 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
    greeting: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
    userName: { color: COLORS.text, fontSize: 26, fontWeight: 'bold', marginTop: 2 },
    topActions: { flexDirection: 'row', gap: 12 },
    roundAction: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    activeDot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.card },
    searchWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 12, marginTop: 12 },
    searchGlass: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: '#333', height: 56 },
    searchInput: { flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 15 },
    filterBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    scrollArea: { paddingBottom: 100 },
    loader: { padding: 60, alignItems: 'center' },
    catsContainer: { marginTop: 8 },
    catsScroll: { paddingHorizontal: 24, gap: 10, paddingBottom: 16 },
    catPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: '#333' },
    activePill: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    catLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
    activeLabel: { color: COLORS.background },
    mainDiscovery: { marginTop: 10 },
    sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, marginBottom: 20 },
    sectionTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
    sectionDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
    seeAll: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
    premiumSlide: { width: SCREEN_WIDTH - 16 },
    premiumCard: { height: 420, marginHorizontal: 8, borderRadius: 32, overflow: 'hidden' },
    slideImg: { flex: 1, width: '100%', height: '100%' },
    placeholder: { flex: 1, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' },
    slideOverlay: { flex: 1, padding: 24, justifyContent: 'space-between' },
    slideTop: { flexDirection: 'row', justifyContent: 'space-between' },
    priceTag: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
    priceText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    glassFav: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    slideInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 },
    itemName: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    ratingText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    swapCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    ratingBox: { backgroundColor: COLORS.card, width: '100%', borderRadius: 30, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
    modalSub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 24 },
    starsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#444' },
    cancelTxt: { color: COLORS.text, fontWeight: '600' },
    modalSubmit: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    submitTxt: { color: '#000', fontWeight: 'bold' },
    discountsContainer: { marginTop: 10, marginBottom: 10 },
    discountsScroll: { paddingHorizontal: 24, gap: 12 },
    discountCard: { width: 200, height: 90, borderRadius: 16, overflow: 'hidden' },
    discountGradient: { flex: 1, padding: 12, justifyContent: 'center' },
    discountInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    discountPercent: { color: '#000', fontSize: 18, fontWeight: '900' },
    discountCode: { color: 'rgba(0,0,0,0.6)', fontSize: 12, fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 6, borderRadius: 4 },
    discountDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 8 },
    discountDesc: { color: '#000', fontSize: 11, fontWeight: '500', opacity: 0.8 },
});
