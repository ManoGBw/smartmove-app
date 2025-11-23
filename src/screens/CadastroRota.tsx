import { ArrowLeft, Check, MapPin, Plus, Trash2, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../constants/config";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";
import type { Bairro, Rota } from "../types/interfaces";

// --- MODAL DE BUSCA (Reutilizável) ---
const SearchModal = ({
  visible,
  onClose,
  title,
  data,
  onSearch,
  onSelect,
  placeholder,
  loading,
}: any) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalInputContainer}>
          <Text style={{ marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.modalInput}
            placeholder={placeholder}
            onChangeText={onSearch}
            autoFocus={true}
          />
        </View>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.resultText}>
                  {item.nome} {item.municipio ? `- ${item.municipio.nome}` : ""}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Digite para buscar...</Text>
            }
          />
        )}
      </View>
    </View>
  </Modal>
);

// --- TELA PRINCIPAL ---
export function CadastroRota({ navigation, route }: any) {
  const { token } = useAuth();
  const rotaEditar = route.params?.rota as Rota;
  const isEditing = !!rotaEditar;

  const [nome, setNome] = useState("");
  const [statusAtivo, setStatusAtivo] = useState(true);
  const [selectedBairros, setSelectedBairros] = useState<Bairro[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<Bairro[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // Carregar dados na edição
  useEffect(() => {
    if (isEditing && rotaEditar) {
      setNome(rotaEditar.nome);
      setStatusAtivo(rotaEditar.status === "ATIVO");
      // Mapeia os itens da rota para o formato de bairros selecionados
      if (rotaEditar.itensRota) {
        setSelectedBairros(rotaEditar.itensRota.map((item) => item.bairro));
      }
    }
  }, [isEditing, rotaEditar]);

  // Busca de Bairros (Geral)
  const searchBairros = useCallback(
    async (query: string) => {
      if (query.length < 3) return;
      setLoadingSearch(true);
      try {
        // Busca bairros gerais. Se quiser filtrar por cidade, precisaria selecionar cidade antes.
        // Aqui estou assumindo busca global por nome.
        const response = await fetch(`${API_URL}/bairros?nome=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setSearchResults(data.data || data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSearch(false);
      }
    },
    [token]
  );

  const handleAddBairro = (bairro: Bairro) => {
    // Evita duplicados
    if (!selectedBairros.find((b) => b.id === bairro.id)) {
      setSelectedBairros([...selectedBairros, bairro]);
    } else {
      Alert.alert("Aviso", "Este bairro já está na lista.");
    }
    setModalVisible(false);
    setSearchResults([]);
  };

  const handleRemoveBairro = (id: number) => {
    setSelectedBairros(selectedBairros.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    if (!nome || selectedBairros.length === 0) {
      Alert.alert(
        "Atenção",
        "Preencha o nome e adicione pelo menos um bairro."
      );
      return;
    }

    setLoadingSave(true);
    try {
      const payload = {
        nome,
        status: statusAtivo ? "ATIVO" : "INATIVO",
        bairroIds: selectedBairros.map((b) => b.id), // Array de IDs
      };

      let url = `${API_URL}/rotas`;
      let method = "POST";

      if (isEditing) {
        url = `${API_URL}/rotas/${rotaEditar.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao salvar rota");

      Alert.alert("Sucesso", `Rota ${isEditing ? "atualizada" : "criada"}!`);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar a rota.");
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8 }}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Editar Rota" : "Nova Rota"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Dados Básicos */}
        <View style={styles.section}>
          <Text style={styles.label}>Nome da Rota *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Rota Segunda-Feira - Centro"
            value={nome}
            onChangeText={setNome}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Rota Ativa?</Text>
            <Switch
              trackColor={{ false: "#767577", true: theme.colors.secondary }}
              thumbColor={statusAtivo ? theme.colors.primary : "#f4f3f4"}
              onValueChange={setStatusAtivo}
              value={statusAtivo}
            />
          </View>
        </View>

        {/* Bairros */}
        <View style={styles.section}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={styles.sectionTitle}>
              Bairros ({selectedBairros.length})
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={16} color="white" />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {selectedBairros.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum bairro adicionado.</Text>
          ) : (
            selectedBairros.map((bairro, index) => (
              <View key={`${bairro.id}-${index}`} style={styles.bairroItem}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <MapPin size={20} color={theme.colors.primary} />
                  <Text style={styles.bairroText}>{bairro.nome}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveBairro(bairro.id)}>
                  <Trash2 size={20} color={theme.colors.destructive} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loadingSave && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loadingSave}
        >
          {loadingSave ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Check size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {isEditing ? "Atualizar" : "Salvar"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <SearchModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Adicionar Bairro"
        placeholder="Busque o bairro..."
        data={searchResults}
        onSearch={searchBairros}
        onSelect={handleAddBairro}
        loading={loadingSearch}
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
  content: { padding: 16, paddingBottom: 100 },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  label: { fontSize: 14, color: "#333", marginBottom: 6, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: { color: "white", fontWeight: "bold", fontSize: 12 },
  emptyText: { textAlign: "center", color: "#999", paddingVertical: 20 },
  bairroItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  bairroText: { fontSize: 16, color: "#333" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#DDD",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  // Modal Styles (Mesmos das outras telas)
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
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
  },
  modalInput: { flex: 1, height: 50, fontSize: 16 },
  resultItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  resultText: { fontSize: 16, color: "#333" },
});
