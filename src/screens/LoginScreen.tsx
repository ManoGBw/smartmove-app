import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme/colors'; // Importando nosso tema


// Tipagem para as props de navegação
type LoginScreenProps = {
    navigation: {
        navigate: (screen: string) => void;
    };
};

export function LoginScreen({ navigation }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        // A lógica permanece a mesma!
        // Em um app real, aqui você faria a chamada para a API
        console.log('Login com:', email, password);
        // Navegue para o Dashboard (quando ele for criado)
        // navigation.navigate('Dashboard'); 
    };

    // Usamos navigation.navigate ao invés da prop onNavigate
    const navigateTo = (screen: string) => {
        navigation.navigate(screen);
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo/Título */}
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logoImage}
                    />
                    <Text style={styles.subtitle}>Faça login para continuar</Text>
                </View>

                {/* Formulário de Login */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Entrar</Text>

                    {/* Campo de E-mail */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-mail</Text>
                        <View style={styles.inputContainer}>
                            <Mail color={theme.colors.foreground} size={16} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="seu@email.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={theme.colors.foreground}
                            />
                        </View>
                    </View>

                    {/* Campo de Senha */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Senha</Text>
                        <View style={styles.inputContainer}>
                            <Lock color={theme.colors.foreground} size={16} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor={theme.colors.foreground}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                {showPassword ? (
                                    <EyeOff color={theme.colors.foreground} size={16} />
                                ) : (
                                    <Eye color={theme.colors.foreground} size={16} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => navigateTo('ForgotPassword')}>
                        <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Entrar</Text>
                    </TouchableOpacity>

                    <View style={styles.footerTextContainer}>
                        <Text style={styles.footerText}>Não tem uma conta?{' '}</Text>
                        <TouchableOpacity onPress={() => navigateTo('Register')}>
                            <Text style={[styles.footerText, styles.link]}>Criar conta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

// Em React Native, usamos StyleSheet.create para otimizações
// SUBSTITUA TODO O SEU OBJETO styles POR ESTE:

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f3', // Um cinza um pouco mais claro que o anterior
        justifyContent: 'center',
        padding: theme.spacing.xl, // Aumentar o padding geral
    },
    content: {
        width: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30, // Aumentar o espaço antes do card
    },
    titleContainer: {
        alignItems: 'center',
    },
    logoImage: {
        marginTop: 60,
        width: 350,
        height: 250,
        resizeMode: 'contain',
        marginBottom: 1,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.foreground,
        marginTop: theme.spacing.md,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 20, // Cantos mais arredondados
        padding: theme.spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, // Sombra mais sutil
        shadowRadius: 15,
        elevation: 8,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: 30, // Mais espaço abaixo do título "Entrar"
    },
    inputGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.primary,
        marginBottom: theme.spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff', // Fundo branco
        borderRadius: theme.radius.md,
        height: 55, // Um pouco mais alto
        borderWidth: 1,
        borderColor: '#E8E8EB', // Borda sutil
    },
    icon: {
        marginLeft: 15, // Mais espaço para o ícone
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
    },
    input: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        color: theme.colors.primary,
        fontSize: 16,
        height: '100%',
    },
    forgotPassword: {
        textAlign: 'right',
        color: theme.colors.accent,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: theme.spacing.xl,
    },
    button: {
        backgroundColor: theme.colors.primary,
        height: 55,
        borderRadius: theme.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3, // Sombra leve para o botão
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
    },
    buttonText: {
        color: theme.colors.primaryForeground,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerTextContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.xl,
    },
    footerText: {
        fontSize: 16,
        color: theme.colors.foreground,
    },
    link: {
        color: theme.colors.accent,
        fontWeight: 'bold',
    },
});