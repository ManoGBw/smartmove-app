import { ArrowLeft, CheckCircle, Key, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { theme } from "../theme/colors";

import { API_URL } from "../constants/config";

type ForgotPasswordScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

export function ForgotPasswordScreen({
  navigation,
}: ForgotPasswordScreenProps) {
  // Estados para controlar os inputs
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Estado para controlar qual "tela" mostrar: 1 = E-mail, 2 = Código/Senha
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
  };

  // 1. Função para solicitar o envio do código
  const handleSendEmail = async () => {
    if (!email) return;
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/usuarios/esqueci-minha-senha/enviar-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Código enviado para o seu e-mail!");
        setStep(2); // Avança para a etapa de digitar o código
      } else {
        Alert.alert("Erro", data.message || "Erro ao enviar e-mail.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Função para confirmar o código e trocar a senha
  const handleResetPassword = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> => {
    if (!code || !newPassword) {
      Alert.alert("Atenção", "Preencha o código e a nova senha.");
      return;
    }
    setLoading(true);

    try {
      // ATENÇÃO: Verifique se a rota no seu backend é exatamente esta
      const response = await fetch(
        `${API_URL}/usuarios/esqueci-minha-senha/confirmar-codigo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Envia o objeto exato que seu usuario.service.js espera
          body: JSON.stringify({
            email: email,
            codigo: code,
            novaSenha: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Senha alterada com sucesso!", [
          { text: "OK", onPress: () => navigateTo("Login") },
        ]);
      } else {
        Alert.alert("Erro", data.message || "Erro ao redefinir senha.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (step === 2 ? setStep(1) : navigateTo("Login"))}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Recuperar Senha</Text>
            <Text style={styles.headerSubtitle}>
              {step === 1 ? "Informe seu e-mail" : "Confirme o código"}
            </Text>
          </View>
        </View>

        <Card>
          <CardContent>
            {/* ETAPA 1: DIGITAR E-MAIL */}
            {step === 1 && (
              <>
                <View style={styles.iconContainer}>
                  <Mail size={32} color={theme.colors.primaryForeground} />
                </View>
                <Text style={styles.infoText}>
                  Informe o e-mail da sua conta e enviaremos um código para
                  redefinir sua senha.
                </Text>

                <Input
                  label="E-mail"
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  Icon={Mail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Button
                  onPress={handleSendEmail}
                  title={loading ? "Enviando..." : "Enviar Código"}
                  disabled={!email || loading}
                  style={{ marginTop: theme.spacing.md }}
                />
              </>
            )}

            {/* ETAPA 2: DIGITAR CÓDIGO E NOVA SENHA */}
            {step === 2 && (
              <>
                <View style={styles.iconContainer}>
                  {/* Ícone de chave ou cadeado para indicar troca de senha */}
                  <Key size={32} color={theme.colors.primaryForeground} />
                </View>
                <Text style={styles.infoText}>
                  Insira o código enviado para
                  <Text style={{ fontWeight: "bold" }}> {email} </Text>e sua
                  nova senha.
                </Text>

                <Input
                  label="Código de Verificação"
                  placeholder="Ex: 123456"
                  value={code}
                  onChangeText={setCode}
                  Icon={CheckCircle}
                  keyboardType="numeric"
                />

                <Input
                  label="Nova Senha"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  Icon={Lock}
                  secureTextEntry
                />

                <Button
                  onPress={() => handleResetPassword(email, code, newPassword)}
                  title={loading ? "Alterando..." : "Alterar Senha"}
                  disabled={!code || !newPassword || loading}
                  style={{ marginTop: theme.spacing.md }}
                />
              </>
            )}

            <TouchableOpacity
              onPress={() => navigateTo("Login")}
              style={styles.backToLoginLink}
            >
              <Text style={styles.backToLoginText}>
                Cancelar e voltar ao login
              </Text>
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
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  content: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "bold",
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
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    textAlign: "center",
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xl,
    fontSize: 14,
    lineHeight: 20,
  },
  backToLoginLink: {
    alignSelf: "center",
    marginTop: theme.spacing.lg,
  },
  backToLoginText: {
    color: theme.colors.secondary,
    fontWeight: "500",
    fontSize: 14,
  },
});
