import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import BookingScreen from '../screens/BookingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ManagePackagesScreen from '../screens/ManagePackagesScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { user } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <>
                    <Stack.Screen name="MainTabs" component={TabNavigator} />

                    {/* Role-Specific Private Screens */}
                    {(user.role === 'user' || user.role === 'admin') && (
                        <>
                            <Stack.Screen name="Booking" component={BookingScreen} />
                            <Stack.Screen name="Payment" component={PaymentScreen} />
                        </>
                    )}

                    {user.role === 'admin' && (
                        <Stack.Screen name="ManagePackages" component={ManagePackagesScreen} />
                    )}
                </>
            ) : (
                <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
        </Stack.Navigator>
    );
}
