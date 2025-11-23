import {
  ArrowLeft,
  Pencil,
  Plus,
  Route as RouteIcon,
  Search,
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
import type { Rota } from "../types/interfaces";

type ConsultaRotaProps = {
  navigation: {
    addListener: (event: string, callback: () => void) => () => void;
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
};

export function ConsultaRota({ navigation }: ConsultaRotaProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [filteredRotas, setFilteredRotas] = useState<Rota[]>([]);

  // --- BUSCA DADOS NA API ---
  const fetchRotas = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Tenta buscar as rotas do usuário específico
      // Se sua API usar apenas /rotas para listar tudo, ajuste aqui
      const response = await fetch(`${API_URL}/rotas/usuario`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar rotas");

      const data = await response.json();
      const lista = Array.isArray(data) ? data : data.data || [];

      setRotas(lista);
      setFilteredRotas(lista);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar as rotas.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchRotas);
    return unsubscribe;
  }, [navigation, fetchRotas]);

  // --- FILTRO ---
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredRotas(rotas);
    } else {
      const lower = text.toLowerCase();
      const filtered = rotas.filter((r) =>
        r.nome.toLowerCase().includes(lower)
      );
      setFilteredRotas(filtered);
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
          <Text style={styles.headerTitle}>Minhas Rotas</Text>
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
            placeholder="Buscar rota..."
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
            {filteredRotas.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma rota encontrada.</Text>
            ) : (
              filteredRotas.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    item.status !== "ATIVO" && styles.itemInativo,
                  ]}
                >
                  <View style={styles.infoContainer}>
                    <View
                      style={[
                        styles.iconContainer,
                        item.status !== "ATIVO" && { backgroundColor: "#DDD" },
                      ]}
                    >
                      <RouteIcon size={24} color="white" />
                    </View>

                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle}>{item.nome}</Text>
                      <Text style={styles.cardSubtitle}>
                        {item.itensRota?.length || 0} bairros vinculados
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

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      navigation.navigate("CadastroRota", { rota: item })
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CadastroRota")}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },
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
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  content: { flex: 1 },
  listContainer: { padding: 16, paddingBottom: 80 },
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
  itemInativo: { borderLeftColor: "#999", opacity: 0.8 },
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
  textContainer: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 2,
  },
  cardSubtitle: { fontSize: 14, color: "#666", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "500", color: "#666" },
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
  },
});
