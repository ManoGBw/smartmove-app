// src/screens/RealizarVenda.tsx

import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import Toast from "react-native-toast-message";
import { theme } from "../theme/colors";

// Tipos de dados (podem ser movidos para um arquivo de tipos no futuro)
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  quantity?: number;
}
interface Client {
  id: string;
  name: string;
  cpf: string;
  phone: string;
}
interface PaymentMethod {
  id: string;
  description: string;
  type: "a vista" | "a prazo";
  allowsInstallments: boolean;
}

// Mock data (substituir por chamadas de API no futuro)
const mockClients: Client[] = [
  {
    id: "1",
    name: "João Silva",
    cpf: "123.456.789-00",
    phone: "(11) 98765-4321",
  },
  {
    id: "2",
    name: "Maria Santos",
    cpf: "987.654.321-00",
    phone: "(11) 91234-5678",
  },
];
const mockProducts: Product[] = [
  { id: "1", name: "Notebook Dell Inspiron", price: 2999.9, stock: 10 },
  { id: "2", name: "Mouse Logitech MX Master", price: 349.9, stock: 25 },
  { id: "3", name: "Teclado Mecânico Keychron", price: 599.0, stock: 15 },
];
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    description: "Dinheiro",
    type: "a vista",
    allowsInstallments: false,
  },
  { id: "2", description: "PIX", type: "a vista", allowsInstallments: false },
  {
    id: "3",
    description: "Cartão de Débito",
    type: "a vista",
    allowsInstallments: false,
  },
  {
    id: "4",
    description: "Cartão de Crédito",
    type: "a prazo",
    allowsInstallments: true,
  },
];

type RealizarVendaProps = {
  navigation: {
    goBack: () => void;
  };
};

export function RealizarVenda({ navigation }: RealizarVendaProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [installments, setInstallments] = useState(1);
  const [discount, setDiscount] = useState("");

  // --- Lógica de Negócio (quase idêntica à versão web) ---
  const filteredClients = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.cpf.includes(clientSearch)
  );
  const filteredProducts = mockProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch("");
  };
  const handleAddProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.id === product.id);
    if (existing) {
      if ((existing.quantity || 0) < product.stock) {
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
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const product = mockProducts.find((p) => p.id === productId);
    if (newQuantity <= 0) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
      Toast.show({ type: "info", text1: "Produto removido" });
    } else if (product && newQuantity <= product.stock) {
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, quantity: newQuantity } : p
        )
      );
    } else {
      Toast.show({ type: "error", text1: "Estoque insuficiente" });
    }
  };
  const handleRemoveProduct = (productId: string) => {
    handleUpdateQuantity(productId, 0);
  };
  const getDiscountValue = () => parseFloat(discount.replace(",", ".")) || 0;
  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + p.price * (p.quantity || 1),
    0
  );
  const total = subtotal - getDiscountValue();
  const selectedPaymentMethod = mockPaymentMethods.find(
    (pm) => pm.id === paymentMethod
  );
  const canInstallment = selectedPaymentMethod?.allowsInstallments || false;
  const installmentValue = total / installments;

  const handleFinalizeSale = () => {
    if (!selectedClient || selectedProducts.length === 0 || !paymentMethod) {
      Alert.alert(
        "Atenção",
        "Preencha todos os campos obrigatórios (Cliente, Produto, Pagamento)."
      );
      return;
    }
    Toast.show({ type: "success", text1: "Venda realizada com sucesso!" });
    setTimeout(() => navigation.goBack(), 1500);
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
          <ShoppingCart size={20} color={theme.colors.primaryForeground} />
          <Text style={styles.headerTitle}>Realizar Venda</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Cliente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
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
              {clientSearch.length > 0 && (
                <View>
                  {filteredClients.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.searchResult}
                      onPress={() => handleSelectClient(c)}
                    >
                      <Text style={styles.searchResultText}>{c.name}</Text>
                      <Text style={styles.searchResultSubtext}>
                        CPF: {c.cpf}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.selectedItemContainer}>
              <View>
                <Text style={styles.selectedItemText}>
                  {selectedClient.name}
                </Text>
                <Text style={styles.selectedItemSubtext}>
                  CPF: {selectedClient.cpf}
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
            <Text style={styles.cardTitle}>Produtos</Text>
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
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productDetails}>
                    R$ {p.price.toFixed(2)} x {p.quantity}
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

        {/* Pagamento */}
        {selectedProducts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pagamento</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Forma de Pagamento *</Text>
              <RNPickerSelect
                onValueChange={setPaymentMethod}
                items={mockPaymentMethods.map((pm) => ({
                  label: pm.description,
                  value: pm.id,
                }))}
                placeholder={{ label: "Selecione...", value: null }}
                style={pickerSelectStyles}
              />
            </View>
            {canInstallment && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parcelas</Text>
                <RNPickerSelect
                  onValueChange={(v) => setInstallments(v)}
                  items={[...Array(12)].map((_, i) => ({
                    label: `${i + 1}x de R$ ${(total / (i + 1)).toFixed(2)}`,
                    value: i + 1,
                  }))}
                  placeholder={{}}
                  style={pickerSelectStyles}
                />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Desconto (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Resumo */}
        {selectedProducts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumo da Venda</Text>
            <View style={styles.summaryRow}>
              <Text>Subtotal</Text>
              <Text>R$ {subtotal.toFixed(2)}</Text>
            </View>
            {getDiscountValue() > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: theme.colors.destructive }}>
                  Desconto
                </Text>
                <Text style={{ color: theme.colors.destructive }}>
                  - R$ {getDiscountValue().toFixed(2)}
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
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalText}>R$ {total.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Rodapé Fixo */}
      {selectedProducts.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.finalizeButton,
              (!selectedClient || !paymentMethod) &&
                styles.finalizeButtonDisabled,
            ]}
            onPress={handleFinalizeSale}
            disabled={!selectedClient || !paymentMethod}
          >
            <Check size={20} color="white" />
            <Text style={styles.finalizeButtonText}>
              Finalizar Venda - R$ {total.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
              {filteredProducts.map((p) => (
                <View key={p.id} style={styles.modalProductItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productDetails}>
                      R$ {p.price.toFixed(2)} | Estoque: {p.stock}
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
              ))}
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
  finalizeButton: {
    backgroundColor: theme.colors.primary,
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  finalizeButtonDisabled: { opacity: 0.5 },
  finalizeButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
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

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { ...styles.input },
  inputAndroid: { ...styles.input },
});
