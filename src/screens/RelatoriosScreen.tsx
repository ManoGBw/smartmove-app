import {
  ArrowLeft,
  BarChart3,
  PackageX,
  TrendingUp,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../constants/config";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";
import type { Cliente, Produto, Venda } from "../types/interfaces";

export function RelatoriosScreen({ navigation }: any) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados dos Indicadores
  const [totalVendidoMes, setTotalVendidoMes] = useState(0);
  const [totalClientesAtivos, setTotalClientesAtivos] = useState(0);
  const [produtosSemEstoque, setProdutosSemEstoque] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);

  // --- BUSCA E CÁLCULO DE DADOS ---
  const fetchDados = useCallback(async () => {
    if (!token) return;

    try {
      // Buscamos tudo em paralelo para ser mais rápido
      const [resVendas, resClientes, resProdutos] = await Promise.all([
        fetch(`${API_URL}/vendas`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "json" },
        }),
        fetch(`${API_URL}/clientes`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "json" },
        }),
        fetch(`${API_URL}/produtos`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "json" },
        }),
      ]);

      if (!resVendas.ok || !resClientes.ok || !resProdutos.ok) {
        throw new Error("Falha ao buscar dados");
      }

      const dataVendas: Venda[] = await resVendas.json();
      const dataClientes = await resClientes.json();
      const dataProdutos: Produto[] = await resProdutos.json();

      // Ajuste caso sua API retorne { data: [...] }
      const listaVendas: Venda[] = Array.isArray(dataVendas)
        ? dataVendas
        : (dataVendas as any).data || [];
      const listaClientes: Cliente[] = Array.isArray(dataClientes)
        ? dataClientes
        : (dataClientes as any).data || [];
      const listaProdutos: Produto[] = Array.isArray(dataProdutos)
        ? dataProdutos
        : (dataProdutos as any).data || [];

      // 1. Calcular Total Vendido no Mês Atual
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      const vendasDoMes = listaVendas.filter((v) => {
        const dataVenda = new Date(v.data);
        // Considera apenas vendas não canceladas, se houver status
        const statusOk = v.status !== "CANCELADA";
        return (
          statusOk &&
          dataVenda.getMonth() === mesAtual &&
          dataVenda.getFullYear() === anoAtual
        );
      });

      const totalValor = vendasDoMes.reduce(
        (acc, curr) => acc + Number(curr.valorTotal),
        0
      );
      setTotalVendidoMes(totalValor);

      // 2. Ticket Médio (Vendas do Mês)
      setTicketMedio(
        vendasDoMes.length > 0 ? totalValor / vendasDoMes.length : 0
      );

      // 3. Clientes Ativos
      const ativos = listaClientes.filter((c) => c.status === "ATIVO").length;
      setTotalClientesAtivos(ativos);

      // 4. Produtos Sem Estoque (ou Estoque Baixo)
      const semEstoque = listaProdutos.filter(
        (p) => Number(p.estoque) <= 0
      ).length;
      setProdutosSemEstoque(semEstoque);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível atualizar os relatórios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDados();
  };

  // Componente de Card Interno
  const SummaryCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon size={24} color="white" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatórios Gerenciais</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <View style={styles.grid}>
            {/* Card 1: Vendas do Mês */}
            <SummaryCard
              title="Vendas este Mês"
              value={formatCurrency(totalVendidoMes)}
              icon={BarChart3}
              color={theme.colors.primary}
              subtitle="Total bruto acumulado"
            />

            {/* Card 2: Ticket Médio */}
            <SummaryCard
              title="Ticket Médio"
              value={formatCurrency(ticketMedio)}
              icon={TrendingUp}
              color="#2E8B57" // SeaGreen
              subtitle="Média por venda (Mês)"
            />

            {/* Card 3: Clientes Ativos */}
            <SummaryCard
              title="Clientes Ativos"
              value={totalClientesAtivos}
              icon={Users}
              color={theme.colors.secondary}
              subtitle="Base de clientes ativa"
            />

            {/* Card 4: Estoque Crítico */}
            <SummaryCard
              title="Produtos s/ Estoque"
              value={produtosSemEstoque}
              icon={PackageX}
              color={theme.colors.destructive}
              subtitle="Itens zerados na base"
            />
          </View>
        )}

        <Text style={styles.footerInfo}>
          * Dados calculados com base nos registros atuais do sistema. Arraste
          para baixo para atualizar.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },
  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  content: { padding: 16 },
  grid: { gap: 16 },

  // Estilos do Card
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: { flex: 1 },
  cardValue: { fontSize: 24, fontWeight: "bold", color: "#333" },
  cardTitle: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  cardSubtitle: { fontSize: 12, color: "#888", marginTop: 2 },

  footerInfo: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 30,
    marginBottom: 20,
  },
});
