import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import BookingScreen from '../screens/BookingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ManagePackagesScreen from '../screens/ManagePackagesScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import ManageStylesScreen from '../screens/ManageStylesScreen';
import ManageMoreScreen from '../screens/ManageMoreScreen';
import AdminBookingsScreen from '../screens/AdminBookingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import ReportsScreen from '../screens/ReportsScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import ManageDiscountsScreen from '../screens/ManageDiscountsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { user } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <>
                    <Stack.Screen name="MainTabs" component={TabNavigator} />

                    {/* Shared Authenticated Screens */}
                    <Stack.Screen name="Chat" component={ChatScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="About" component={AboutScreen} />
                    <Stack.Screen name="Notifications" component={NotificationListScreen} />

                    {/* Role-Specific Private Screens */}
                    {user.role?.toLowerCase() === 'admin' && (
                        <>
                            <Stack.Screen name="ChatList" component={ChatListScreen} />
                            <Stack.Screen name="Services" component={ManagePackagesScreen} />
                            <Stack.Screen name="Categories" component={ManageCategoriesScreen} />
                            <Stack.Screen name="ManageStyles" component={ManageStylesScreen} />
                            <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} />
                            <Stack.Screen name="MoreMenu" component={ManageMoreScreen} />
                            <Stack.Screen name="Reports" component={ReportsScreen} />
                            <Stack.Screen name="Discounts" component={ManageDiscountsScreen} />
                        </>
                    )}

                    {(user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'barber' || user.role?.toLowerCase() === 'user') && (
                        <>
                            <Stack.Screen name="Booking" component={BookingScreen} />
                            <Stack.Screen name="Payment" component={PaymentScreen} />
                        </>
                    )}
                </>
            ) : (
                <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
        </Stack.Navigator>
    );
}
