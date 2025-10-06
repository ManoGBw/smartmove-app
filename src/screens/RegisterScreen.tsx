import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { theme } from '../theme/colors';

// Tipagem para as props de navegação
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

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRegister = () => {
        console.log('Registrando usuário:', formData);
        navigation.navigate('Login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
                        <ArrowLeft size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Criar Conta</Text>
                        <Text style={styles.headerSubtitle}>Preencha seus dados para começar</Text>
                    </View>
                </View>

                {/* Formulário */}
                <Card>
                    <CardContent>
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

                        {/* Telefone */}
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
                                    {showPassword ? (
                                        <EyeOff color={theme.colors.foreground} size={16} />
                                    ) : (
                                        <Eye color={theme.colors.foreground} size={16} />
                                    )}
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
                                    {showConfirmPassword ? (
                                        <EyeOff color={theme.colors.foreground} size={16} />
                                    ) : (
                                        <Eye color={theme.colors.foreground} size={16} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Button
                            title="Criar Conta"
                            onPress={handleRegister}
                            style={{ marginTop: theme.spacing.lg }}
                        />

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

const styles = StyleSheet.create({
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