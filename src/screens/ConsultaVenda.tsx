import {
  ArrowLeft,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
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
import type { Venda } from "../types/interfaces";

type ConsultaVendaProps = {
  navigation: {
    addListener: (event: string, callback: () => void) => () => void;
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
};

export function ConsultaVenda({ navigation }: ConsultaVendaProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filteredVendas, setFilteredVendas] = useState<Venda[]>([]);

  // --- BUSCA DADOS NA API ---
  const fetchVendas = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/vendas`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar vendas");
      }

      const data = await response.json();
      const lista = Array.isArray(data) ? data : data.data || [];

      // Ordenar por data (mais recente primeiro)
      // Assegure-se que sua API retorna o campo 'data' em formato ISO ou compatível
      const listaOrdenada = lista.sort(
        (a: Venda, b: Venda) =>
          new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      setVendas(listaOrdenada);
      setFilteredVendas(listaOrdenada);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar o histórico de vendas.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Recarrega a lista ao focar na tela (útil se você editou uma venda e voltou)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchVendas);
    return unsubscribe;
  }, [navigation, fetchVendas]);

  // --- FILTRO LOCAL ---
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredVendas(vendas);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = vendas.filter(
        (venda) =>
          venda.cliente?.nome.toLowerCase().includes(lowerText) ||
          venda.id.toString().includes(lowerText)
      );
      setFilteredVendas(filtered);
    }
  };

  // Formata data para PT-BR
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Formata moeda
  const formatCurrency = (value: string | number) => {
    const num = Number(value);
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Histórico de Vendas</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <Search
            size={20}
            color={theme.colors.foreground}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por cliente ou Nº..."
            placeholderTextColor={theme.colors.foreground}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Lista */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.listContainer}>
            {filteredVendas.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma venda encontrada.</Text>
            ) : (
              filteredVendas.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    item.status === "CANCELADA" && styles.itemCancelado,
                  ]}
                >
                  {/* Ícone e Infos */}
                  <View style={styles.infoContainer}>
                    <View
                      style={[
                        styles.iconContainer,
                        item.status === "CANCELADA" && {
                          backgroundColor: theme.colors.destructive,
                        },
                      ]}
                    >
                      <ShoppingCart size={24} color="white" />
                    </View>

                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle}>Venda #{item.id}</Text>
                      <Text style={styles.cardDate}>
                        {formatDate(item.data)}
                      </Text>

                      <Text style={styles.cardSubtitle}>
                        {item.cliente?.nome || "Cliente não identificado"}
                      </Text>
                      <Text style={styles.cardValue}>
                        {formatCurrency(item.valorTotal)}
                      </Text>

                      {/* Badge de Status */}
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                item.status === "CONCLUIDA" ||
                                item.status === "APROVADA" // Ajuste conforme retorno da API
                                  ? "green"
                                  : item.status === "CANCELADA"
                                  ? "red"
                                  : "orange",
                            },
                          ]}
                        />
                        <Text style={styles.statusText}>
                          {item.status || "CONCLUIDA"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Ações */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      navigation.navigate("RealizarVenda", {
                        venda: item, // Passa o objeto venda para edição/visualização
                      })
                    }
                  >
                    <Pencil size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Botão Flutuante (FAB) para Nova Venda */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("RealizarVenda")}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 40,
    fontSize: 16,
  },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  itemCancelado: {
    borderLeftColor: theme.colors.destructive,
    opacity: 0.8,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  cardDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },

  actionButton: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginLeft: 8,
  },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
