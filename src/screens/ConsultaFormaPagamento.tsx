// src/screens/ConsultaFormaPagamento.tsx

import { ArrowLeft, CreditCard, Search } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../constants/config";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";
import type { FormaPagamento } from "../types/interfaces";

type ConsultaFormaPagamentoProps = {
  navigation: {
    goBack: () => void;
  };
};

export function ConsultaFormaPagamento({
  navigation,
}: ConsultaFormaPagamentoProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [filteredFormas, setFilteredFormas] = useState<FormaPagamento[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // --- BUSCA DADOS NA API ---
  const fetchFormasPagamento = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/formas-pagamento`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar formas de pagamento");
      }

      const data = await response.json();
      // Garante que seja um array
      const lista = Array.isArray(data) ? data : data.data || [];

      setFormasPagamento(lista);
      setFilteredFormas(lista);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar as formas de pagamento.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFormasPagamento();
  }, [fetchFormasPagamento]);

  // --- FILTRO LOCAL ---
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredFormas(formasPagamento);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = formasPagamento.filter((fp) =>
        fp.nome.toLowerCase().includes(lowerText)
      );
      setFilteredFormas(filtered);
    }
  };

  // --- ALTERAR STATUS (INATIVAR/ATIVAR) ---
  const handleToggleStatus = async (item: FormaPagamento) => {
    if (togglingId === item.id) return; // Evita cliques duplos

    const novoStatus = item.status === "Ativo" ? "Inativo" : "Ativo";
    const confirmMessage = `Deseja realmente alterar o status para ${novoStatus}?`;

    Alert.alert("Alterar Status", confirmMessage, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          setTogglingId(item.id);
          try {
            // Assume que a API aceita PUT na rota /formas-pagamento/:id com o campo status
            const response = await fetch(
              `${API_URL}/formas-pagamento/${item.id}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: novoStatus,
                  // Envia outros campos se necessário pela sua API,
                  // mas geralmente PATCH/PUT aceita parcial ou mesclamos aqui:
                  nome: item.nome,
                  aceitaParcelamento: item.aceitaParcelamento,
                }),
              }
            );

            if (!response.ok) {
              const err = await response.json();
              throw new Error(err.message || "Erro ao atualizar status");
            }

            // Atualiza a lista localmente para refletir a mudança instantaneamente
            const updatedList = formasPagamento.map((fp) =>
              fp.id === item.id ? { ...fp, status: novoStatus } : fp
            );
            setFormasPagamento(updatedList);
            // Re-aplica o filtro se houver busca
            if (searchQuery) {
              setFilteredFormas(
                updatedList.filter((fp) =>
                  fp.nome.toLowerCase().includes(searchQuery.toLowerCase())
                )
              );
            } else {
              setFilteredFormas(updatedList);
            }
          } catch (error: any) {
            Alert.alert("Erro", error.message);
          } finally {
            setTogglingId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Formas de Pagamento</Text>
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
            placeholder="Buscar forma de pagamento..."
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
            {filteredFormas.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhuma forma de pagamento encontrada.
              </Text>
            ) : (
              filteredFormas.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    item.status !== "Ativo" && styles.itemInativo,
                  ]}
                >
                  <View style={styles.infoContainer}>
                    <View
                      style={[
                        styles.iconContainer,
                        item.status !== "Ativo" && { backgroundColor: "#DDD" },
                      ]}
                    >
                      <CreditCard size={24} color="white" />
                    </View>

                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle}>{item.nome}</Text>
                      <Text style={styles.cardSubtitle}>
                        Parcelamento: {item.aceitaParcelamento ? "Sim" : "Não"}
                      </Text>

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                item.status === "Ativo"
                                  ? "green"
                                  : theme.colors.destructive,
                            },
                          ]}
                        />
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Switch de Status */}
                  <View style={styles.actionContainer}>
                    {togglingId === item.id ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                      />
                    ) : (
                      <Switch
                        trackColor={{
                          false: "#767577",
                          true: theme.colors.secondary,
                        }}
                        thumbColor={
                          item.status === "Ativo"
                            ? theme.colors.primary
                            : "#f4f3f4"
                        }
                        onValueChange={() => handleToggleStatus(item)}
                        value={item.status === "Ativo"}
                      />
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
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
    paddingBottom: 40,
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
  itemInativo: {
    borderLeftColor: theme.colors.foreground,
    opacity: 0.8,
    backgroundColor: "#FAFAFA",
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
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
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
  actionContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 10,
  },
});
