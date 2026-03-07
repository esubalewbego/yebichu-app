import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator, RefreshControl, Modal, Alert, Dimensions, ImageBackground } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { getPackages, getStyles, rateStyle, getAdminInfo, getCategories, toggleWishlist as apiToggleWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Scissors, Star, MapPin, Bell, Clock, ChevronRight, Search, Heart, Filter, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
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
    const [adminUid, setAdminUid] = useState(null);

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
            const { data } = await getCategories();
            setCategories([{ id: null, name: 'All' }, ...data]);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [stylesRes, packagesRes] = await Promise.all([getStyles(), getPackages()]);
            // Merge both lists and mark them appropriately
            const mergedData = [
                ...stylesRes.data,
                ...packagesRes.data
            ];
            setHairStyles(mergedData);
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
            fetchData(); // Refresh to show new average
        } catch (error) {
            console.error('Failed to submit rating:', error);
            Alert.alert('Error', 'Failed to submit rating. Please try again.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const flatListRef = React.useRef(null);

    const handleNextStyle = (index) => {
        if (flatListRef.current && index < stylesData.length - 1) {
            flatListRef.current.scrollToIndex({ index: index + 1, animated: true });
        } else if (flatListRef.current) {
            flatListRef.current.scrollToIndex({ index: 0, animated: true });
        }
    };

    const renderSwappingStyle = ({ item, index }) => (
        <TouchableOpacity
            style={styles.swapCard}
            onPress={() => navigation.navigate('Booking', { item, isPackage: !!item.isPackage })}
            activeOpacity={0.9}
        >
            <View style={styles.swapImageBg}>
                {item.image ? (
                    <Image
                        source={{ uri: item.image }}
                        style={styles.swapImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Scissors color={COLORS.primary} size={48} opacity={0.2} />
                        <Text style={styles.placeholderText}>Design Preview Coming Soon</Text>
                    </View>
                )}
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
                    style={styles.swapGradient}
                >
                    <View style={styles.swapHeader}>
                        <View style={styles.priceBadge}>
                            <Text style={styles.priceBadgeText}>${item.price}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleWishlistToggle(item.id);
                            }}
                            style={styles.favCircle}
                        >
                            <Heart
                                color={wishlist.includes(item.id) ? COLORS.primary : '#FFF'}
                                fill={wishlist.includes(item.id) ? COLORS.primary : "transparent"}
                                size={20}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.swapFooter}>
                        <View style={styles.swapInfo}>
                            <Text style={styles.swapName}>{item.name}</Text>
                            <TouchableOpacity
                                style={styles.swapRating}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleRatePress(item);
                                }}
                            >
                                <Star color="#FFD700" size={14} fill="#FFD700" />
                                <Text style={styles.swapRatingText}>
                                    {`${item.avgRating?.toFixed(1) || '0.0'} (${item.ratingCount || 0})`}
                                </Text>
                                <View style={styles.rateNowBadge}>
                                    <Text style={styles.rateNowText}>Rate Now</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.swapAction}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleNextStyle(index);
                            }}
                        >
                            <ChevronRight color="#000" size={24} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
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
                                ref={flatListRef}
                                data={stylesData.filter(s => !selectedCategory || s.categoryId === selectedCategory)}
                                renderItem={({ item, index }) => (
                                    <View style={styles.carouselItem}>
                                        {renderSwappingStyle({ item, index })}
                                    </View>
                                )}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                decelerationRate="fast"
                                snapToInterval={SCREEN_WIDTH - 24} // card width + small margin
                                snapToAlignment="center"
                                contentContainerStyle={{ paddingHorizontal: 12 }}
                            />
                        </View>

                        {stylesData.length === 0 && !loading && (
                            <View style={styles.emptyContainer}>
                                <Scissors color={COLORS.textSecondary} size={48} style={{ opacity: 0.2 }} />
                                <Text style={styles.emptyText}>No styles available right now.</Text>
                            </View>
                        )}

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
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
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
