import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { theme } from '../../theme/colors';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
}

export const Button = ({ title, onPress, disabled, style }: ButtonProps) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[styles.button, disabled && styles.disabled, style]}
        >
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        height: 50,
        borderRadius: theme.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: theme.colors.primaryForeground,
        fontSize: 16,
        fontWeight: '500',
    },
    disabled: {
        backgroundColor: theme.colors.foreground,
    },
});