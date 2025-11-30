import { ArrowLeft, Pencil, Search, Users } from "lucide-react-native";
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
import type { Cliente } from "../types/interfaces";

type ConsultaClienteProps = {
  navigation: {
    addListener: (event: string, callback: () => void) => () => void;
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
};

export function ConsultaCliente({ navigation }: ConsultaClienteProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Cliente[]>([]);
  const [filteredClients, setFilteredClients] = useState<Cliente[]>([]);

  // Função para buscar todos os clientes
  const fetchClients = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clientes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar os clientes.");
      }

      const data: Cliente[] = await response.json();
      setClients(data);
      setFilteredClients(data); // Inicialmente, mostra todos
    } catch (error: any) {
      console.error("Erro ao buscar clientes:", error);
      Alert.alert("Erro na Carga", error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Carrega os clientes ao entrar na tela e ao focar nela
  useEffect(() => {
    void fetchClients();
    const unsubscribe = navigation.addListener("focus", () => {
      void fetchClients();
    });
    return unsubscribe;
  }, [fetchClients, navigation]);

  // Filtra a lista com base na busca (por nome ou CPF)
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (c) =>
        c.nome.toLowerCase().includes(query) ||
        (c.documento && c.documento.includes(query))
    );
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  const ClientItem = ({ client }: { client: Cliente }) => (
    <View
      style={[
        styles.clientItem,
        client.status === "INATIVO" && styles.itemInativo,
      ]}
    >
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client.nome}</Text>
        <Text style={styles.clientDetail}>
          Documento: {client.documento || "Não informado"}
        </Text>
        <Text style={styles.clientDetail}>
          Tel: {client.telefone || "Não informado"}
        </Text>
        <Text style={styles.clientDetail}>
          Email: {client.email || "Não informado"}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        <View
          style={[
            styles.statusBadge,
            client.status === "ATIVO"
              ? styles.statusAtivo
              : styles.statusInativo,
          ]}
        >
          <Text style={styles.statusText}>{client.status}</Text>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("CadastroCliente", { cliente: client })
          }
        >
          <Pencil size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <Users size={20} color={theme.colors.primaryForeground} />
          <Text style={styles.headerTitle}>Consultar Clientes</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Campo de Consulta/Busca */}
        <View style={styles.searchCard}>
          <View style={styles.searchInputContainer}>
            <Search
              size={20}
              color={theme.colors.foreground}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome ou CPF..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Lista de Clientes */}
        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 40 }}
            size="large"
            color={theme.colors.primary}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {filteredClients.length > 0 ? (
              filteredClients.map((c) => <ClientItem key={c.id} client={c} />)
            ) : (
              <Text style={styles.emptyText}>
                Nenhum cliente encontrado com a sua busca.
              </Text>
            )}
          </ScrollView>
        )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8EB",
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: "#000" },
  scrollContent: {
    paddingBottom: 20,
  },
  clientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.secondary,
  },
  itemInativo: {
    borderLeftColor: theme.colors.foreground,
    backgroundColor: "#f9f9f9",
  },
  clientInfo: {
    flex: 1,
    marginRight: 10,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  clientDetail: {
    fontSize: 14,
    color: theme.colors.foreground,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: theme.colors.muted,
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusAtivo: {
    backgroundColor: "rgba(46, 30, 67, 0.1)", // Fundo primário claro
  },
  statusInativo: {
    backgroundColor: "rgba(138, 138, 140, 0.1)", // Fundo cinza claro
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: theme.colors.primary,
    textTransform: "uppercase",
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.foreground,
    marginTop: 40,
    fontSize: 16,
  },
});
