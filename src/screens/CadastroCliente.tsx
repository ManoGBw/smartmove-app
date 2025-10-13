import { ArrowLeft, Save, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";

const API_URL = "http://72.60.12.191:3006/api/v1";

type CadastroClienteProps = {
  navigation: {
    goBack: () => void;
  };
};

export function CadastroCliente({ navigation }: CadastroClienteProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    codigoBairro: "",
    nomeBairro: "",
    uf: "",
    telefone: "",
    email: "",
    status: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (
      !formData.nome ||
      !formData.endereco ||
      !formData.codigoBairro ||
      !formData.telefone
    ) {
      Alert.alert(
        "Atenção",
        "Por favor, preencha todos os campos marcados com *."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: formData.nome,
          bairroId: parseInt(formData.codigoBairro, 10),
          endereco: formData.endereco,
          UF: formData.uf,
          telefone: formData.telefone,
          email: formData.email,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível salvar o cliente.");
      }

      Alert.alert("Sucesso!", "Cliente cadastrado com sucesso.");
      navigation.goBack();
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const ufs = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ].map((uf) => ({ label: uf, value: uf }));

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
        <View style={styles.headerTitleContainer}>
          <User size={20} color={theme.colors.primaryForeground} />
          <Text style={styles.headerTitle}>Cadastro de Cliente</Text>
        </View>
      </View>

      {/* Formulário Rôlavel */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          {/* Seus campos de formulário continuam aqui... */}
          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome completo"
              value={formData.nome}
              onChangeText={(text) => handleInputChange("nome", text)}
            />
          </View>
          {/* Endereço */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o endereço completo"
              value={formData.endereco}
              onChangeText={(text) => handleInputChange("endereco", text)}
            />
          </View>
          {/* Bairro */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bairro *</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Código"
                value={formData.codigoBairro}
                onChangeText={(text) => handleInputChange("codigoBairro", text)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Nome do bairro"
                value={formData.nomeBairro}
                onChangeText={(text) => handleInputChange("nomeBairro", text)}
              />
            </View>
          </View>
          {/* UF*/}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>UF *</Text>
              <RNPickerSelect
                onValueChange={(value) => handleInputChange("uf", value)}
                items={ufs}
                placeholder={{ label: "Selecione...", value: null }}
                style={pickerSelectStyles}
                value={formData.uf}
              />
            </View>
          </View>
          {/* Telefone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone *</Text>
            <TextInput
              style={styles.input}
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChangeText={(text) => handleInputChange("telefone", text)}
              keyboardType="phone-pad"
            />
          </View>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="email@exemplo.com"
              value={formData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {/* Status */}
          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.label}>Status do Cliente</Text>
              <Text style={styles.switchLabel}>
                {formData.status ? "ATIVO" : "INATIVO"}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: theme.colors.secondary }}
              thumbColor={formData.status ? theme.colors.primary : "#f4f3f4"}
              onValueChange={(value) => handleInputChange("status", value)}
              value={formData.status}
            />
          </View>
        </View>
      </ScrollView>

      {/* Rodapé Fixo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.secondaryForeground} />
          ) : (
            <>
              <Save size={20} color={theme.colors.secondaryForeground} />
              <Text style={styles.saveButtonText}>Salvar Cliente</Text>
            </>
          )}
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    padding: 16,
    paddingTop: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: theme.colors.primaryForeground,
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: "#E8E8EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  row: {
    flexDirection: "row",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    padding: 16,
    borderRadius: 8,
  },
  switchLabel: { fontSize: 14, color: theme.colors.mutedForeground },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E8E8EB",
    padding: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.secondary,
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonDisabled: { backgroundColor: theme.colors.foreground },
  saveButtonText: {
    color: theme.colors.secondaryForeground,
    fontSize: 18,
    fontWeight: "bold",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { ...styles.input },
  inputAndroid: { ...styles.input },
});
