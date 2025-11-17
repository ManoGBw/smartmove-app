import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator, // Importe o ActivityIndicator para o loading
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";

type LoginScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atenção", "Por favor, preencha o e-mail e a senha.");
      return;
    }

    setLoading(true);
    try {
      // Apenas chame a função login do contexto. É só isso!
      // A lógica de API, salvar token, etc., está toda dentro dela.
      await login(email, password);
      // Se o login for bem-sucedido, o AppNavigator fará o redirecionamento automático.
    } catch (error) {
      // O AuthContext já mostra o alerta de erro.
      // Podemos adicionar um console.log aqui para depuração, se quisermos.
      console.log("A tela de login recebeu uma notificação de erro.");
    } finally {
      setLoading(false);
    }
  };

  // A função de navegação para outras telas não muda
  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
  };

  // 4. O SEU CÓDIGO VISUAL (JSX) CONTINUA EXATAMENTE O MESMO
  // A única mudança é no botão "Entrar" para mostrar o loading.
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logoImage}
          />
          <Text style={styles.subtitle}>Faça login para continuar</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputContainer}>
              <Mail
                color={theme.colors.foreground}
                size={16}
                style={styles.icon}
              />
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputContainer}>
              <Lock
                color={theme.colors.foreground}
                size={16}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={theme.colors.foreground}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff color={theme.colors.foreground} size={16} />
                ) : (
                  <Eye color={theme.colors.foreground} size={16} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigateTo("ForgotPassword")}>
            <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerTextContainer}>
            <Text style={styles.footerText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigateTo("Register")}>
              <Text style={[styles.footerText, styles.link]}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// 5. SEU STYLESHEET TAMBÉM NÃO MUDA
// Apenas certifique-se de que o estilo buttonDisabled existe.
const styles = StyleSheet.create({
  // ... (cole todos os seus estilos aqui, exatamente como estavam antes)
  container: {
    flex: 1,
    backgroundColor: "#f0f0f3",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  content: {
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoImage: {
    marginTop: 60,
    width: 350,
    height: 250,
    resizeMode: "contain",
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.foreground,
    marginTop: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: theme.radius.md,
    height: 55,
    borderWidth: 1,
    borderColor: "#E8E8EB",
  },
  icon: {
    marginLeft: 15,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.primary,
    fontSize: 16,
    height: "100%",
  },
  forgotPassword: {
    textAlign: "right",
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary,
    height: 55,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonDisabled: {
    backgroundColor: theme.colors.foreground,
  },
  buttonText: {
    color: theme.colors.primaryForeground,
    fontSize: 18,
    fontWeight: "bold",
  },
  footerTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: 16,
    color: theme.colors.foreground,
  },
  link: {
    color: theme.colors.accent,
    fontWeight: "bold",
  },
});
