import { LucideProps } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../../theme/colors';

interface InputProps extends TextInputProps {
    label: string;
    Icon?: React.FC<LucideProps>;
}

export const Input = ({ label, Icon, ...props }: InputProps) => {
    return (
        <View style={styles.group}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                {Icon && <Icon color={theme.colors.foreground} size={16} style={styles.icon} />}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={theme.colors.foreground}
                    {...props}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    group: {
        marginBottom: theme.spacing.md,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.primary,
        marginBottom: theme.spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.inputBackground,
        borderRadius: theme.radius.md,
        height: 50,
    },
    icon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        color: theme.colors.primary,
        height: '100%',
    },
});