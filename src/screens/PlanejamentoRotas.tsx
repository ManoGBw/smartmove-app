import {
  ArrowLeft,
  MapPin,
  Navigation,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { API_URL } from "../constants/config";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";
import type { Cliente } from "../types/interfaces";

// --- UTILS: Decodificador de Polyline (Google Encoded String -> Coords) ---
const decodePolyline = (encoded: string) => {
  const poly = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return poly;
};

interface RotaOtimizadaResponse {
  distanciaTotal: number; // em metros
  duracaoTotal: number; // em segundos
  polyline: string;
  clientesOrdenados: Cliente[];
}

// --- MODAL DE BUSCA (Adaptado para Multi-Select ou Single) ---
const SearchModal = ({
  visible,
  onClose,
  title,
  onSelect,
  placeholder,
  token,
  mode = "single",
}: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/clientes?nome=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setResults(data.data || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            onChangeText={handleSearch}
            autoFocus
          />
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => {
                    onSelect(item);
                    if (mode === "single") onClose();
                  }}
                >
                  <Text style={styles.resultText}>{item.nome}</Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>
                    {item.endereco}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export function PlanejamentoRotas({ navigation }: any) {
  const { token } = useAuth();

  // Estados de Seleção
  const [origem, setOrigem] = useState<Cliente | null>(null);
  const [destinos, setDestinos] = useState<Cliente[]>([]);

  // Estados de Controle
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"origem" | "destino">("origem");
  const [loadingOtimizacao, setLoadingOtimizacao] = useState(false);

  // Estado do Resultado
  const [resultado, setResultado] = useState<RotaOtimizadaResponse | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"mapa" | "lista">("mapa");

  const openSearch = (mode: "origem" | "destino") => {
    setModalMode(mode);
    setModalVisible(true);
  };

  const handleSelect = (item: Cliente) => {
    if (modalMode === "origem") {
      setOrigem(item);
    } else {
      // Verifica duplicidade
      if (!destinos.find((d) => d.id === item.id) && item.id !== origem?.id) {
        setDestinos([...destinos, item]);
      } else {
        Alert.alert("Aviso", "Cliente já adicionado ou é a origem.");
      }
      // Não fecha o modal automaticamente para permitir adicionar vários
    }
  };

  const handleRemoveDestino = (id: number) => {
    setDestinos(destinos.filter((d) => d.id !== id));
  };

  const handleOtimizar = async () => {
    if (!origem || destinos.length === 0) {
      Alert.alert("Atenção", "Defina uma origem e pelo menos um destino.");
      return;
    }

    setLoadingOtimizacao(true);
    try {
      // Payload conforme seu backend espera
      const payload = {
        origemId: origem.id,
        clienteIds: destinos.map((d) => d.id),
      };

      const response = await fetch(`${API_URL}/rotas/otimizar`, {
        // Ajuste a rota se necessário
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Falha ao otimizar rota");

      const data = await response.json();
      setResultado(data);
      setActiveTab("mapa");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível calcular a rota.");
    } finally {
      setLoadingOtimizacao(false);
    }
  };

  // Limpar tudo para nova rota
  const reset = () => {
    setResultado(null);
    // Opcional: limpar destinos
  };

  // Renderização da Visualização de Resultados
  const renderResultado = () => {
    if (!resultado) return null;

    const coordsPolyline = decodePolyline(resultado.polyline);
    const totalKm = (resultado.distanciaTotal / 1000).toFixed(1);
    const totalMin = Math.round(resultado.duracaoTotal / 60);

    return (
      <View style={{ flex: 1 }}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "mapa" && styles.tabActive]}
            onPress={() => setActiveTab("mapa")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "mapa" && styles.tabTextActive,
              ]}
            >
              Mapa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "lista" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("lista")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "lista" && styles.tabTextActive,
              ]}
            >
              Lista Passo-a-Passo
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "mapa" ? (
          <View style={{ flex: 1 }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: origem?.latitude || -23.55,
                longitude: origem?.longitude || -46.63,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {/* Polyline do trajeto */}
              <Polyline
                coordinates={coordsPolyline}
                strokeColor={theme.colors.primary}
                strokeWidth={4}
              />

              {/* Marcador Origem */}
              {origem?.latitude && (
                <Marker
                  coordinate={{
                    latitude: origem.latitude || 0,
                    longitude: origem.longitude || 0,
                  }}
                  title={`Início: ${origem.nome}`}
                  pinColor="green"
                />
              )}

              {/* Marcadores dos Clientes (Numerados) */}
              {resultado.clientesOrdenados.map(
                (cliente, index) =>
                  cliente.latitude && (
                    <Marker
                      key={cliente.id}
                      coordinate={{
                        latitude: cliente.latitude || 0,
                        longitude: cliente.longitude || 0,
                      }}
                      title={`${index + 1}. ${cliente.nome}`}
                      description={cliente.endereco || ""}
                    >
                      {/* Custom Marker simples com número */}
                      <View style={styles.customMarker}>
                        <Text style={styles.markerText}>{index + 1}</Text>
                      </View>
                    </Marker>
                  )
              )}
            </MapView>
            {/* Card Flutuante com Resumo */}
            <View style={styles.summaryFloat}>
              <View>
                <Text style={styles.summaryLabel}>Distância Total</Text>
                <Text style={styles.summaryValue}>{totalKm} km</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View>
                <Text style={styles.summaryLabel}>Tempo Estimado</Text>
                <Text style={styles.summaryValue}>{totalMin} min</Text>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Linha do Tempo */}
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: "green" }]} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Saída: {origem?.nome}</Text>
                <Text style={styles.stepSubtitle}>{origem?.endereco}</Text>
              </View>
            </View>

            {resultado.clientesOrdenados.map((cliente, index) => (
              <View key={cliente.id} style={styles.stepItem}>
                <View style={styles.stepLine} />
                <View style={styles.stepDot}>
                  <Text
                    style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{cliente.nome}</Text>
                  <Text style={styles.stepSubtitle}>{cliente.endereco}</Text>
                </View>
              </View>
            ))}

            <View style={styles.stepItem}>
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, { backgroundColor: "red" }]} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Retorno (Fim)</Text>
                <Text style={styles.stepSubtitle}>
                  Volta para {origem?.nome}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={reset}>
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Nova Simulação
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Otimizador de Rotas</Text>
        <View style={{ width: 24 }} />
      </View>

      {resultado ? (
        renderResultado()
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Card de Seleção */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Definir Ponto de Partida</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => openSearch("origem")}
            >
              <MapPin size={20} color={origem ? "green" : "#999"} />
              <Text style={[styles.selectText, !origem && { color: "#999" }]}>
                {origem ? origem.nome : "Selecionar origem..."}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={styles.cardTitle}>
                2. Selecionar Clientes ({destinos.length})
              </Text>
              <TouchableOpacity
                onPress={() => openSearch("destino")}
                style={styles.addBtnSmall}
              >
                <Plus size={16} color="white" />
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 12 }}
                >
                  Adicionar
                </Text>
              </TouchableOpacity>
            </View>

            {destinos.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhum cliente selecionado para visita.
              </Text>
            ) : (
              destinos.map((item) => (
                <View key={item.id} style={styles.destItem}>
                  <Text style={{ flex: 1, color: "#333" }}>{item.nome}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveDestino(item.id)}
                  >
                    <Trash2 size={18} color={theme.colors.destructive} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.optimizeButton,
              (loadingOtimizacao || !origem || destinos.length === 0) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleOtimizar}
            disabled={loadingOtimizacao || !origem || destinos.length === 0}
          >
            {loadingOtimizacao ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Navigation
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.optimizeButtonText}>
                  Calcular Melhor Rota
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.helperText}>
            * O sistema irá reordenar os clientes automaticamente para o menor
            tempo de deslocamento.
          </Text>
        </ScrollView>
      )}

      <SearchModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalMode === "origem" ? "Buscar Origem" : "Adicionar Cliente"}
        placeholder="Nome do cliente..."
        onSelect={handleSelect}
        token={token}
        mode={modalMode === "origem" ? "single" : "multi"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  content: { padding: 16 },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 12,
  },

  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  selectText: { fontSize: 16, color: "#333" },

  addBtnSmall: {
    backgroundColor: theme.colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  destItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  emptyText: { color: "#999", textAlign: "center", paddingVertical: 10 },

  optimizeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    elevation: 4,
  },
  optimizeButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },

  helperText: {
    textAlign: "center",
    color: "#888",
    fontSize: 12,
    marginTop: 16,
    paddingHorizontal: 20,
  },

  // Styles do Resultado
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: { fontSize: 14, color: "#666", fontWeight: "500" },
  tabTextActive: { color: theme.colors.primary, fontWeight: "bold" },

  customMarker: {
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 2,
  },
  markerText: { color: "white", fontWeight: "bold", fontSize: 12 },

  summaryFloat: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  summaryLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  dividerVertical: { width: 1, height: "100%", backgroundColor: "#EEE" },

  resetButton: {
    backgroundColor: theme.colors.secondary,
    padding: 16,
    alignItems: "center",
    margin: 16,
  },

  // Lista Passo a Passo
  stepItem: {
    flexDirection: "row",
    marginBottom: 0,
    height: 80,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepLine: {
    position: "absolute",
    left: 11, // metade do width do dot (24/2 = 12) - 1px de borda
    top: -40,
    bottom: 40,
    width: 2,
    backgroundColor: "#DDD",
    zIndex: 1,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  stepTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  stepSubtitle: { fontSize: 12, color: "#666", marginTop: 4 },

  // Modal interno
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: theme.colors.primary },
  resultItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  resultText: { fontSize: 16, color: "#333" },
});
