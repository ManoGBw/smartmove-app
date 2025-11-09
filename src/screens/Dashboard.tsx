import {
  BarChart3,
  Bell,
  FileText,
  LogOut,
  Map,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/colors";

type DashboardProps = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

const menuItems = [
  {
    id: "realizar-venda",
    title: "Realizar Venda",
    subtitle: "Registrar nova venda",
    icon: ShoppingCart,
    color: "#2E1E43",
  },
  {
    id: "cadastros",
    title: "Cadastros",
    subtitle: "Clientes, produtos",
    icon: Users,
    color: "#A5A4E0",
  },
  {
    id: "estoque",
    title: "Estoque",
    subtitle: "Controle de produtos",
    icon: Package,
    color: "#2E1E43",
  },
  {
    id: "orcamento",
    title: "Orçamento",
    subtitle: "Criar orçamento",
    icon: FileText,
    color: "#A5A4E0",
  },
  {
    id: "rotas",
    title: "Rotas",
    subtitle: "Planejamento logístico",
    icon: Map,
    color: "#2E1E43",
  },
  {
    id: "relatorios",
    title: "Relatórios",
    subtitle: "Análises e dados",
    icon: BarChart3,
    color: "#A5A4E0",
  },
  {
    id: "configuracoes",
    title: "Configurações",
    subtitle: "Perfil e preferências",
    icon: Settings,
    color: "#2E1E43",
  },
];

export function Dashboard({ navigation }: DashboardProps) {
  const { user, logout } = useAuth();

  // Função para lidar com o clique nos itens do menu
  const handleMenuPress = (screenId: string) => {
    if (screenId === "cadastros") {
      navigation.navigate("CadastrosMenu");
    } else if (screenId === "realizar-venda") {
      navigation.navigate("RealizarVenda");
    } else if (screenId === "orcamento") {
      navigation.navigate("OrcamentoScreen");
    } else {
      // Para os outros botões que ainda não têm tela
      Alert.alert(
        "Em desenvolvimento",
        `A tela para '${screenId}' ainda não foi criada.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <Image source={require("../../assets/avatar.png")} />
          <View>
            <Text style={styles.headerTitle}> Smart Move Vendas</Text>
            <Text style={styles.headerSubtitle}>
              Bem-vindo, {user?.email || "usuário"}!
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={22} color={theme.colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={logout}>
            <LogOut size={22} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Menu Principal */}
        <View style={styles.section}>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => handleMenuPress(item.id)}
              >
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: item.color },
                  ]}
                >
                  <item.icon size={28} color="white" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f3",
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.muted, // Cor de fundo caso a imagem demore a carregar
    marginRight: theme.spacing.md,
    overflow: "hidden", // Garante que a imagem seja cortada no formato do círculo
  },
  avatarImage: {
    width: "10%",
    height: "10%",
    resizeMode: "cover",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.foreground,
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  scrollContainer: {
    padding: theme.spacing.lg,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    marginHorizontal: theme.spacing.sm / 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.foreground,
    marginTop: 4,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.primary,
    textAlign: "center",
  },
  menuSubtitle: {
    fontSize: 11,
    color: theme.colors.foreground,
    textAlign: "center",
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: "white",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  actionSubtitle: {
    fontSize: 13,
    color: theme.colors.foreground,
  },
});
