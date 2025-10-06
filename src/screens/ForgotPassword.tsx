import { ArrowLeft, CheckCircle, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input'; // Vamos reutilizar/criar esses componentes
import { theme } from '../theme/colors'; // Nosso tema de cores

// Tipagem para as props de navegação
type ForgotPasswordScreenProps = {
    navigation: {
        navigate: (screen: string) => void;
    };
};

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleSendEmail = () => {
        // A lógica de negócio permanece a mesma
        console.log('Enviando e-mail de recuperação para:', email);
        setEmailSent(true);
    };

    const navigateTo = (screen: string) => {
        navigation.navigate(screen);
    };

    // ----- TELA DE SUCESSO -----
    if (emailSent) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Card>
                        <CardContent style={styles.successCardContent}>
                            <View style={styles.iconContainerSuccess}>
                                <CheckCircle size={32} color={theme.colors.primaryForeground} />
                            </View>
                            <Text style={styles.titleSuccess}>E-mail enviado!</Text>
                            <Text style={styles.subtitleSuccess}>
                                Enviamos um link para recuperação de senha para seu e-mail. Verifique sua caixa de entrada e spam.
                            </Text>
                            <Button onPress={() => navigateTo('Login')} title="Voltar ao Login" />
                        </CardContent>
                    </Card>
                </View>
            </SafeAreaView>
        );
    }

    // ----- TELA DO FORMULÁRIO -----
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigateTo('Login')} style={styles.backButton}>
                        <ArrowLeft size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Recuperar Senha</Text>
                        <Text style={styles.headerSubtitle}>Digite seu e-mail para continuar</Text>
                    </View>
                </View>

                {/* Formulário */}
                <Card>
                    <CardContent>
                        <View style={styles.iconContainer}>
                            <Mail size={32} color={theme.colors.primaryForeground} />
                        </View>
                        <Text style={styles.infoText}>
                            Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
                        </Text>

                        <Input
                            label="E-mail"
                            placeholder="seu@email.com"
                            value={email}
                            onChangeText={setEmail}
                            Icon={Mail}
                            keyboardType="email-address"
                        />

                        <Button
                            onPress={handleSendEmail}
                            title="Enviar Link de Recuperação"
                            disabled={!email}
                            style={{ marginTop: theme.spacing.md }}
                        />

                        <TouchableOpacity onPress={() => navigateTo('Login')} style={styles.backToLoginLink}>
                            <Text style={styles.backToLoginText}>Voltar ao login</Text>
                        </TouchableOpacity>
                    </CardContent>
                </Card>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    content: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    backButton: {
        backgroundColor: theme.colors.card,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
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
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: theme.spacing.lg,
    },
    infoText: {
        textAlign: 'center',
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xl,
        fontSize: 14,
        lineHeight: 20,
    },
    backToLoginLink: {
        alignSelf: 'center',
        marginTop: theme.spacing.lg,
    },
    backToLoginText: {
        color: theme.colors.secondary,
        fontWeight: '500',
        fontSize: 14,
    },
    // Estilos para a tela de sucesso
    successCardContent: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    iconContainerSuccess: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    titleSuccess: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: theme.spacing.sm,
    },
    subtitleSuccess: {
        fontSize: 14,
        color: theme.colors.foreground,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        lineHeight: 20,
    },
});