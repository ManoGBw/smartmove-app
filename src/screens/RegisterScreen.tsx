import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Card, CardContent } from '../components/ui/Card';
import { theme } from '../theme/colors';

// URL base da sua API
const API_URL = 'http://72.60.12.191:3006/api/v1';

type RegisterScreenProps = {
    navigation: {
        navigate: (screen: string) => void;
    };
};

export function RegisterScreen({ navigation }: RegisterScreenProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false); // Estado de carregamento

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // --- FUNÇÃO DE REGISTRO ATUALIZADA ---
    const handleRegister = async () => {
        // 1. Validação dos campos
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Atenção', 'As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            // 2. Monta a requisição para a API
            const response = await fetch(`${API_URL}/usuarios/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Enviando apenas os campos que a API espera por enquanto
                    email: formData.email.toLowerCase(),
                    senha: formData.password,
                    // Futuramente você pode enviar outros campos, como o nome:
                    // nome: formData.name, 
                }),
            });

            const data = await response.json();

            // 3. Verifica se a API retornou um erro
            if (!response.ok) {
                throw new Error(data.message || 'Não foi possível criar a conta.');
            }

            // 4. Se o cadastro for bem-sucedido
            Alert.alert(
                'Sucesso!',
                'Sua conta foi criada. Você será redirecionado para a tela de login.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );

        } catch (error: any) {
            // 5. Se qualquer erro ocorrer, exibe um alerta
            console.error('Erro no cadastro:', error);
            Alert.alert('Erro no Cadastro', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
                        <ArrowLeft size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Criar Conta</Text>
                        <Text style={styles.headerSubtitle}>Preencha seus dados para começar</Text>
                    </View>
                </View>

                <Card>
                    <CardContent>
                        {/* --- Os campos do formulário continuam os mesmos --- */}
                        {/* Nome Completo */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome completo</Text>
                            <View style={styles.inputContainer}>
                                <User color={theme.colors.foreground} size={16} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Seu nome"
                                    value={formData.name}
                                    onChangeText={(text) => handleInputChange('name', text)}
                                    placeholderTextColor={theme.colors.foreground}
                                />
                            </View>
                        </View>
                        {/* E-mail */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-mail</Text>
                            <View style={styles.inputContainer}>
                                <Mail color={theme.colors.foreground} size={16} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChangeText={(text) => handleInputChange('email', text)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor={theme.colors.foreground}
                                />
                            </View>
                        </View>
                        {/* Telefone (opcional pela API, mas mantemos no form) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Telefone</Text>
                            <View style={styles.inputContainer}>
                                <Phone color={theme.colors.foreground} size={16} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="(11) 99999-9999"
                                    value={formData.phone}
                                    onChangeText={(text) => handleInputChange('phone', text)}
                                    keyboardType="phone-pad"
                                    placeholderTextColor={theme.colors.foreground}
                                />
                            </View>
                        </View>
                        {/* Senha */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Senha</Text>
                            <View style={styles.inputContainer}>
                                <Lock color={theme.colors.foreground} size={16} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChangeText={(text) => handleInputChange('password', text)}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor={theme.colors.foreground}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    {showPassword ? <EyeOff color={theme.colors.foreground} size={16} /> : <Eye color={theme.colors.foreground} size={16} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* Confirmar Senha */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirmar senha</Text>
                            <View style={styles.inputContainer}>
                                <Lock color={theme.colors.foreground} size={16} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                                    secureTextEntry={!showConfirmPassword}
                                    placeholderTextColor={theme.colors.foreground}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                    {showConfirmPassword ? <EyeOff color={theme.colors.foreground} size={16} /> : <Eye color={theme.colors.foreground} size={16} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* --- Botão de Registro Atualizado --- */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.buttonText}>Criar Conta</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footerTextContainer}>
                            <Text style={styles.footerText}>Já tem uma conta?{' '}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={[styles.footerText, styles.link]}>Fazer login</Text>
                            </TouchableOpacity>
                        </View>
                    </CardContent>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

// Adicione os estilos do botão ao seu StyleSheet
const styles = StyleSheet.create({
    // ... todos os seus estilos anteriores ...
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
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
    inputGroup: {
        marginBottom: theme.spacing.md,
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
    eyeIcon: {
        position: 'absolute',
        right: 12,
        padding: 4,
    },
    button: { // Estilo para o TouchableOpacity
        backgroundColor: theme.colors.primary,
        height: 55,
        borderRadius: theme.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.foreground,
    },
    buttonText: {
        color: theme.colors.primaryForeground,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerTextContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
    },
    footerText: {
        fontSize: 14,
        color: theme.colors.foreground,
    },
    link: {
        color: theme.colors.accent,
        fontWeight: '500',
    },
});