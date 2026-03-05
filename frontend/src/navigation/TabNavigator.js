import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AdminDashboard from '../screens/AdminDashboard';
import BarberDashboard from '../screens/BarberDashboard';
import BarberHistoryScreen from '../screens/BarberHistoryScreen';
import ManagePackagesScreen from '../screens/ManagePackagesScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { Home, Clock, ShieldCheck, CalendarDays, Loader2, PackageSearch, Briefcase } from 'lucide-react-native';
import { View, ActivityIndicator } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const { user, loading } = useAuth();

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
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
            }}
        >
            {user?.role === 'user' && (
                <>
                    <Tab.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="My Bookings"
                        component={HistoryScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
                        }}
                    />
                </>
            )}

            {user?.role === 'barber' && (
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
                </>
            )}

            {user?.role === 'admin' && (
                <>
                    <Tab.Screen
                        name="Analytics"
                        component={AdminDashboard}
                        options={{
                            tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Manage DB"
                        component={ManagePackagesScreen}
                        options={{
                            tabBarIcon: ({ color }) => <PackageSearch color={color} size={24} />,
                        }}
                    />
                </>
            )}

            {(!user || !user.role) && (
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
