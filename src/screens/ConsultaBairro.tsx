import { ArrowLeft, MapPin, Pencil, Plus, Search } from "lucide-react-native";
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
import type { Bairro } from "../types/interfaces";

type ConsultaBairroProps = {
  navigation: {
    addListener: (event: string, callback: () => void) => () => void;
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
};

export function ConsultaBairro({ navigation }: ConsultaBairroProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [filteredBairros, setFilteredBairros] = useState<Bairro[]>([]);

  // --- BUSCA DADOS NA API ---
  const fetchBairros = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bairros`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar bairros");
      }

      const data = await response.json();
      // Ajuste conforme o retorno da sua API (se vier paginado ou direto array)
      const lista = Array.isArray(data) ? data : data.data || [];

      setBairros(lista);
      setFilteredBairros(lista);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar a lista de bairros.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Recarrega a lista toda vez que a tela ganha foco (ex: voltou do cadastro)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchBairros();
    });
    return unsubscribe;
  }, [navigation, fetchBairros]);

  // --- FILTRO LOCAL ---
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredBairros(bairros);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = bairros.filter(
        (b) =>
          b.nome.toLowerCase().includes(lowerText) ||
          (b.municipio?.nome &&
            b.municipio.nome.toLowerCase().includes(lowerText))
      );
      setFilteredBairros(filtered);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consultar Bairros</Text>
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
            placeholder="Buscar por bairro ou cidade..."
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
            {filteredBairros.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum bairro encontrado.</Text>
            ) : (
              filteredBairros.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    item.status !== "ATIVO" && styles.itemInativo,
                  ]}
                >
                  {/* Ícone e Infos */}
                  <View style={styles.infoContainer}>
                    <View
                      style={[
                        styles.iconContainer,
                        item.status !== "ATIVO" && { backgroundColor: "#DDD" },
                      ]}
                    >
                      <MapPin size={24} color="white" />
                    </View>

                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle}>{item.nome}</Text>
                      <Text style={styles.cardSubtitle}>
                        {item.municipio
                          ? `${item.municipio.nome} - ${item.municipio.uf}`
                          : "Sem município"}
                      </Text>

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                item.status === "ATIVO"
                                  ? theme.colors.primary
                                  : theme.colors.foreground,
                            },
                          ]}
                        />
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Ações */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      navigation.navigate("CadastroBairro", { bairro: item })
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

      {/* Botão Flutuante (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CadastroBairro")}
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
    paddingBottom: 80, // Espaço para o FAB
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
  itemInativo: {
    borderLeftColor: "#999",
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
    backgroundColor: theme.colors.secondary, // Cor secundária para o ícone
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },

  // Actions
  actionButton: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginLeft: 8,
  },

  // FAB
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
