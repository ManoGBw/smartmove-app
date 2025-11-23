import { ArrowLeft, Check, ChevronDown, Search, X } from "lucide-react-native";
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
import type { Bairro, Municipio } from "../types/interfaces";

// --- COMPONENTE DE MODAL (Reutilizado) ---
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
          <Search size={20} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.modalInput}
            placeholder={placeholder}
            onChangeText={onSearch}
            autoFocus={true}
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ textAlign: "center", color: "#666", marginTop: 10 }}>
              Buscando...
            </Text>
          </View>
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
                  {item.nome} {item.uf ? `- ${item.uf}` : ""}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Digite para buscar... (mínimo 3 letras)
              </Text>
            }
          />
        )}
      </View>
    </View>
  </Modal>
);

// --- TELA PRINCIPAL ---
type CadastroBairroProps = {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      bairro?: Bairro;
    };
  };
};

export function CadastroBairro({ navigation, route }: CadastroBairroProps) {
  const { token } = useAuth();

  // Verifica se é edição
  const bairroEditar = route.params?.bairro;
  const isEditing = !!bairroEditar;

  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [statusAtivo, setStatusAtivo] = useState(true); // true = ATIVO, false = INATIVO
  const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(
    null
  );

  // Estados de Controle
  const [modalMunicipioVisible, setModalMunicipioVisible] = useState(false);
  const [searchResultsMunicipio, setSearchResultsMunicipio] = useState<
    Municipio[]
  >([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // --- POPULAR CAMPOS NA EDIÇÃO ---
  useEffect(() => {
    if (isEditing && bairroEditar) {
      setNome(bairroEditar.nome);
      setStatusAtivo(bairroEditar.status === "ATIVO"); // Converte string para booleano

      if (bairroEditar.municipio) {
        setSelectedMunicipio(bairroEditar.municipio);
      }
    }
  }, [isEditing, bairroEditar]);

  // --- BUSCA DE MUNICÍPIOS ---
  const searchMunicipios = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSearchResultsMunicipio([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const response = await fetch(`${API_URL}/municipios`, {
          method: "POST",
          body: JSON.stringify({ query }),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setSearchResultsMunicipio(data.data || data);
      } catch (error) {
        console.error("Erro ao buscar municípios", error);
      } finally {
        setLoadingSearch(false);
      }
    },
    [token]
  );

  const handleSelectMunicipio = (item: Municipio) => {
    setSelectedMunicipio(item);
    setModalMunicipioVisible(false);
  };

  // --- SALVAR ---
  const handleSave = async () => {
    if (!nome || !selectedMunicipio) {
      Alert.alert(
        "Atenção",
        "Preencha o nome do bairro e selecione um município."
      );
      return;
    }

    setLoadingSave(true);
    try {
      const payload = {
        nome: nome,
        idMunicipio: selectedMunicipio.id,
        status: statusAtivo ? "ATIVO" : "INATIVO",
      };

      let url = `${API_URL}/bairros`;
      let method = "POST";

      if (isEditing && bairroEditar) {
        url = `${API_URL}/bairros/${bairroEditar.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Falha na requisição");

      Alert.alert(
        "Sucesso",
        `Bairro ${isEditing ? "atualizado" : "cadastrado"}!`
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o bairro.");
      console.error(error);
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8 }}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Editar Bairro" : "Novo Bairro"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dados do Bairro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Bairro</Text>

          <Text style={styles.label}>Nome do Bairro *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Centro"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Município Vinculado *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              setModalMunicipioVisible(true);
              setSearchResultsMunicipio([]); // Limpa busca anterior
            }}
          >
            <Text
              style={[
                styles.selectText,
                !selectedMunicipio && { color: "#999" },
              ]}
            >
              {selectedMunicipio
                ? `${selectedMunicipio.nome} - ${selectedMunicipio.uf}`
                : "Selecione o município..."}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Situação</Text>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Status do Cadastro</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text
                style={{
                  color: statusAtivo
                    ? theme.colors.primary
                    : theme.colors.mutedForeground,
                  fontWeight: "bold",
                }}
              >
                {statusAtivo ? "ATIVO" : "INATIVO"}
              </Text>
              <Switch
                trackColor={{ false: "#767577", true: theme.colors.secondary }}
                thumbColor={statusAtivo ? theme.colors.primary : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setStatusAtivo}
                value={statusAtivo}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
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
                {isEditing ? "Atualizar Bairro" : "Salvar Bairro"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Município */}
      <SearchModal
        visible={modalMunicipioVisible}
        onClose={() => setModalMunicipioVisible(false)}
        title="Buscar Município"
        placeholder="Nome da cidade..."
        data={searchResultsMunicipio}
        onSearch={searchMunicipios}
        onSelect={handleSelectMunicipio}
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  label: { fontSize: 14, color: "#333", marginBottom: 6, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    height: 50,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
    height: 50,
  },
  selectText: { fontSize: 16, color: "#333" },

  // Switch Styles
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 16, color: "#333" },

  // Footer
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    height: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
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
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
    fontSize: 16,
  },
});
