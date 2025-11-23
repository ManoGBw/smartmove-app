import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { API_URL } from "../constants/config";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";
import {
  Cliente,
  Orcamento,
  Produto,
  ProdutoSelecionado,
} from "../types/interfaces";

type OrcamentoScreenProps = {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      orcamento?: Orcamento;
    };
  };
};

export function OrcamentoScreen({ navigation, route }: OrcamentoScreenProps) {
  const { token } = useAuth();

  // Verifica se é edição
  const orcamentoEditar = route.params?.orcamento;
  const isEditing = !!orcamentoEditar;

  // Estados
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    ProdutoSelecionado[]
  >([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);

  const [discount, setDiscount] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState("PENDENTE");

  const [loading, setLoading] = useState(false);

  // Dados da API (Listas para busca)
  const [allClients, setAllClients] = useState<Cliente[]>([]);
  const [allProducts, setAllProducts] = useState<Produto[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // --- POPULAR DADOS NA EDIÇÃO ---
  useEffect(() => {
    if (isEditing && orcamentoEditar) {
      // 1. Preencher Cliente
      setSelectedClient(orcamentoEditar.cliente);

      // 2. Preencher Produtos (Mapeamento Crucial)
      const produtosMapeados: ProdutoSelecionado[] = orcamentoEditar.itens.map(
        (item) => ({
          id: item.produto.id,
          nome: item.produto.nome,
          custo: item.produto.custo,
          valorVenda: item.valorUnitario,
          estoque: item.produto.estoque,
          marca: item.produto.marca,
          referencia: item.produto.referencia,
          quantity: item.quantidade,
          status: item.produto.status,
        })
      );
      setSelectedProducts(produtosMapeados);

      // 3. Preencher Valores e Status
      setDiscount(
        parseFloat(orcamentoEditar.desconto).toFixed(2).replace(".", ",")
      );
      setObservacoes(orcamentoEditar.observacoes || "");
      setStatus(orcamentoEditar.status); // Preenche o status atual
    }
  }, [isEditing, orcamentoEditar]);

  // --- BUSCAS NA API ---
  const fetchClients = useCallback(async () => {
    if (!token) return;
    setLoadingClients(true);
    try {
      const response = await fetch(`${API_URL}/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAllClients(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar clientes.");
    } finally {
      setLoadingClients(false);
    }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_URL}/produtos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Normaliza para garantir numbers
      const produtosFormatados = (
        Array.isArray(data) ? data : data.data || []
      ).map((p: any) => ({
        ...p,
        valorVenda: Number(p.valorVenda),
      }));
      setAllProducts(produtosFormatados);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar produtos.");
    } finally {
      setLoadingProducts(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, [fetchClients, fetchProducts]);

  // --- LÓGICA DE SELEÇÃO E CÁLCULOS ---

  const filteredClients = allClients.filter(
    (c) =>
      c.nome.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.documento && c.documento.includes(clientSearch))
  );

  const filteredProducts = allProducts.filter((p) =>
    p.nome.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddProduct = (product: Produto) => {
    const existingIndex = selectedProducts.findIndex(
      (p) => p.id === product.id
    );

    if (existingIndex >= 0) {
      // Se já existe, incrementa a quantidade
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity += 1;
      setSelectedProducts(updatedProducts);
    } else {
      // Se não existe, cria novo ProdutoSelecionado com quantity = 1
      const newProduct: ProdutoSelecionado = {
        ...product,
        quantity: 1,
      };
      setSelectedProducts((prev) => [...prev, newProduct]);
    }
    Toast.show({ type: "success", text1: "Produto adicionado" });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, quantity: newQuantity } : p
        )
      );
    }
  };

  // Cálculos Financeiros
  const parseCurrency = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
  };

  const discountValue = parseCurrency(discount);

  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + Number(p.valorVenda) * (p.quantity || 1),
    0
  );

  const total = subtotal - discountValue;

  // --- GERAÇÃO DE PDF ---
  const generatePDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, sans-serif; padding: 20px; }
              h1 { color: ${theme.colors.primary}; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { margin-top: 20px; font-size: 18px; font-weight: bold; text-align: right; }
              .status { font-weight: bold; color: #555; }
            </style>
          </head>
          <body>
            <h1>Orçamento #${isEditing ? orcamentoEditar?.id : "NOVO"}</h1>
            <p><strong>Cliente:</strong> ${selectedClient?.nome}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
            <p class="status">Status: ${status}</p>
            
            <table>
              <tr><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr>
              ${selectedProducts
                .map(
                  (p) => `
                <tr>
                  <td>${p.nome}</td>
                  <td>${p.quantity}</td>
                  <td>R$ ${Number(p.valorVenda)
                    .toFixed(2)
                    .replace(".", ",")}</td>
                  <td>R$ ${(Number(p.valorVenda) * p.quantity)
                    .toFixed(2)
                    .replace(".", ",")}</td>
                </tr>
              `
                )
                .join("")}
            </table>
            
            <div class="total">
              <p>Subtotal: R$ ${subtotal.toFixed(2).replace(".", ",")}</p>
              <p>Desconto: - R$ ${discountValue
                .toFixed(2)
                .replace(".", ",")}</p>
              <p>Total Final: R$ ${total.toFixed(2).replace(".", ",")}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

  // --- SALVAR ORÇAMENTO ---
  const handleSaveOrcamento = async () => {
    if (!selectedClient || selectedProducts.length === 0) {
      Alert.alert("Atenção", "Selecione cliente e produtos.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        clienteId: selectedClient.id,
        itens: selectedProducts.map((p) => ({
          produtoId: p.id,
          quantidade: p.quantity,
          valorUnitario: p.valorVenda,
        })),
        observacoes: observacoes || "Orçamento gerado pelo App",
        desconto: discountValue,
        status: status, // Envia o status selecionado
      };

      let url = `${API_URL}/orcamentos`;
      let method = "POST";

      if (isEditing && orcamentoEditar) {
        url = `${API_URL}/orcamentos/${orcamentoEditar.id}`;
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

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Erro ao salvar");
      }

      Alert.alert(
        "Sucesso",
        `Orçamento ${isEditing ? "atualizado" : "criado"}!`,
        [
          { text: "Gerar PDF", onPress: generatePDF },
          {
            text: "Sair",
            onPress: () => navigation.goBack(),
            style: "cancel",
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Falha ao salvar orçamento.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusButtonStyle = (optionStatus: string) => {
    switch (optionStatus) {
      case "APROVADO":
        return {
          backgroundColor: theme.colors.primary || "green",
          borderColor: theme.colors.primary || "green",
        };
      case "CANCELADO":
        return {
          backgroundColor: theme.colors.destructive,
          borderColor: theme.colors.destructive,
        };
      default:
        return {
          backgroundColor: theme.colors.caution,
          borderColor: theme.colors.caution,
        };
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
          {isEditing
            ? `Editar Orçamento #${orcamentoEditar?.id}`
            : "Novo Orçamento"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Seleção de Cliente */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cliente *</Text>
            {!selectedClient ? (
              <>
                <View style={styles.searchContainer}>
                  <Search size={20} color="#666" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChangeText={setClientSearch}
                  />
                </View>
                {clientSearch.length > 0 && (
                  <View style={{ maxHeight: 150 }}>
                    <ScrollView nestedScrollEnabled>
                      {filteredClients.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => {
                            setSelectedClient(c);
                            setClientSearch("");
                          }}
                          style={styles.searchItem}
                        >
                          <Text>{c.nome}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.selectedRow}>
                <Text style={styles.selectedText}>{selectedClient.nome}</Text>
                <TouchableOpacity onPress={() => setSelectedClient(null)}>
                  <X size={20} color={theme.colors.destructive} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Lista de Produtos */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Itens</Text>
              <TouchableOpacity
                onPress={() => setShowProductModal(true)}
                style={styles.addButton}
              >
                <Plus size={16} color="white" />
                <Text style={{ color: "white", marginLeft: 4 }}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {selectedProducts.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum item adicionado.</Text>
            ) : (
              selectedProducts.map((p) => (
                <View key={p.id} style={styles.productItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.nome}</Text>
                    <Text style={styles.productDetail}>
                      {p.quantity} x R${" "}
                      {Number(p.valorVenda).toFixed(2).replace(".", ",")}
                    </Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      onPress={() => handleUpdateQuantity(p.id, p.quantity - 1)}
                    >
                      <Minus size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={{ marginHorizontal: 8, fontSize: 16 }}>
                      {p.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleUpdateQuantity(p.id, p.quantity + 1)}
                    >
                      <Plus size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(p.id, 0)}
                    style={{ marginLeft: 10 }}
                  >
                    <Trash2 size={20} color={theme.colors.destructive} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Detalhes, Status e Totais */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detalhes</Text>

            {/* Seletor de Status */}
            <Text style={styles.label}>Situação</Text>
            <View style={styles.statusContainer}>
              {["PENDENTE", "APROVADO", "CANCELADO"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.statusButton,
                    status === option && getStatusButtonStyle(option),
                  ]}
                  onPress={() => setStatus(option)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      status === option && styles.statusTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: Validade de 10 dias..."
              multiline
              numberOfLines={3}
              value={observacoes}
              onChangeText={setObservacoes}
            />

            <Text style={styles.label}>Desconto (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
            />

            <View style={styles.summary}>
              <View style={styles.rowBetween}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  R$ {subtotal.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.colors.destructive },
                  ]}
                >
                  Desconto:
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: theme.colors.destructive },
                  ]}
                >
                  - R$ {discountValue.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              <View
                style={[
                  styles.rowBetween,
                  {
                    marginTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#EEE",
                    paddingTop: 10,
                  },
                ]}
              >
                <Text style={styles.totalLabel}>TOTAL:</Text>
                <Text style={styles.totalValue}>
                  R$ {total.toFixed(2).replace(".", ",")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Fixo */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleSaveOrcamento}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Check size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Salvar Alterações" : "Finalizar Orçamento"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Produtos */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Produtos</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color="#666" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Buscar produto..."
                value={productSearch}
                onChangeText={setProductSearch}
              />
            </View>

            <ScrollView>
              {filteredProducts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.productItem}
                  onPress={() => handleAddProduct(p)}
                >
                  <View>
                    <Text style={styles.productName}>{p.nome}</Text>
                    <Text style={styles.productDetail}>
                      R$ {Number(p.valorVenda).toFixed(2).replace(".", ",")}
                    </Text>
                  </View>
                  <Plus size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  scrollContent: { padding: 16, paddingBottom: 100 },

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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  input: { flex: 1, height: 45, fontSize: 16 },
  searchItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#EEE" },

  selectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEF",
    padding: 12,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: theme.colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyText: { textAlign: "center", color: "#999", marginVertical: 20 },

  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  productName: { fontSize: 15, color: "#333" },
  productDetail: { fontSize: 13, color: "#666" },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    padding: 4,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 12,
    marginBottom: 4,
  },
  textArea: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
  },

  // --- Estilos do Seletor de Status ---
  statusContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
  },
  statusTextActive: {
    color: "white",
  },

  summary: { marginTop: 20 },
  summaryLabel: { fontSize: 14, color: "#666" },
  summaryValue: { fontSize: 14, fontWeight: "bold", color: "#333" },
  totalLabel: { fontSize: 18, fontWeight: "bold", color: theme.colors.primary },
  totalValue: { fontSize: 18, fontWeight: "bold", color: theme.colors.primary },

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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: theme.colors.primary },
});
