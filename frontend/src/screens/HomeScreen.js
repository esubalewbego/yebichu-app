import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { getPackages, getStyles } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Scissors, Star, MapPin, Bell, Clock, ChevronRight, Search, Heart, Filter, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [packages, setPackages] = useState([]);
    const [stylesData, setHairStyles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

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
            <TouchableOpacity style={styles.wishlistBtn}>
                <Heart color="#fff" size={18} />
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
                <Text style={styles.styleName}>{item.name}</Text>
                <View style={styles.styleMeta}>
                    <Star color="#FFD700" size={12} fill="#FFD700" />
                    <Text style={styles.styleRating}>4.8 (120+)</Text>
                </View>
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
                            onPress={() => navigation.navigate('Chat', { receiverId: 'admin_uid_fallback' })}
                        >
                            <MessageSquare color={COLORS.primary} size={22} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Bell color={COLORS.text} size={22} />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={logout} style={styles.profileBtn}>
                            <User color={COLORS.primary} size={24} />
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
                        <Text style={styles.locText}>Addis Ababa, Bole</Text>
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
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>Exclusive Packages</Text>
                                <Text style={styles.sectionSubtitle}>Curated grooming experiences</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.viewAllText}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={packages}
                            renderItem={renderPackage}
                            keyExtractor={item => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.packagesList}
                            decelerationRate="fast"
                            snapToInterval={286} // card width + margin
                        />

                        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                            <View>
                                <Text style={styles.sectionTitle}>Popular Styles</Text>
                                <Text style={styles.sectionSubtitle}>Trending hair designs</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.viewAllText}>Discover</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.stylesList}>
                            {stylesData.map(item => (
                                <View key={item.id}>
                                    {renderStyle({ item })}
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.promoCard} activeOpacity={0.9}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primary + 'AA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.promoGradient}
                            >
                                <View style={styles.promoInfo}>
                                    <Text style={styles.promoTitle}>Invite a friend</Text>
                                    <Text style={styles.promoDesc}>Get 20% off your next session</Text>
                                </View>
                                <TouchableOpacity style={styles.promoBtn}>
                                    <Text style={styles.promoBtnText}>Share</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
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
    stylesList: {
        paddingHorizontal: 24,
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
});
