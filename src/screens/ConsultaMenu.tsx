import {
  ArrowLeft,
  FileText,
  Search,
  ShoppingCart,
  Users,
} from "lucide-react-native";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme/colors";

type ConsultaMenuProps = {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
};

// Opções para o novo menu de consulta
const consultaOptions = [
  // ... (outras opções)
  {
    id: "clientes",
    title: "Consultar Cliente",
    subtitle: "Buscar clientes por nome, CPF...",
    icon: Users,
    color: "#A5A4E0", // Cor secundária
  },
  {
    id: "vendas",
    title: "Consultar Venda",
    subtitle: "Histórico de vendas",
    icon: ShoppingCart,
    color: "#2E1E43", // Cor primária
  },
  {
    id: "orcamentos",
    title: "Consultar Orçamento",
    subtitle: "Buscar orçamentos gerados",
    icon: FileText,
    color: "#A5A4E0", // Cor secundária
  },
];

export function ConsultaMenu({ navigation }: ConsultaMenuProps) {
  const handleOptionPress = (optionId: string) => {
    if (optionId === "clientes") {
      navigation.navigate("ConsultaCliente"); // <--- ATUALIZADO AQUI
    } else if (optionId === "vendas") {
      // Futuramente: navigation.navigate("ConsultaVenda");
      Alert.alert(
        "Em desenvolvimento",
        "A tela de consulta de vendas está em construção."
      );
    } else if (optionId === "orcamentos") {
      // Futuramente: navigation.navigate("ConsultaOrcamento");
      Alert.alert(
        "Em desenvolvimento",
        "A tela de consulta de orçamentos está em construção."
      );
    }
  };

  return (
    // ... (o resto do JSX permanece igual)
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerIconContainer}>
          <Search
            size={20}
            color={theme.colors.primaryForeground}
            style={{ marginRight: 8 }}
          />
          <View>
            <Text style={styles.headerTitle}>Consultas</Text>
            <Text style={styles.headerSubtitle}>
              Busque clientes, vendas e orçamentos
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {consultaOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.card}
            onPress={() => handleOptionPress(option.id)}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: option.color }]}
            >
              <option.icon size={28} color="white" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ... (os estilos permanecem os mesmos)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f3",
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primaryForeground,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  content: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: "white",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.foreground,
    marginTop: 2,
  },
});
