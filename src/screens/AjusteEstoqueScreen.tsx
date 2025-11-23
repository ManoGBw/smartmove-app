// src/screens/AjusteEstoqueScreen.tsx

import { ArrowLeft, Package, Plus, Save } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../constants/config";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";

type AjusteEstoqueProps = {
  // Recebe ID e estoque como parâmetros de rota
  route: {
    params: {
      productId: number;
      productName: string;
      currentStock: number;
    };
  };
  navigation: {
    goBack: () => void;
  };
};

export function AjusteEstoqueScreen({ route, navigation }: AjusteEstoqueProps) {
  const { productId, productName, currentStock } = route.params;
  const { token } = useAuth();

  const [quantityToAdd, setQuantityToAdd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateStock = async () => {
    if (!quantityToAdd) {
      Alert.alert("Atenção", "Informe a quantidade a ser adicionada.");
      return;
    }

    const quantity = parseInt(quantityToAdd, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert(
        "Atenção",
        "A quantidade deve ser um número inteiro positivo."
      );
      return;
    }

    setLoading(true);
    const newStock = currentStock + quantity;

    try {
      const response = await fetch(`${API_URL}/produtos/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estoque: newStock,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Não foi possível atualizar o estoque."
        );
      }

      Alert.alert(
        "Sucesso!",
        `Estoque do produto "${productName}" atualizado para ${newStock}.`
      );
      navigation.goBack();
    } catch (error: any) {
      console.error("Erro ao atualizar estoque:", error);
      Alert.alert("Erro", error.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Ajuste de Estoque</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          <Text style={styles.productName}>{productName}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Estoque Atual:</Text>
            <Text style={styles.currentStockValue}>{currentStock}</Text>
          </View>

          {/* Adicionar ao estoque */}
          <View style={[styles.inputGroup, { marginTop: 20 }]}>
            <Text style={styles.label}>Quantidade a Adicionar</Text>
            <View style={styles.stockInputContainer}>
              <Plus
                size={20}
                color={theme.colors.foreground}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.stockInput}
                placeholder="Ex: 10"
                value={quantityToAdd}
                onChangeText={setQuantityToAdd}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Rodapé Fixo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleUpdateStock}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.secondaryForeground} />
          ) : (
            <>
              <Save size={20} color={theme.colors.secondaryForeground} />
              <Text style={styles.saveButtonText}>Salvar Entrada</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    padding: 15,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
    fontWeight: "500",
  },
  currentStockValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  stockInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: "#E8E8EB",
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  stockInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
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
