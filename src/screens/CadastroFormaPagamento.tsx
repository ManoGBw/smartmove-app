import { ArrowLeft, CreditCard, Save } from "lucide-react-native";
import React, { useState } from "react";
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
} from "react-native";
import { theme } from "../theme/colors";

// --- Componente customizado para simular um Radio Button ---
interface RadioOptionProps {
  label: string;
  value: string;
  selectedValue: string;
  onSelect: (value: string) => void;
}
const RadioOption = ({
  label,
  value,
  selectedValue,
  onSelect,
}: RadioOptionProps) => {
  const isSelected = value === selectedValue;
  return (
    <TouchableOpacity
      style={styles.radioContainer}
      onPress={() => onSelect(value)}
    >
      <View
        style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}
      >
        {isSelected && <View style={styles.radioDot} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
};
// -----------------------------------------------------------

type CadastroProps = {
  navigation: { goBack: () => void };
};

export function CadastroFormaPagamento({ navigation }: CadastroProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "a vista",
    permiteParcelamento: "nao",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.descricao) {
      Alert.alert("Atenção", "O campo Descrição é obrigatório.");
      return;
    }
    setLoading(true);
    console.log("Salvando forma de pagamento:", formData);
    // Simula uma chamada de API
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Sucesso", "Forma de pagamento salva! (simulação)");
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
          <CreditCard size={20} color={theme.colors.primaryForeground} />
          <Text style={styles.headerTitle}>Forma de Pagamento</Text>
        </View>
      </View>

      {/* Formulário Rôlavel */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Cartão de Crédito, Dinheiro..."
              placeholderTextColor={theme.colors.foreground}
              value={formData.descricao}
              onChangeText={(text) => handleInputChange("descricao", text)}
            />
          </View>

          {/* Tipo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo *</Text>
            <RadioOption
              label="À Vista"
              value="a vista"
              selectedValue={formData.tipo}
              onSelect={(v) => handleInputChange("tipo", v)}
            />
            <RadioOption
              label="À Prazo"
              value="a prazo"
              selectedValue={formData.tipo}
              onSelect={(v) => handleInputChange("tipo", v)}
            />
          </View>

          {/* Permite Parcelamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Permite Parcelamento *</Text>
            <RadioOption
              label="Sim"
              value="sim"
              selectedValue={formData.permiteParcelamento}
              onSelect={(v) => handleInputChange("permiteParcelamento", v)}
            />
            <RadioOption
              label="Não"
              value="nao"
              selectedValue={formData.permiteParcelamento}
              onSelect={(v) => handleInputChange("permiteParcelamento", v)}
            />
          </View>

          {/* Informação adicional */}
          {formData.tipo === "a vista" &&
            formData.permiteParcelamento === "sim" && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ℹ️ Formas de pagamento à vista geralmente não permitem
                  parcelamento.
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
              <Text style={styles.saveButtonText}>Salvar</Text>
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
  inputGroup: { marginBottom: 24 },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
    marginBottom: 12,
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
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: { borderColor: theme.colors.secondary },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.secondary,
  },
  radioLabel: { marginLeft: 12, fontSize: 16, color: theme.colors.primary },
  infoBox: {
    backgroundColor: "rgba(165, 164, 224, 0.1)",
    borderColor: "rgba(165, 164, 224, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  infoText: { fontSize: 14, color: theme.colors.foreground },
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
