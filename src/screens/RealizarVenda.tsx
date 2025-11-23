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
import RNPickerSelect from "react-native-picker-select";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { API_URL } from "../constants/config";
import type {
  Cliente,
  FormaPagamento,
  Produto,
  ProdutoSelecionado,
  Venda, // <--- Assumindo que você tem essa interface exportada
  VendaPagamento,
} from "../types/interfaces";

type RealizarVendaProps = {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      venda?: Venda; // <--- Parâmetro para edição
    };
  };
};

export function RealizarVenda({ navigation, route }: RealizarVendaProps) {
  const { token } = useAuth();

  // Verifica se é edição
  const vendaEditar = route.params?.venda;
  const isEditing = !!vendaEditar;

  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    ProdutoSelecionado[]
  >([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);

  // --- ESTADOS PARA PAGAMENTO E DADOS ---
  const [payments, setPayments] = useState<VendaPagamento[]>([
    { id: 0, vendaId: 0, formaPagamentoId: 0, valorPago: "", parcelas: 1 },
  ]);
  const [discount, setDiscount] = useState("");
  const [loading, setLoading] = useState(false);

  const [allClients, setAllClients] = useState<Cliente[]>([]);
  const [allProducts, setAllProducts] = useState<Produto[]>([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState<FormaPagamento[]>(
    []
  );
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (isEditing && vendaEditar) {
      setSelectedClient(vendaEditar.cliente);

      const produtosMapeados: ProdutoSelecionado[] = vendaEditar.itens.map(
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

      if (vendaEditar.pagamentos && vendaEditar.pagamentos.length > 0) {
        const pagamentosMapeados: VendaPagamento[] = vendaEditar.pagamentos.map(
          (p) => ({
            id: p.id,
            vendaId: vendaEditar.id,
            formaPagamentoId: p.formaPagamentoId || 0,
            valorPago: parseFloat(String(p.valorPago || 0))
              .toFixed(2)
              .replace(".", ","),
            parcelas: p.parcelas,
          })
        );
        setPayments(pagamentosMapeados);
      }

      // 4. Preencher Desconto
      setDiscount(
        parseFloat(String(vendaEditar.desconto || 0))
          .toFixed(2)
          .replace(".", ",")
      );
    }
  }, [isEditing, vendaEditar]);

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

  const fetchPaymentMethods = useCallback(async () => {
    if (!token) return;
    setLoadingPayments(true);
    try {
      const response = await fetch(`${API_URL}/formas-pagamento`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAllPaymentMethods(
        data.filter((pm: FormaPagamento) => pm.status === "Ativo")
      );
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar formas de pagamento.");
    } finally {
      setLoadingPayments(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchPaymentMethods();
  }, [fetchClients, fetchProducts, fetchPaymentMethods]);

  // --- LÓGICA DE FILTROS ---
  const filteredClients = allClients.filter(
    (c) =>
      c.nome.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.documento && c.documento.includes(clientSearch))
  );
  const filteredProducts = allProducts.filter((p) =>
    p.nome.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSelectClient = (client: Cliente) => {
    setSelectedClient(client);
    setClientSearch("");
  };

  // --- LÓGICA DE QUANTIDADE (Ajustada para igualar OrcamentoScreen + Validação de Estoque) ---
  const handleAddProduct = (product: Produto) => {
    const existingIndex = selectedProducts.findIndex(
      (p) => p.id === product.id
    );

    if (existingIndex >= 0) {
      // Verifica estoque antes de incrementar
      const currentQty = selectedProducts[existingIndex].quantity || 0;
      const estoque = product.estoque || 0;
      if (currentQty + 1 > estoque) {
        Toast.show({ type: "error", text1: "Estoque insuficiente" });
        return;
      }

      // Se já existe, incrementa
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity += 1;
      setSelectedProducts(updatedProducts);
      Toast.show({ type: "success", text1: "Quantidade atualizada" });
    } else {
      const estoque = product.estoque || 0;
      if (estoque < 1) {
        Toast.show({ type: "error", text1: "Produto sem estoque" });
        return;
      }

      // Se não existe, cria novo
      const newProduct: ProdutoSelecionado = {
        ...product,
        quantity: 1,
      };
      setSelectedProducts((prev) => [...prev, newProduct]);
      Toast.show({ type: "success", text1: "Produto adicionado" });
    }
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    const product = allProducts.find((p) => p.id === productId);
    const estoque = product?.estoque || 0;

    if (newQuantity <= 0) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
      Toast.show({ type: "info", text1: "Produto removido" });
    } else {
      if (newQuantity > estoque) {
        Toast.show({ type: "error", text1: "Estoque insuficiente" });
        return;
      }
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, quantity: newQuantity } : p
        )
      );
    }
  };

  const handleRemoveProduct = (productId: number) => {
    handleUpdateQuantity(productId, 0);
  };

  // --- CÁLCULOS ---
  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    const numberString = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(numberString) || 0;
  };
  const formatCurrency = (value: number): string =>
    (parseFloat(String(value)) || 0).toFixed(2).replace(".", ",");

  const getDiscountValue = () => parseCurrency(discount);

  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + Number(p.valorVenda) * (p.quantity || 1),
    0
  );
  const total = subtotal - getDiscountValue();
  const totalPaid = payments.reduce(
    (sum, p) => sum + parseCurrency(p.valorPago),
    0
  );
  const remaining = total - totalPaid;

  // --- PAGAMENTOS ---
  const handleAddPayment = () => {
    setPayments((prev) => [
      ...prev,
      {
        id: Date.now(), // ID temporário
        vendaId: isEditing && vendaEditar ? vendaEditar.id : 0,
        formaPagamentoId: 0,
        valorPago: "",
        parcelas: 1,
      },
    ]);
  };

  const handleRemovePayment = (id: number) => {
    if (payments.length === 1) {
      Alert.alert(
        "Atenção",
        "É necessário ter pelo menos uma forma de pagamento."
      );
      return;
    }
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePaymentChange = (
    id: number,
    field: keyof VendaPagamento,
    value: string | number
  ) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const getPaymentMethodOptions = () =>
    allPaymentMethods.map((pm) => ({
      label: pm.nome,
      value: pm.id,
      aceitaParcelamento: pm.aceitaParcelamento,
    }));

  const getPaymentName = (id: number) => {
    const method = allPaymentMethods.find((pm) => pm.id === id);
    return method ? method.nome : "Desconhecida";
  };

  // --- PDF ---
  const createHtmlForSalePdf = (
    client: Cliente,
    products: Produto[],
    payments: VendaPagamento[],
    discount: number,
    subtotal: number,
    totalValue: number,
    totalPaid: number,
    remaining: number
  ) => {
    const productRows = (products as ProdutoSelecionado[])
      .map(
        (p) => `
    <tr>
      <td>${p.nome}</td>
      <td>${p.quantity}</td>
      <td>R$ ${formatCurrency(Number(p.valorVenda))}</td>
      <td>R$ ${formatCurrency(Number(p.valorVenda) * (p.quantity || 1))}</td>
    </tr>
  `
      )
      .join("");

    const paymentRows = payments
      .map(
        (p) => `
    <tr>
      <td>${getPaymentName(p.formaPagamentoId)}</td>
      <td>${p.parcelas}x</td>
      <td>R$ ${formatCurrency(parseCurrency(p.valorPago))}</td>
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
        <h1>Smart Move Vendas</h1>
        <h2>${isEditing ? "Atualização de Venda" : "Comprovante de Venda"}</h2>

        <h3>Cliente:</h3>
        <p>
          <strong>Nome:</strong> ${client.nome}<br/>
          <strong>Documento:</strong> ${
            client.documento || "Não informado"
          }<br/>
        </p>

        <h3>Itens:</h3>
        <table>
          <thead><tr><th>Produto</th><th>Qtd.</th><th>Valor Unit.</th><th>Subtotal</th></tr></thead>
          <tbody>${productRows}</tbody>
        </table>

        <h3>Pagamentos:</h3>
        <table>
          <thead><tr><th>Forma</th><th>Parc.</th><th>Valor</th></tr></thead>
          <tbody>${paymentRows}</tbody>
        </table>

        <h3>Resumo:</h3>
        <div class="summary">
          <div class="summary-row"><span>Subtotal:</span><span>R$ ${formatCurrency(
            subtotal
          )}</span></div>
          <div class="summary-row" style="color: ${
            theme.colors.destructive
          }"><span>Desconto:</span><span>- R$ ${formatCurrency(
      discount
    )}</span></div>
          <div class="summary-row total"><span>Total:</span><span>R$ ${formatCurrency(
            totalValue
          )}</span></div>
        </div>
      </body>
    </html>
  `;
  };

  const handleGeneratePDFAndShare = async (saleDetails: any) => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Erro", "Compartilhamento indisponível.");
      return;
    }
    try {
      const htmlContent = createHtmlForSalePdf(
        saleDetails.client,
        saleDetails.products,
        saleDetails.payments,
        saleDetails.discount,
        saleDetails.subtotal,
        saleDetails.totalValue,
        saleDetails.totalPaid,
        saleDetails.remaining
      );
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: ".pdf",
      });
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar PDF.");
    }
  };

  // --- FINALIZAR / SALVAR ---
  const handleFinalizeSale = async () => {
    if (loading) return;

    if (!selectedClient) {
      Alert.alert("Atenção", "Selecione o cliente.");
      return;
    }
    if (selectedProducts.length === 0) {
      Alert.alert("Atenção", "Adicione produtos.");
      return;
    }
    if (
      payments.some(
        (p) => !p.formaPagamentoId || parseCurrency(p.valorPago) <= 0
      )
    ) {
      Alert.alert("Atenção", "Verifique as formas de pagamento e valores.");
      return;
    }
    if (Math.abs(remaining) > 0.01) {
      Alert.alert(
        "Atenção",
        `Valores não batem. Restante: R$ ${formatCurrency(remaining)}.`
      );
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
        observacoes: "Venda app",
        desconto: getDiscountValue(),
        status: "CONCLUIDA",
        pagamentos: payments.map((p) => ({
          formaPagamentoId: p.formaPagamentoId,
          valorPago: parseCurrency(p.valorPago),
          parcelas: p.parcelas,
        })),
      };

      let url = `${API_URL}/vendas`;
      let method = "POST";

      if (isEditing && vendaEditar) {
        url = `${API_URL}/vendas/${vendaEditar.id}`;
        method = "PUT"; // Alterado para PUT na edição
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao salvar a venda.");
      }

      await handleGeneratePDFAndShare({
        client: selectedClient,
        products: selectedProducts,
        payments: payments,
        discount: getDiscountValue(),
        subtotal: subtotal,
        totalValue: total,
        totalPaid: totalPaid,
        remaining: remaining,
      });

      Toast.show({
        type: "success",
        text1: isEditing ? "Venda atualizada!" : "Venda finalizada!",
      });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENTE INPUT DE PAGAMENTO ---
  const PaymentInput = ({
    payment,
    index,
  }: {
    payment: VendaPagamento;
    index: number;
  }) => {
    const [localValue, setLocalValue] = useState(
      payment.valorPago.replace(".", ",")
    );

    useEffect(() => {
      const formattedParentValue = payment.valorPago.replace(".", ",");
      if (!isInputFocused && localValue !== formattedParentValue) {
        setLocalValue(formattedParentValue);
      }
    }, [payment.valorPago, isInputFocused]);

    const handleLocalValueChange = (text: string) => {
      const cleanedText = text.replace(/[^0-9,]/g, "");
      setLocalValue(cleanedText);
    };

    const handleFocus = () => {
      setTimeout(() => {
        setIsInputFocused(true);
        const rawValue = payment.valorPago.replace(/[^0-9,]/g, "");
        setLocalValue(rawValue);
      }, 0);
    };

    const handleBlur = () => {
      setTimeout(() => setIsInputFocused(false), 0);
      let cleanValue = localValue.replace(/[^0-9,]/g, "");
      const numericValue = parseCurrency(cleanValue);
      let finalValue = numericValue;

      // Sugestão de valor para completar o total
      if (payments.length === 1) {
        finalValue = Math.min(numericValue, total);
      }

      handlePaymentChange(payment.id, "valorPago", formatCurrency(finalValue));
    };

    const selectedMethod = allPaymentMethods.find(
      (pm) => pm.id === payment.formaPagamentoId
    );
    const canInstallment = selectedMethod?.aceitaParcelamento || false;

    // Placeholder inteligente
    let defaultPaymentValue = parseCurrency(payment.valorPago);
    if (payments.length === 1 && total > 0) {
      defaultPaymentValue = total;
    } else if (payments.length > 1 && parseCurrency(payment.valorPago) === 0) {
      const totalOthers = payments
        .filter((p, i) => i !== index)
        .reduce((sum, p) => sum + parseCurrency(p.valorPago), 0);
      defaultPaymentValue = Math.max(0, total - totalOthers);
    }

    return (
      <View style={styles.paymentItemCard}>
        <View style={styles.paymentItemHeader}>
          <Text style={styles.paymentItemTitle}>Pagamento #{index + 1}</Text>
          <TouchableOpacity
            onPress={() => handleRemovePayment(payment.id)}
            disabled={payments.length === 1}
          >
            <Trash2
              size={20}
              color={
                payments.length === 1
                  ? theme.colors.foreground
                  : theme.colors.destructive
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Forma de Pagamento *</Text>
          {loadingPayments ? (
            <ActivityIndicator />
          ) : (
            <RNPickerSelect
              onValueChange={(value) =>
                handlePaymentChange(payment.id, "formaPagamentoId", value)
              }
              items={getPaymentMethodOptions()}
              placeholder={{ label: "Selecione...", value: 0 }}
              style={pickerSelectStyles}
              value={payment.formaPagamentoId}
            />
          )}
        </View>

        {canInstallment && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parcelas</Text>
            <RNPickerSelect
              onValueChange={(v) =>
                handlePaymentChange(payment.id, "parcelas", v)
              }
              items={[...Array(12)].map((_, i) => ({
                label: `${i + 1}x`,
                value: i + 1,
              }))}
              placeholder={{ label: "1x à vista", value: 1 }}
              style={pickerSelectStyles}
              value={payment.parcelas}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valor Pago (R$) *</Text>
          <TextInput
            style={styles.input}
            placeholder={formatCurrency(defaultPaymentValue)}
            value={localValue}
            onChangeText={handleLocalValueChange}
            keyboardType="numeric"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </View>
      </View>
    );
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
          <Text style={styles.headerTitle}>
            {isEditing ? `Editar Venda #${vendaEditar?.id}` : "Realizar Venda"}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isInputFocused}
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
                    placeholder="Buscar cliente..."
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
                        <Text style={styles.searchResultText}>{c.nome}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.selectedItemContainer}>
                <View>
                  <Text style={styles.selectedItemText}>
                    {selectedClient.nome}
                  </Text>
                  <Text style={styles.selectedItemSubtext}>
                    {selectedClient.documento}
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
                      R$ {Number(p.valorVenda).toFixed(2).replace(".", ",")} x{" "}
                      {p.quantity}
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
              <Text style={styles.cardTitle}>Pagamento *</Text>
              {payments.map((p, index) => (
                <PaymentInput key={p.id} payment={p} index={index} />
              ))}
              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleAddPayment}
              >
                <Text
                  style={[
                    styles.linkButtonText,
                    { color: theme.colors.accent },
                  ]}
                >
                  + Adicionar forma de pagamento
                </Text>
              </TouchableOpacity>

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
              <Text style={styles.cardTitle}>Resumo</Text>
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
              <View style={[styles.summaryRow, { marginTop: 10 }]}>
                <Text style={styles.totalText}>Total</Text>
                <Text style={styles.totalText}>R$ {formatCurrency(total)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.totalText}>Pago</Text>
                <Text style={styles.totalText}>
                  R$ {formatCurrency(totalPaid)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.totalText}>Restante</Text>
                <Text
                  style={[
                    styles.totalText,
                    {
                      color:
                        remaining > 0.01 ? theme.colors.destructive : "green",
                    },
                  ]}
                >
                  R$ {formatCurrency(remaining)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {selectedProducts.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.finalizeButton,
                (loading || Math.abs(remaining) > 0.01) &&
                  styles.finalizeButtonDisabled,
              ]}
              onPress={handleFinalizeSale}
              disabled={loading || Math.abs(remaining) > 0.01}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check size={20} color="white" />
                  <Text style={styles.finalizeButtonText}>
                    {isEditing
                      ? "Salvar Alterações"
                      : `Finalizar - R$ ${formatCurrency(total)}`}
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
              {filteredProducts.map((p) => (
                <View key={p.id} style={styles.modalProductItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.nome}</Text>
                    <Text style={styles.productDetails}>
                      R$ {Number(p.valorVenda).toFixed(2).replace(".", ",")} |
                      Est: {p.estoque}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddProduct(p)}
                  >
                    <Plus size={16} color="white" />
                    <Text style={styles.addButtonText}>Add</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    padding: 16,
    paddingTop: 40,
  },
  headerButton: { padding: 8 },
  headerTitleContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    color: theme.colors.primaryForeground,
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: { padding: 16, paddingBottom: 16 },
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
  paymentItemCard: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  paymentItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  paymentItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  linkButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 4,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { ...styles.input },
  inputAndroid: { ...styles.input },
});
