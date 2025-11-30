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
  Switch, // <--- Importar Switch
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../constants/config";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";
import type { Bairro, Cliente, Municipio } from "../types/interfaces";

// ... (SearchModal permanece igual) ...
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
type CadastroClienteProps = {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      cliente?: Cliente;
    };
  };
};

export function CadastroCliente({ navigation, route }: CadastroClienteProps) {
  const { token } = useAuth();

  const clienteEditar = route.params?.cliente;
  const isEditing = !!clienteEditar;

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  // 1. Novo estado para Status (Padrão: true/ATIVO)
  const [statusAtivo, setStatusAtivo] = useState(true);

  const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(
    null
  );
  const [selectedBairro, setSelectedBairro] = useState<Bairro | null>(null);

  const [modalMunicipioVisible, setModalMunicipioVisible] = useState(false);
  const [modalBairroVisible, setModalBairroVisible] = useState(false);

  const [searchResultsMunicipio, setSearchResultsMunicipio] = useState<
    Municipio[]
  >([]);
  const [searchResultsBairro, setSearchResultsBairro] = useState<Bairro[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [latitude, setLatitude] = useState<number | string | null>(null);
  const [longitude, setLongitude] = useState<number | string | null>(null);

  useEffect(() => {
    if (isEditing && clienteEditar) {
      setNome(clienteEditar.nome);
      setCpf(clienteEditar.documento || "");
      setTelefone(clienteEditar.telefone || "");
      setEmail(clienteEditar.email || "");
      setEndereco(clienteEditar.endereco || "");
      setCep(clienteEditar.cep || "");
      setLatitude(clienteEditar.latitude);
      setLongitude(clienteEditar.longitude);
      // 2. Carregar o status ao editar
      setStatusAtivo(clienteEditar.status === "ATIVO");

      if (clienteEditar.bairro) {
        setSelectedBairro(clienteEditar.bairro);

        if (clienteEditar.bairro.municipio) {
          setSelectedMunicipio(clienteEditar.bairro.municipio);
        }
      }
    }
  }, [isEditing, clienteEditar]);

  // --- FUNÇÕES DE BUSCA ---
  const searchMunicipios = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSearchResultsMunicipio([]);
        return;
      }

      setLoadingSearch(true);
      try {
        const response = await fetch(`${API_URL}/municipios`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ query: query }),
        });
        const data = await response.json();
        setSearchResultsMunicipio(data.data || data);
      } catch (error) {
        console.error("Erro busca municipio:", error);
      } finally {
        setLoadingSearch(false);
      }
    },
    [token]
  );

  const searchBairros = useCallback(
    async (query: string) => {
      if (!selectedMunicipio) return;

      setLoadingSearch(true);
      try {
        const response = await fetch(
          `${API_URL}/bairros/${selectedMunicipio.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ query: query }),
          }
        );
        const data = await response.json();
        setSearchResultsBairro(data.data || data);
      } catch (error) {
        console.error("Erro busca bairro:", error);
      } finally {
        setLoadingSearch(false);
      }
    },
    [token, selectedMunicipio]
  );

  const handleSelectMunicipio = (item: Municipio) => {
    setSelectedMunicipio(item);
    setModalMunicipioVisible(false);

    setSelectedBairro(null);
    setSearchResultsBairro([]);

    if (item.cep) {
      setCep(item.cep);
    } else {
      setCep("");
    }
  };

  const handleSelectBairro = (item: Bairro) => {
    setSelectedBairro(item);
    setModalBairroVisible(false);
  };

  const handleSave = async () => {
    if (!nome || !selectedBairro || !cep) {
      Alert.alert(
        "Atenção",
        "Preencha o nome, CEP e selecione Cidade e Bairro."
      );
      return;
    }

    setLoadingSave(true);
    try {
      const payload = {
        nome,
        documento: cpf || null,
        telefone: telefone || null,
        email: email || null,
        endereco: endereco || null,
        cep: cep,
        bairroId: selectedBairro.id,
        // 3. Enviar o status correto
        status: statusAtivo ? "ATIVO" : "INATIVO",
        latitude: latitude || 0,
        longitude: longitude || 0,
      };

      let url = `${API_URL}/clientes`;
      let method = "POST";

      if (isEditing && clienteEditar) {
        url = `${API_URL}/clientes/${clienteEditar.id}`;
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

      if (!response.ok) throw new Error("Erro na API");

      Alert.alert(
        "Sucesso",
        `Cliente ${isEditing ? "atualizado" : "cadastrado"}!`
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o cliente.");
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
          {isEditing ? "Editar Cliente" : "Novo Cliente"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dados Pessoais */}
        <View style={styles.section}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do cliente"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Documento (CPF/CNPJ)</Text>
          <TextInput
            style={styles.input}
            placeholder="Informe o documento"
            keyboardType="numeric"
            value={cpf}
            onChangeText={setCpf}
          />
        </View>

        {/* Localização */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localização</Text>

          {/* MUNICÍPIO */}
          <Text style={styles.label}>Município *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              setModalMunicipioVisible(true);
              setSearchResultsMunicipio([]);
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
                : "Selecione a cidade..."}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>CEP *</Text>
          <TextInput
            style={styles.input}
            placeholder="00000-000"
            keyboardType="numeric"
            value={cep}
            onChangeText={setCep}
            maxLength={9}
          />

          {/* BAIRRO */}
          <Text style={styles.label}>Bairro *</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              !selectedMunicipio && styles.disabledButton,
            ]}
            onPress={() => {
              if (selectedMunicipio) {
                setModalBairroVisible(true);
                searchBairros("");
              } else {
                Alert.alert("Atenção", "Selecione primeiro o município.");
              }
            }}
            activeOpacity={selectedMunicipio ? 0.7 : 1}
          >
            <Text
              style={[styles.selectText, !selectedBairro && { color: "#999" }]}
            >
              {selectedBairro ? selectedBairro.nome : "Selecione o bairro..."}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={styles.input}
            placeholder="Rua, Número, Complemento"
            value={endereco}
            onChangeText={setEndereco}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="email@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: "#F0F0F0", color: "#888" },
              ]}
              value={isEditing ? String(latitude ?? "---") : "Automático"}
              editable={false}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: "#F0F0F0", color: "#888" },
              ]}
              value={isEditing ? String(longitude ?? "---") : "Automático"}
              editable={false}
            />
          </View>
        </View>

        {/* 4. NOVA SEÇÃO DE STATUS (Igual ao CadastroBairro.tsx) */}
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
                    : theme.colors.foreground,
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
                {isEditing ? "Atualizar Cliente" : "Salvar Cliente"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Uso dos Modais (sem alterações) */}
      <SearchModal
        visible={modalMunicipioVisible}
        onClose={() => setModalMunicipioVisible(false)}
        title="Buscar Município"
        placeholder="Digite o nome da cidade..."
        data={searchResultsMunicipio}
        onSearch={searchMunicipios}
        onSelect={handleSelectMunicipio}
        loading={loadingSearch}
      />

      <SearchModal
        visible={modalBairroVisible}
        onClose={() => setModalBairroVisible(false)}
        title={
          selectedMunicipio ? `Bairros de ${selectedMunicipio.nome}` : "Bairros"
        }
        placeholder="Digite o nome do bairro..."
        data={searchResultsBairro}
        onSearch={searchBairros}
        onSelect={handleSelectBairro}
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
  disabledButton: {
    backgroundColor: "#E0E0E0",
    borderColor: "#CCC",
    opacity: 0.7,
  },
  selectText: { fontSize: 16, color: "#333" },
  // Novos estilos para o Switch
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 16, color: "#333" },

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
