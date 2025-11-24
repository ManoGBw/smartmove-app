import {
  ArrowLeft,
  Ban,
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

  // ... código anterior

  // --- CANCELAR VENDA ---
  const handleCancelVenda = async (id: number) => {
    Alert.alert(
      "Cancelar Venda",
      "Tem certeza que deseja cancelar esta venda? O estoque será devolvido.",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              // CORREÇÃO: Ajustado para a rota que você forneceu (PATCH /vendas/:id)
              // Antes estava /vendas/${id}/cancelar
              const response = await fetch(`${API_URL}/vendas/${id}`, {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao cancelar venda");
              }

              Alert.alert("Sucesso", "Venda cancelada com sucesso!");

              // Atualiza a lista localmente para refletir a mudança
              const updatedVendas = vendas.map((v) =>
                v.id === id ? { ...v, status: "CANCELADA" } : v
              );
              setVendas(updatedVendas);
              setFilteredVendas(
                searchQuery
                  ? updatedVendas.filter(
                      (v) =>
                        v.cliente?.nome
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        v.id.toString().includes(searchQuery)
                    )
                  : updatedVendas
              );
            } catch (error: any) {
              Alert.alert("Erro", error.message);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: string | number) => {
    const num = Number(value);
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Histórico de Vendas</Text>
          <View style={{ width: 24 }} />
        </View>

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
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={styles.cardTitle}>Venda #{item.id}</Text>
                        <Text style={styles.cardDate}>
                          {formatDate(item.data)}
                        </Text>
                      </View>

                      <Text style={styles.cardSubtitle}>
                        {item.cliente?.nome || "Cliente não identificado"}
                      </Text>
                      <Text style={styles.cardValue}>
                        {formatCurrency(item.valorTotal)}
                      </Text>

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                item.status === "CONCLUIDA" ||
                                item.status === "APROVADA"
                                  ? "green"
                                  : item.status === "CANCELADA"
                                  ? theme.colors.destructive
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

                  {/* Container de Ações */}
                  <View style={styles.actionsContainer}>
                    {/* Botão Editar/Ver */}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        navigation.navigate("RealizarVenda", { venda: item })
                      }
                    >
                      <Pencil size={20} color={theme.colors.primary} />
                    </TouchableOpacity>

                    {/* Botão Cancelar (Só aparece se não estiver cancelada) */}
                    {item.status !== "CANCELADA" && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancelVenda(item.id)}
                      >
                        <Ban size={20} color={theme.colors.destructive} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

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
    opacity: 0.7,
    backgroundColor: "#FFF5F5", // Fundo levemente avermelhado
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

  // Novos estilos para os botões de ação
  actionsContainer: {
    flexDirection: "column",
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#FEE2E2", // Vermelho bem claro
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
