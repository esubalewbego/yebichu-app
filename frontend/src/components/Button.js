import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function CustomButton({ title, onPress, variant = 'primary' }) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' ? styles.primary : styles.secondary,
            ]}
            onPress={onPress}
        >
            <Text style={[styles.text, variant === 'secondary' && { color: COLORS.primary }]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primary: {
        backgroundColor: COLORS.primary,
    },
    secondary: {
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    text: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
