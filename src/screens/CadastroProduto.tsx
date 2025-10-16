// src/screens/CadastroProduto.tsx

import { ArrowLeft, Package, Save } from "lucide-react-native";
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
import { theme } from "../theme/colors";

type CadastroProdutoProps = {
  navigation: {
    goBack: () => void;
  };
};

export function CadastroProduto({ navigation }: CadastroProdutoProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    marca: "",
    referencia: "",
    valor: "",
    custo: "",
    estoque: "",
    status: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (field: "valor" | "custo", value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers === "") {
      handleInputChange(field, "");
      return;
    }
    const amount = parseFloat(numbers) / 100;
    const formatted = amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    handleInputChange(field, formatted);
  };

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    // Remove o separador de milhar e troca a vírgula por ponto
    const numberString = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(numberString) || 0;
  };

  const calculateProfitMargin = () => {
    const valor = parseCurrency(formData.valor);
    const custo = parseCurrency(formData.custo);
    if (valor > 0 && custo > 0 && valor > custo) {
      const margem = ((valor - custo) / valor) * 100;
      return `${margem.toFixed(1)}%`;
    }
    return "-";
  };

  const handleSave = async () => {
    console.log("Salvando produto:", formData);
    // Futuramente, a lógica da API virá aqui
    setLoading(true);
    // Simula uma chamada de API
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Sucesso", "Produto salvo! (simulação)");
      navigation.goBack();
    }, 1500);
  };

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
          <Package size={20} color={theme.colors.primaryForeground} />
          <Text style={styles.headerTitle}>Cadastro de Produto</Text>
        </View>
      </View>

      {/* Formulário Rôlavel */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Produto *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do produto"
              value={formData.nome}
              onChangeText={(text) => handleInputChange("nome", text)}
            />
          </View>

          {/* Marca e Referência */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Marca</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite a marca"
                value={formData.marca}
                onChangeText={(text) => handleInputChange("marca", text)}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Referência</Text>
              <TextInput
                style={styles.input}
                placeholder="Código"
                value={formData.referencia}
                onChangeText={(text) => handleInputChange("referencia", text)}
              />
            </View>
          </View>

          {/* Valor e Custo */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Valor de Venda *</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>R$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={formData.valor}
                  onChangeText={(text) => handleCurrencyChange("valor", text)}
                  placeholder="0,00"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Custo</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>R$</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={formData.custo}
                  onChangeText={(text) => handleCurrencyChange("custo", text)}
                  placeholder="0,00"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Estoque */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estoque Inicial *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.estoque}
              onChangeText={(text) => handleInputChange("estoque", text)}
              keyboardType="number-pad"
            />
          </View>

          {/* Status */}
          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.label}>Status do Produto</Text>
              <Text style={styles.switchLabel}>
                {formData.status ? "Ativo" : "Inativo"}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: theme.colors.secondary }}
              thumbColor={formData.status ? theme.colors.primary : "#f4f3f4"}
              onValueChange={(value) => handleInputChange("status", value)}
              value={formData.status}
            />
          </View>

          {/* Margem de Lucro */}
          {formData.valor && formData.custo && (
            <View style={styles.profitMarginContainer}>
              <Text style={styles.profitMarginText}>
                Margem de lucro:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {calculateProfitMargin()}
                </Text>
              </Text>
            </View>
          )}
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
              <Text style={styles.saveButtonText}>Salvar Produto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    padding: 16,
    paddingTop: 20,
  },
  headerButton: { padding: 8 },
  headerTitleContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    color: theme.colors.primaryForeground,
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: { padding: 16, paddingBottom: 100 },
  formCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  inputGroup: { marginBottom: 20 },
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
  row: { flexDirection: "row" },
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: "#E8E8EB",
    borderRadius: 8,
  },
  currencySymbol: {
    fontSize: 16,
    color: theme.colors.foreground,
    paddingLeft: 16,
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
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
  profitMarginContainer: {
    backgroundColor: "rgba(165, 164, 224, 0.1)",
    borderColor: "rgba(165, 164, 224, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  profitMarginText: { fontSize: 14, color: theme.colors.primary },
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
