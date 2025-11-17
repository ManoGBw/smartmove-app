// src/screens/EstoqueScreen.tsx

import { ArrowLeft, Package, Pencil, Plus, Search } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";

// URL base da API (já definida em outros arquivos)
const API_URL = "http://72.60.12.191:3006/api/v1";

interface Product {
  id: number;
  nome: string;
  marca: string | null;
  referencia: string | null;
  valorVenda: number;
  custo: number;
  estoque: number;
  status: string; // "ATIVO" ou "INATIVO"
}

type EstoqueScreenProps = {
  navigation: {
    addListener: (event: string, callback: () => void) => () => void;
    goBack: () => void;
    navigate: (screen: string, params?: object) => void; // <--- ADICIONADO navigate
  };
};

export function EstoqueScreen({ navigation }: EstoqueScreenProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Função de busca de produtos na API (reutilizada)
  const fetchProducts = useCallback(async () => {
    // ... (função inalterada)
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/produtos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Usando o token do contexto
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar os produtos.");
      }

      const data: Product[] = await response.json();

      // Filtra apenas produtos ATIVOS
      const activeProducts = data.filter((p) => p.status === "ATIVO");

      setProducts(activeProducts);
      setFilteredProducts(activeProducts); // Inicialmente, todos os produtos ativos são exibidos
    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error);
      Alert.alert(
        "Erro na Carga",
        error.message || "Ocorreu um erro ao buscar os produtos."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchProducts();
    const unsubscribe = navigation.addListener("focus", () => {
      void fetchProducts();
    });
    return unsubscribe;
  }, [fetchProducts, navigation]);

  // Função para filtrar a lista com base na pesquisa (reutilizada)
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.nome.toLowerCase().includes(query) ||
        (p.marca && p.marca.toLowerCase().includes(query)) ||
        (p.referencia && p.referencia.toLowerCase().includes(query))
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Função para formatar moeda (reutilizada)
  const formatCurrency = (value: number): string =>
    (parseFloat(String(value)) || 0).toFixed(2).replace(".", ",");

  // --- FUNÇÕES DE NAVEGAÇÃO ---
  const handleEditFullPress = (product: Product) => {
    // Navega para a tela de CadastroProduto em modo edição
    navigation.navigate("CadastroProduto", { productId: product.id });
  };

  const handleAddStockPress = (product: Product) => {
    navigation.navigate("AjusteEstoque", {
      productId: product.id,
      productName: product.nome,
      currentStock: product.estoque,
    });
  };
  // -----------------------------

  const ProductItem = ({ product }: { product: Product }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.nome}</Text>
        <Text style={styles.productDetail}>
          Marca: {product.marca || "N/A"} | Ref: {product.referencia || "N/A"}
        </Text>
        <Text style={styles.productPrice}>
          Valor: R$ {formatCurrency(product.valorVenda)} | Custo: R${" "}
          {formatCurrency(product.custo)}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        <View style={styles.productStockContainer}>
          <Text style={styles.stockLabel}>Estoque</Text>
          <Text style={styles.stockValue}>{product.estoque}</Text>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAddStockPress(product)}
        >
          <Plus size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditFullPress(product)}
        >
          <Pencil size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      {/* ------------------------ */}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header (sem alterações) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.colors.primaryForeground} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Package size={20} color={theme.colors.primaryForeground} />
          <Text style={styles.headerTitle}>Controle de Estoque</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Campo de Consulta/Busca (reutilizado) */}
        <View style={styles.searchCard}>
          <View style={styles.searchInputContainer}>
            <Search
              size={20}
              color={theme.colors.foreground}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Consultar produto por nome, marca ou referência..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Lista de Produtos (reutilizada) */}
        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 40 }}
            size="large"
            color={theme.colors.primary}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <ProductItem key={p.id} product={p} />
              ))
            ) : (
              <Text style={styles.emptyText}>
                Nenhum produto ativo encontrado com a sua busca.
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// Estilos (Modificados para incluir os botões de ação)
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
  content: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8EB",
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: "#000" },
  scrollContent: {
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.secondary,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  productDetail: {
    fontSize: 12,
    color: theme.colors.foreground,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    color: theme.colors.accentForeground,
    marginTop: 4,
  },
  productStockContainer: {
    alignItems: "center",
    padding: 8,
    backgroundColor: theme.colors.muted,
    borderRadius: 8,
    minWidth: 60,
    //marginRight: 10,
  },
  stockLabel: {
    fontSize: 10,
    color: theme.colors.mutedForeground,
    fontWeight: "500",
  },
  stockValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },

  actionsContainer: {
    flexDirection: "column",
    gap: 5,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: theme.colors.muted,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.foreground,
    marginTop: 40,
    fontSize: 16,
  },
});
