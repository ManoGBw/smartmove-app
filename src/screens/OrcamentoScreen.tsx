// src/screens/OrcamentoScreen.tsx

import {
  ArrowLeft,
  Check,
  FileText,
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
  Modal, // <--- ADICIONADO
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { theme } from "../theme/colors";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { useAuth } from "../context/AuthContext";

const API_URL = "http://72.60.12.191:3006/api/v1";

interface Product {
  id: number;
  nome: string;
  valorVenda: number;
  estoque: number;
  quantity?: number;
}
interface Client {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
}

type OrcamentoScreenProps = {
  navigation: {
    goBack: () => void;
  };
};

export function OrcamentoScreen({ navigation }: OrcamentoScreenProps) {
  const { token } = useAuth();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [discount, setDiscount] = useState(""); // <--- ADICIONADO ESTADO
  const [loading, setLoading] = useState(false);

  // --- ESTADO DE FOCO PARA SCROLL ---
  const [isInputFocused, setIsInputFocused] = useState(false);
  // ----------------------------------------------------

  const fetchClients = useCallback(async () => {
    if (!token) return;
    setLoadingClients(true);
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
      const data = await response.json();
      setAllClients(data);
    } catch (error: any) {
      Alert.alert("Erro ao buscar clientes", error.message);
    } finally {
      setLoadingClients(false);
    }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_URL}/produtos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Não foi possível carregar os produtos.");
      }
      const data = await response.json();
      setAllProducts(data);
    } catch (error: any) {
      Alert.alert("Erro ao buscar produtos", error.message);
    } finally {
      setLoadingProducts(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, [fetchClients, fetchProducts]);

  const filteredClients = allClients.filter(
    (c) =>
      c.nome.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.cpf && c.cpf.includes(clientSearch))
  );
  // Mantido a filtragem por estoque > 0 apenas na modal de produtos, como no original.
  const filteredProducts = allProducts.filter(
    (p) =>
      p.nome.toLowerCase().includes(productSearch.toLowerCase()) &&
      p.estoque > 0
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch("");
  };

  const handleAddProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.id === product.id);
    if (existing) {
      if ((existing.quantity || 0) < product.estoque) {
        setSelectedProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
          )
        );
        Toast.show({ type: "success", text1: "Quantidade atualizada" });
      } else {
        Toast.show({ type: "error", text1: "Estoque insuficiente" });
      }
    } else {
      setSelectedProducts((prev) => [...prev, { ...product, quantity: 1 }]);
      Toast.show({ type: "success", text1: "Produto adicionado" });
    }
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    const product = allProducts.find((p) => p.id === productId);
    if (newQuantity <= 0) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
      Toast.show({ type: "info", text1: "Produto removido" });
    } else if (product && newQuantity <= product.estoque) {
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, quantity: newQuantity } : p
        )
      );
    } else {
      Toast.show({ type: "error", text1: "Estoque insuficiente" });
    }
  };

  const handleRemoveProduct = (productId: number) => {
    handleUpdateQuantity(productId, 0);
  };

  // Funções de Cálculo (Copiado de RealizarVenda.tsx)
  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    // Remove o separador de milhar e troca a vírgula por ponto
    const numberString = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(numberString) || 0;
  };
  const formatCurrency = (value: number): string =>
    (parseFloat(String(value)) || 0).toFixed(2).replace(".", ",");

  const getDiscountValue = () => parseCurrency(discount);

  // CÁLCULO TOTAL
  const subtotal = selectedProducts.reduce(
    (sum, p) =>
      sum + (parseFloat(String(p.valorVenda)) || 0) * (p.quantity || 1),
    0
  );
  const total = subtotal - getDiscountValue();

  // --- FUNÇÃO PARA GERAR HTML DO PDF (MODIFICADA) ---
  const createHtmlForQuotePdf = (
    client: Client,
    products: Product[],
    discount: number,
    subtotal: number,
    totalValue: number
  ) => {
    const productRows = products
      .map(
        (p) => `
    <tr>
      <td>${p.nome}</td>
      <td>${p.quantity}</td>
      <td>R$ ${formatCurrency(p.valorVenda)}</td>
      <td>R$ ${formatCurrency(p.valorVenda * (p.quantity || 1))}</td>
    </tr>
  `
      )
      .join("");

    return `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: ${theme.colors.primary}; }
          h2 { color: ${
            theme.colors.secondary
          }; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          h3 { color: #333; }
          p { color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: ${theme.colors.muted}; color: ${
      theme.colors.primary
    }; }
          .summary { margin-top: 10px; font-size: 1.1em; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .total { font-weight: bold; color: ${theme.colors.primary}; }
        </style>
      </head>
      <body>
        <h1>Smart Move Orçamentos</h1>
        <h2>Detalhes do Orçamento</h2>

        <h3>Cliente:</h3>
        <p>
          <strong>Nome:</strong> ${client.nome}<br/>
          <strong>CPF:</strong> ${client.cpf || "Não informado"}<br/>
          <strong>Telefone:</strong> ${client.telefone || "Não informado"}
        </p>

        <h3>Itens Orçados:</h3>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd.</th>
              <th>Valor Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>

        <h3>Resumo do Orçamento:</h3>
        <div class="summary">
          <div class="summary-row"><span>Subtotal:</span><span>R$ ${formatCurrency(
            subtotal
          )}</span></div>
          ${
            discount > 0
              ? `<div class="summary-row" style="color: ${
                  theme.colors.destructive
                }"><span>Desconto:</span><span>- R$ ${formatCurrency(
                  discount
                )}</span></div>`
              : ""
          }
          <div class="summary-row total" style="border-top: 1px solid #ddd; padding-top: 5px; margin-top: 5px;"><span>Valor Total Estimado:</span><span>R$ ${formatCurrency(
            totalValue
          )}</span></div>
        </div>
      </body>
    </html>
  `;
  };

  // --- FUNÇÃO PARA GERAR PDF E COMPARTILHAR ---
  const handleGeneratePDFAndShare = async (quoteDetails: {
    client: Client;
    products: Product[];
    discount: number;
    subtotal: number;
    totalValue: number;
  }) => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(
        "Erro",
        "O compartilhamento não está disponível neste dispositivo."
      );
      return;
    }

    try {
      const htmlContent = createHtmlForQuotePdf(
        quoteDetails.client,
        quoteDetails.products,
        quoteDetails.discount,
        quoteDetails.subtotal,
        quoteDetails.totalValue
      );

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        margins: { top: 30, right: 20, bottom: 20, left: 20 },
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartilhar Orçamento",
        UTI: ".pdf",
      });
    } catch (error) {
      console.error("Erro ao gerar/compartilhar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar e compartilhar o PDF.");
    }
  };
  // ------------------------------------------------------------------

  // --- FUNÇÃO DE FINALIZAÇÃO (CONSOLIDADA) ---
  const handleFinalizeOrcamento = async () => {
    if (loading) return;

    if (!selectedClient) {
      Alert.alert("Atenção", "Selecione o cliente.");
      return;
    }
    if (selectedProducts.length === 0) {
      Alert.alert("Atenção", "Adicione pelo menos um produto.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        clienteId: selectedClient!.id,
        itens: selectedProducts.map((p) => ({
          produtoId: p.id,
          quantidade: p.quantity,
          valorUnitario: p.valorVenda,
        })),
        observacoes: "Orçamento gerado pelo app Smart Move",
        desconto: getDiscountValue(),
        status: "PENDENTE",
      };

      // 1. CHAMA API (Salva o Orçamento)
      const response = await fetch(`${API_URL}/orcamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível salvar o orçamento.");
      }

      // 2. GERA PDF E ABRE COMPARTILHAMENTO
      await handleGeneratePDFAndShare({
        client: selectedClient!,
        products: selectedProducts,
        discount: getDiscountValue(),
        subtotal: subtotal,
        totalValue: total,
      });

      // 3. FINALIZAÇÃO DA TELA
      Toast.show({
        type: "success",
        text1: "Orçamento finalizado e pronto para compartilhar!",
      });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      console.error("Erro ao finalizar orçamento:", error);
      Alert.alert(
        "Erro no Orçamento",
        error.message || "Ocorreu um erro inesperado ao salvar o orçamento."
      );
    } finally {
      setLoading(false);
    }
  };

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
          <FileText size={20} color={theme.colors.primaryForeground} />
          <Text style={styles.headerTitle}>Gerar Orçamento</Text>
        </View>
      </View>

      {/* CONTAINER PRINCIPAL: KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cliente */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cliente *</Text>
            {!selectedClient ? (
              <>
                <View style={styles.searchInputContainer}>
                  <Search
                    size={20}
                    color={theme.colors.foreground}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar cliente por nome ou CPF..."
                    value={clientSearch}
                    onChangeText={setClientSearch}
                  />
                </View>
                {loadingClients ? (
                  <ActivityIndicator style={{ marginVertical: 10 }} />
                ) : clientSearch.length > 0 ? (
                  <View>
                    {filteredClients.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.searchResult}
                        onPress={() => handleSelectClient(c)}
                      >
                        <Text style={styles.searchResultText}>{c.nome}</Text>
                        <Text style={styles.searchResultSubtext}>
                          CPF: {c.cpf || "Não informado"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.selectedItemContainer}>
                <View>
                  <Text style={styles.selectedItemText}>
                    {selectedClient.nome}
                  </Text>
                  <Text style={styles.selectedItemSubtext}>
                    CPF: {selectedClient.cpf || "Não informado"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedClient(null)}>
                  <X size={20} color={theme.colors.destructive} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Produtos */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Produtos *</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowProductModal(true)}
              >
                <Plus size={16} color="white" />
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
            {selectedProducts.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum produto adicionado.</Text>
            ) : (
              selectedProducts.map((p) => (
                <View key={p.id} style={styles.productItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.nome}</Text>
                    <Text style={styles.productDetails}>
                      R$ {formatCurrency(p.valorVenda)} x {p.quantity}
                    </Text>
                  </View>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      onPress={() =>
                        handleUpdateQuantity(p.id, (p.quantity || 1) - 1)
                      }
                    >
                      <Minus size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{p.quantity}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleUpdateQuantity(p.id, (p.quantity || 1) + 1)
                      }
                    >
                      <Plus size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveProduct(p.id)}>
                    <Trash2 size={20} color={theme.colors.destructive} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Desconto */}
          {selectedProducts.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Desconto e Resumo</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Desconto (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                />
              </View>

              {/* Resumo */}
              <View>
                <View style={styles.summaryRow}>
                  <Text>Subtotal</Text>
                  <Text>R$ {formatCurrency(subtotal)}</Text>
                </View>
                {getDiscountValue() > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.colors.destructive }}>
                      Desconto
                    </Text>
                    <Text style={{ color: theme.colors.destructive }}>
                      - R$ {formatCurrency(getDiscountValue())}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.summaryRow,
                    {
                      borderTopWidth: 1,
                      borderColor: "#eee",
                      paddingTop: 10,
                      marginTop: 10,
                    },
                  ]}
                >
                  <Text style={styles.totalText}>Total Estimado</Text>
                  <Text style={styles.totalText}>
                    R$ {formatCurrency(total)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Rodapé Fixo (MODIFICADO) */}
        {selectedProducts.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.finalizeButton,
                { flex: 1, backgroundColor: theme.colors.primary }, // <--- Botão ocupa todo o espaço
                (loading || !selectedClient || selectedProducts.length === 0) &&
                  styles.finalizeButtonDisabled,
              ]}
              onPress={handleFinalizeOrcamento} // <--- Chama a função unificada
              disabled={
                loading || !selectedClient || selectedProducts.length === 0
              }
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check size={20} color="white" />
                  <Text style={styles.finalizeButtonText}>
                    Finalizar Orçamento - R$ {formatCurrency(total)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Modal de Produtos */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Produtos</Text>
            <View style={styles.searchInputContainer}>
              <Search
                size={20}
                color={theme.colors.foreground}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar produto..."
                value={productSearch}
                onChangeText={setProductSearch}
              />
            </View>
            <ScrollView>
              {loadingProducts ? (
                <ActivityIndicator style={{ marginVertical: 10 }} />
              ) : (
                allProducts
                  .filter(
                    (p) =>
                      p.nome
                        .toLowerCase()
                        .includes(productSearch.toLowerCase()) && p.estoque > 0
                  )
                  .map((p) => (
                    <View key={p.id} style={styles.modalProductItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{p.nome}</Text>
                        <Text style={styles.productDetails}>
                          R$ {formatCurrency(p.valorVenda)} | Estoque:{" "}
                          {p.estoque}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddProduct(p)}
                      >
                        <Plus size={16} color="white" />
                        <Text style={styles.addButtonText}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProductModal(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { flex: 1 },
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
  scrollContainer: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 45, fontSize: 16 },
  searchResult: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchResultText: { fontSize: 16, color: theme.colors.primary },
  searchResultSubtext: { fontSize: 12, color: theme.colors.foreground },
  selectedItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(165, 164, 224, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  selectedItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  selectedItemSubtext: { fontSize: 12, color: theme.colors.foreground },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: "white", fontWeight: "bold" },
  emptyText: {
    textAlign: "center",
    color: theme.colors.foreground,
    paddingVertical: 20,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 10,
  },
  productName: { fontSize: 15, color: theme.colors.primary, flexWrap: "wrap" },
  productDetails: { fontSize: 12, color: theme.colors.foreground },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    padding: 4,
    gap: 12,
  },
  quantityText: { fontSize: 16, fontWeight: "bold" },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: "#E8E8EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalText: { fontSize: 18, fontWeight: "bold", color: theme.colors.primary },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E8E8EB",
    padding: 16,
  },
  footerButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  finalizeButton: {
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 15,
  },
  finalizeButtonDisabled: { opacity: 0.5 },
  finalizeButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 16,
  },
  modalProductItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    backgroundColor: theme.colors.muted,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
});
