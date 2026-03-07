import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AdminDashboard from '../screens/AdminDashboard';
import BarberDashboard from '../screens/BarberDashboard';
import BarberHistoryScreen from '../screens/BarberHistoryScreen';
import ManagePackagesScreen from '../screens/ManagePackagesScreen';
import ManageStylesScreen from '../screens/ManageStylesScreen';
import ManageUsersScreen from '../screens/ManageUsersScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import ManageMoreScreen from '../screens/ManageMoreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatListScreen from '../screens/ChatListScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { Home, Clock, ShieldCheck, CalendarDays, Loader2, PackageSearch, Briefcase, User, Users, MessageSquare, Heart, Scissors, Menu } from 'lucide-react-native';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const { user, loading } = useAuth();
    const role = user?.role?.toLowerCase();
    const insets = useSafeAreaInsets();

    console.log('TabNavigator Rendering for role:', role);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.card,
                    borderTopWidth: 0,
                    height: 65 + (Platform.OS === 'ios' ? insets.bottom : insets.bottom > 20 ? insets.bottom - 10 : 0),
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom > 20 ? insets.bottom : 12,
                    paddingTop: 8,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: -4,
                },
            }}
        >
            {role === 'user' && (
                <>
                    <Tab.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Favorites"
                        component={FavoritesScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Heart color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="My Bookings"
                        component={HistoryScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            tabBarIcon: ({ color }) => <User color={color} size={24} />,
                        }}
                    />
                </>
            )}

            {role === 'barber' && (
                <>
                    <Tab.Screen
                        name="Active Jobs"
                        component={BarberDashboard}
                        options={{
                            tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Performance"
                        component={BarberHistoryScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Briefcase color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            tabBarIcon: ({ color }) => <User color={color} size={24} />,
                        }}
                    />
                </>
            )}

            {role === 'admin' && (
                <>
                    <Tab.Screen
                        name="Analytics"
                        component={AdminDashboard}
                        options={{
                            tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Services"
                        component={ManagePackagesScreen}
                        options={{
                            tabBarIcon: ({ color }) => <PackageSearch color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Styles"
                        component={ManageStylesScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Scissors color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Users"
                        component={ManageUsersScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Users color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Messages"
                        component={ChatListScreen}
                        options={{
                            tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="More"
                        component={ManageMoreScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Menu color={color} size={24} />,
                        }}
                    />
                </>
            )}

            {!role && (
                <Tab.Screen
                    name="Wait"
                    component={HomeScreen}
                    options={{
                        tabBarIcon: ({ color }) => <Loader2 color={color} size={24} />,
                    }}
                />
            )}
        </Tab.Navigator>
    );
}
