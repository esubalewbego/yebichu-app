import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AdminDashboard from '../screens/AdminDashboard';
import BarberDashboard from '../screens/BarberDashboard';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { Home, Clock, ShieldCheck, Scissors, CalendarDays, Loader2 } from 'lucide-react-native';
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
                        name="History"
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
                        name="Schedule"
                        component={BarberDashboard}
                        options={{
                            tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="History"
                        component={HistoryScreen}
                        options={{
                            tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
                        }}
                    />
                </>
            )}

            {user?.role === 'admin' && (
                <>
                    <Tab.Screen
                        name="Admin"
                        component={AdminDashboard}
                        options={{
                            tabBarLabel: 'Admin',
                            tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} />,
                        }}
                    />
                    <Tab.Screen
                        name="Overview"
                        component={HomeScreen}
                        options={{
                            tabBarLabel: 'Home',
                            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                        }}
                    />
                </>
            )}
            {(!user || !user.role) && (
                <Tab.Screen
                    name="Wait"
                    component={HomeScreen}
                    options={{
                        tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                    }}
                />
            )}
        </Tab.Navigator>
    );
}
