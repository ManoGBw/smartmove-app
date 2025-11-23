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

import * as Print from "expo-print"; // <--- ADICIONADO
import * as Sharing from "expo-sharing"; // <--- ADICIONADO

import { API_URL } from "../constants/config";

// --- NOVAS E ATUALIZADAS INTERFACES ---
interface Product {
  id: number; // Alterado para number
  nome: string; // Alterado de 'name' para 'nome'
  valorVenda: number; // Alterado de 'price' para 'valorVenda'
  estoque: number; // Alterado de 'stock' para 'estoque'
  quantity?: number;
}
interface Client {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  // Outros campos do cliente
}
interface PaymentMethod {
  id: number;
  nome: string;
  aceitaParcelamento: boolean; // Alterado de 'allowsInstallments' para 'aceitaParcelamento'
  status: string; // "Ativo" ou "Inativo"
}
interface SalePayment {
  id: string; // ID local para manipulação da lista
  formaPagamentoId: number;
  valorPago: string; // Manter como string formatada para o input
  parcelas: number;
}
// --- FIM DAS INTERFACES ---

type RealizarVendaProps = {
  navigation: {
    goBack: () => void;
  };
};

export function RealizarVenda({ navigation }: RealizarVendaProps) {
  const { token } = useAuth(); // Usar o token para a API

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);

  // --- NOVOS ESTADOS PARA PAGAMENTO E DADOS DA API ---
  const [payments, setPayments] = useState<SalePayment[]>([
    { id: String(Date.now()), formaPagamentoId: 0, valorPago: "", parcelas: 1 },
  ]);
  const [discount, setDiscount] = useState("");
  const [loading, setLoading] = useState(false);

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>(
    []
  );
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // --- ESTADO DE FOCO PARA CONTROLAR O SCROLL ---
  const [isInputFocused, setIsInputFocused] = useState(false);
  // ----------------------------------------------------

  // --- FUNÇÕES DE BUSCA DE DADOS NA API ---
  const fetchClients = useCallback(async () => {
    if (!token) return;
    setLoadingClients(true);
    try {
      const response = await fetch(`${API_URL}/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAllClients(data);
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
      setAllProducts(data);
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
      // Filtrar apenas métodos ativos
      setAllPaymentMethods(
        data.filter((pm: PaymentMethod) => pm.status === "Ativo")
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

  // --- LÓGICA DE NEGÓCIO ---
  const filteredClients = allClients.filter(
    (c) =>
      c.nome.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.cpf && c.cpf.includes(clientSearch))
  );
  const filteredProducts = allProducts.filter((p) =>
    p.nome.toLowerCase().includes(productSearch.toLowerCase())
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

  // Funções de Cálculo
  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    // Remove o separador de milhar e troca a vírgula por ponto
    const numberString = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(numberString) || 0;
  };
  const formatCurrency = (value: number): string =>
    (parseFloat(String(value)) || 0).toFixed(2).replace(".", ",");

  const getDiscountValue = () => parseCurrency(discount);

  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + p.valorVenda * (p.quantity || 1),
    0
  );
  const total = subtotal - getDiscountValue();
  const totalPaid = payments.reduce(
    (sum, p) => sum + parseCurrency(p.valorPago),
    0
  );
  const remaining = total - totalPaid;

  // Lógica de Múltiplos Pagamentos
  const handleAddPayment = () => {
    setPayments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        formaPagamentoId: 0,
        valorPago: "",
        parcelas: 1,
      },
    ]);
  };

  const handleRemovePayment = (id: string) => {
    if (payments.length === 1) {
      Alert.alert(
        "Atenção",
        "É necessário ter pelo menos uma forma de pagamento."
      );
      return;
    }
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // Função central para alterar o estado do pagamento (exceto valor do TextInput, que usa local)
  const handlePaymentChange = (
    id: string,
    field: keyof SalePayment,
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

  // --- FUNÇÃO PARA GERAR HTML DO PDF (ADAPTADA DO ORÇAMENTO) ---
  const createHtmlForSalePdf = (
    client: Client,
    products: Product[],
    payments: SalePayment[],
    discount: number,
    subtotal: number,
    totalValue: number,
    totalPaid: number,
    remaining: number
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
        <h2>Comprovante de Venda</h2>

        <h3>Cliente:</h3>
        <p>
          <strong>Nome:</strong> ${client.nome}<br/>
          <strong>CPF:</strong> ${client.cpf || "Não informado"}<br/>
          <strong>Telefone:</strong> ${client.telefone || "Não informado"}
        </p>

        <h3>Itens Vendidos:</h3>
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

        <h3>Pagamentos:</h3>
        <table>
          <thead>
            <tr>
              <th>Forma de Pagamento</th>
              <th>Parcelas</th>
              <th>Valor Pago</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRows}
          </tbody>
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
          <div class="summary-row total" style="border-top: 1px solid #ddd; padding-top: 5px; margin-top: 5px;"><span>Total da Venda:</span><span>R$ ${formatCurrency(
            totalValue
          )}</span></div>
          <div class="summary-row total"><span>Total Pago:</span><span>R$ ${formatCurrency(
            totalPaid
          )}</span></div>
          <div class="summary-row total" style="color: ${
            remaining > 0.01
              ? theme.colors.destructive
              : remaining < -0.01
              ? "green"
              : theme.colors.primary
          }"><span>Restante/Troco:</span><span>R$ ${formatCurrency(
      remaining
    )}</span></div>
        </div>
      </body>
    </html>
  `;
  };

  // --- FUNÇÃO PARA GERAR PDF E COMPARTILHAR (ADAPTADA DO ORÇAMENTO) ---
  const handleGeneratePDFAndShare = async (saleDetails: {
    client: Client;
    products: Product[];
    payments: SalePayment[];
    discount: number;
    subtotal: number;
    totalValue: number;
    totalPaid: number;
    remaining: number;
  }) => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(
        "Erro",
        "O compartilhamento não está disponível neste dispositivo."
      );
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

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        margins: { top: 30, right: 20, bottom: 20, left: 20 },
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartilhar Comprovante de Venda",
        UTI: ".pdf",
      });
    } catch (error) {
      console.error("Erro ao gerar/compartilhar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar e compartilhar o PDF.");
    }
  };
  // ------------------------------------------------------------------

  const handleFinalizeSale = async () => {
    if (loading) return;

    if (!selectedClient) {
      Alert.alert("Atenção", "Selecione o cliente.");
      return;
    }
    if (selectedProducts.length === 0) {
      Alert.alert("Atenção", "Adicione pelo menos um produto.");
      return;
    }
    if (
      payments.some(
        (p) => !p.formaPagamentoId || parseCurrency(p.valorPago) <= 0
      )
    ) {
      Alert.alert(
        "Atenção",
        "Selecione a forma de pagamento e insira o valor pago em todas as formas."
      );
      return;
    }
    if (Math.abs(remaining) > 0.01) {
      // Tolerância de 1 centavo para floating point
      Alert.alert(
        "Atenção",
        `O valor pago (R$ ${formatCurrency(
          totalPaid
        )}) não corresponde ao total (R$ ${formatCurrency(
          total
        )}). Restante: R$ ${formatCurrency(remaining)}.`
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
        observacoes: "Venda realizada pelo app Smart Move", // Hardcoded por enquanto
        desconto: getDiscountValue(),
        status: "CONCLUIDA",
        pagamentos: payments.map((p) => ({
          formaPagamentoId: p.formaPagamentoId,
          valorPago: parseCurrency(p.valorPago),
          parcelas: p.parcelas,
        })),
      };

      const response = await fetch(`${API_URL}/vendas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível finalizar a venda.");
      }

      // --- CHAMADA DA FUNÇÃO DE PDF E COMPARTILHAMENTO ---
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
      // -----------------------------------------------------

      Toast.show({ type: "success", text1: "Venda finalizada com sucesso!" });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      // Adicionado log de erro para facilitar a análise de um crash
      console.error("CRASH DEBUG: Erro ao finalizar venda:", error);
      Alert.alert(
        "Erro na Venda",
        error.message || "Ocorreu um erro inesperado ao salvar a venda."
      );
    } finally {
      setLoading(false);
    }
  };

  // Componente de Pagamento Individual (Refatorado para estado local de input)
  const PaymentInput = ({
    payment,
    index,
  }: {
    payment: SalePayment;
    index: number;
  }) => {
    // ESTADO LOCAL para gerenciar a digitação
    const [localValue, setLocalValue] = useState(
      payment.valorPago.replace(".", ",")
    );

    // Sincronizar localValue com o valor formatado do estado pai APÓS O BLUR/APÓS ATUALIZAÇÃO DO PAI
    useEffect(() => {
      const formattedParentValue = payment.valorPago.replace(".", ",");

      // A sincronização ocorre se o campo não estiver focado E o valor for diferente.
      if (!isInputFocused && localValue !== formattedParentValue) {
        setLocalValue(formattedParentValue);
      }
    }, [payment.valorPago, isInputFocused]); // localValue REMOVIDO do dep array.

    // --- FUNÇÃO handleLocalValueChange ---
    const handleLocalValueChange = (text: string) => {
      // Permite apenas números e a vírgula para a digitação.
      const cleanedText = text.replace(/[^0-9,]/g, "");
      setLocalValue(cleanedText);
      // Não atualiza o estado 'payments' aqui!
    };

    // --- LÓGICA DE FOCO E BLUR ---
    const handleFocus = () => {
      console.log(`[LOG DEBUG] FOCUS: ID ${payment.id}`);

      // CORREÇÃO FINAL: Deferir a atualização de estado global E a limpeza do valor
      // para o próximo ciclo de evento. Isso permite que o teclado nativo abra
      // completamente antes que o React forçe a re-renderização ou o bloqueio do scroll.
      setTimeout(() => {
        setIsInputFocused(true);

        // Remove a formatação ao entrar no campo para facilitar a digitação
        const rawValue = payment.valorPago.replace(/[^0-9,]/g, "");
        setLocalValue(rawValue);
      }, 0);
    };

    const handleBlur = () => {
      console.log(
        `[LOG DEBUG] BLUR: ID ${payment.id}, Valor digitado: ${localValue}`
      );

      // Deferir a atualização de estado global para que o scroll volte a funcionar no próximo ciclo
      setTimeout(() => setIsInputFocused(false), 0);

      // 1. Processamento e sanitização do valor local
      let cleanValue = localValue.replace(/[^0-9,]/g, "");
      const numericValue = parseCurrency(cleanValue);
      let finalValue = numericValue;

      // 2. Lógica de limite/sugestão
      if (payments.length === 1) {
        finalValue = Math.min(numericValue, total);
      }

      // 3. Atualiza o estado principal (do componente RealizarVenda) com o valor formatado
      handlePaymentChange(
        payment.id,
        "valorPago",
        formatCurrency(finalValue) // Envia o valor formatado ao pai
      );
    };
    // ----------------------------

    const selectedMethod = allPaymentMethods.find(
      (pm) => pm.id === payment.formaPagamentoId
    );
    const canInstallment = selectedMethod?.aceitaParcelamento || false;

    // Lógica de sugestão de valor (para placeholder)
    let defaultPaymentValue = parseCurrency(payment.valorPago);

    if (payments.length === 1 && total > 0) {
      defaultPaymentValue = total;
    } else if (payments.length > 1 && parseCurrency(payment.valorPago) === 0) {
      const totalOthers = payments
        .filter((p, i) => i !== index)
        .reduce((sum, p) => sum + parseCurrency(p.valorPago), 0);
      const remainingForSuggestion = total - totalOthers;
      defaultPaymentValue = Math.max(0, remainingForSuggestion);
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
                label: `${i + 1}x ${
                  parseCurrency(payment.valorPago) > 0
                    ? `de R$ ${(parseCurrency(payment.valorPago) / (i + 1))
                        .toFixed(2)
                        .replace(".", ",")}`
                    : ""
                }`,
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

  // --- JSX (Renderização da Tela) ---
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

      {/* CONTAINER PRINCIPAL: KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          // --- SCROLL CONTROLADO PARA EVITAR ROUBO DE FOCO ---
          scrollEnabled={!isInputFocused}
          // --------------------------------------------------
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
                      R${" "}
                      {(parseFloat(String(p.valorVenda)) || 0)
                        .toFixed(2)
                        .replace(".", ",")}{" "}
                      x {p.quantity}
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
              <Text style={styles.cardTitle}>Resumo da Venda</Text>
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
                <Text style={styles.totalText}>Total</Text>
                <Text style={styles.totalText}>R$ {formatCurrency(total)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.totalText}>Total Pago</Text>
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
                        remaining > 0.01
                          ? theme.colors.destructive
                          : remaining < -0.01
                          ? "green"
                          : theme.colors.primary,
                    },
                  ]}
                >
                  R$ {formatCurrency(remaining)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Rodapé Fixo (dentro do KeyboardAvoidingView) */}
        {selectedProducts.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.finalizeButton,
                (loading || !selectedClient || Math.abs(remaining) > 0.01) &&
                  styles.finalizeButtonDisabled,
              ]}
              onPress={handleFinalizeSale}
              disabled={
                loading || !selectedClient || Math.abs(remaining) > 0.01
              }
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check size={20} color="white" />
                  <Text style={styles.finalizeButtonText}>
                    Finalizar Venda - R$ {formatCurrency(total)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      {/* FIM DO CONTAINER PRINCIPAL */}

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
                filteredProducts.map((p) => (
                  <View key={p.id} style={styles.modalProductItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{p.nome}</Text>
                      <Text style={styles.productDetails}>
                        R${" "}
                        {(parseFloat(String(p.valorVenda)) || 0)
                          .toFixed(2)
                          .replace(".", ",")}{" "}
                        | Estoque: {p.estoque}
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
  contentContainer: { flex: 1 }, // Estilo mantido
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
  scrollContainer: { padding: 16, paddingBottom: 16 }, // Padding ajustado para o footer
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
  // --- NOVOS ESTILOS PARA PAGAMENTO ---
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
