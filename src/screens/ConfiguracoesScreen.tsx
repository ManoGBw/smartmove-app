import { ArrowLeft, Building2, MapPin, Save } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../constants/config"; //
import { useAuth } from "../context/AuthContext"; //
import { theme } from "../theme/colors"; //

type ConfiguracoesScreenProps = {
  navigation: {
    goBack: () => void;
  };
};

export function ConfiguracoesScreen({ navigation }: ConfiguracoesScreenProps) {
  const { user, token } = useAuth();

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [endereco, setEndereco] = useState("");
  const [raioKm, setRaioKm] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/usuarios/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          console.log("Configurações carregadas com sucesso!");
          const data = await response.json();
          const usuario = data;

          setNomeEmpresa(usuario.nomeEmpresa || "");
          setEndereco(usuario.endereco || "");

          if (usuario.configuracao && usuario.configuracao.alcanceRaio) {
            setRaioKm(String(usuario.configuracao.alcanceRaio));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, [user, token]);

  const handleSave = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const raioValue = raioKm ? parseFloat(raioKm.replace(",", ".")) : null;

      const payload = {
        nomeEmpresa: nomeEmpresa,
        endereco: endereco,
        alcanceRaio: raioValue,
      };

      const response = await fetch(`${API_URL}/usuarios/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Falha ao atualizar configurações.");
      }

      Alert.alert("Sucesso", "Configurações atualizadas com sucesso!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.colors.primaryForeground} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Configurações</Text>
          <Text style={styles.headerSubtitle}>Preferências do sistema</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Card da Empresa e Endereço */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Building2 size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Dados da Empresa</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Empresa</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Minha Distribuidora Ltda"
                value={nomeEmpresa}
                onChangeText={setNomeEmpresa}
              />
            </View>

            {/* Novo Campo de Endereço */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Endereço Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Rua, Número, Bairro, Cidade - UF"
                value={endereco}
                onChangeText={setEndereco}
                multiline={true}
              />
              <Text style={styles.helperText}>
                Este endereço será utilizado como ponto de partida para as rotas
                quando não informado outra localização.
              </Text>
            </View>
          </View>

          {/* Card de Logística */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Logística e Rotas</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Raio de Sugestão (km)</Text>
              <Text style={styles.helperText}>
                Distância máxima para sugerir clientes próximos ao criar rotas.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 5.5"
                value={raioKm}
                onChangeText={setRaioKm}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerButton: { padding: 4 },
  headerTitle: {
    color: theme.colors.primaryForeground,
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: theme.colors.accent,
    fontSize: 12,
  },

  content: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  inputGroup: { marginBottom: 12 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#DDD",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  disabledButton: { opacity: 0.7 },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
