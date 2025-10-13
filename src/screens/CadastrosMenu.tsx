// src/screens/CadastrosMenu.tsx

import { ArrowLeft, CreditCard, Package, Users } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { theme } from '../theme/colors';

type CadastrosMenuProps = {
    navigation: {
        navigate: (screen: string) => void;
        goBack: () => void;
    };
};

const cadastroOptions = [
    {
        id: 'clientes',
        title: 'Clientes',
        subtitle: 'Gerenciar base de clientes',
        icon: Users,
        color: '#2E1E43',
    },
    {
        id: 'produtos',
        title: 'Produtos',
        subtitle: 'Catálogo de produtos',
        icon: Package,
        color: '#A5A4E0',
    },
    {
        id: 'formas-pagamento',
        title: 'Formas de Pagamento',
        subtitle: 'Métodos de pagamento',
        icon: CreditCard,
        color: '#2E1E43',
    },
];

export function CadastrosMenu({ navigation }: CadastrosMenuProps) {
    const handleOptionPress = (optionId: string) => {
        // Futuramente, você pode navegar para telas específicas
        // ex: navigation.navigate('CadastroClientes');
        console.log(`Navegar para o cadastro de: ${optionId}`);
        Alert.alert("Em desenvolvimento", `A tela para gerenciar ${optionId} ainda não foi criada.`);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Cadastros</Text>
                    <Text style={styles.headerSubtitle}>Gerencie clientes, produtos e pagamentos</Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {cadastroOptions.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={styles.card}
                        onPress={() => handleOptionPress(option.id)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                            <option.icon size={28} color="white" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>{option.title}</Text>
                            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f3',
    },
    backButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.foreground,
    },
    content: {
        padding: theme.spacing.lg,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: theme.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.lg,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    cardSubtitle: {
        fontSize: 14,
        color: theme.colors.foreground,
        marginTop: 2,
    },
});