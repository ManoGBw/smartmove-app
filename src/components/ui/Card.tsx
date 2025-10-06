import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../../theme/colors';

export const Card = ({ children, style }: ViewProps) => (
    <View style={[styles.card, style]}>{children}</View>
);

export const CardContent = ({ children, style }: ViewProps) => (
    <View style={[styles.content, style]}>{children}</View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        padding: theme.spacing.lg,
    },
});