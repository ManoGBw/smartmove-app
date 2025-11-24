import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

import { AjusteEstoqueScreen } from "../screens/AjusteEstoqueScreen";
import { CadastroBairro } from "../screens/CadastroBairro";
import { CadastroCliente } from "../screens/CadastroCliente";
import { CadastroFormaPagamento } from "../screens/CadastroFormaPagamento";
import { CadastroProduto } from "../screens/CadastroProduto";
import { CadastroRota } from "../screens/CadastroRota";
import { CadastrosMenu } from "../screens/CadastrosMenu";
import { ConfiguracoesScreen } from "../screens/ConfiguracoesScreen";
import { ConsultaBairro } from "../screens/ConsultaBairro";
import { ConsultaCliente } from "../screens/ConsultaCliente";
import { ConsultaMenu } from "../screens/ConsultaMenu";
import { ConsultaOrcamento } from "../screens/ConsultaOrcamento";
import { ConsultaRota } from "../screens/ConsultaRota";
import { ConsultaVenda } from "../screens/ConsultaVenda";
import { Dashboard } from "../screens/Dashboard";
import { EstoqueScreen } from "../screens/EstoqueScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPassword";
import { LoginScreen } from "../screens/LoginScreen";
import { OrcamentoScreen } from "../screens/OrcamentoScreen";
import { PlanejamentoRotas } from "../screens/PlanejamentoRotas";
import { RealizarVenda } from "../screens/RealizarVenda";
import { RegisterScreen } from "../screens/RegisterScreen";
import { RelatoriosScreen } from "../screens/RelatoriosScreen";

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

const AuthRoutes = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

const AppRoutes = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="Dashboard" component={Dashboard} />
    <AppStack.Screen name="CadastrosMenu" component={CadastrosMenu} />
    <AppStack.Screen name="ConsultaMenu" component={ConsultaMenu} />
    <AppStack.Screen name="CadastroCliente" component={CadastroCliente} />
    <AppStack.Screen name="CadastroProduto" component={CadastroProduto} />
    <AppStack.Screen name="AjusteEstoque" component={AjusteEstoqueScreen} />
    <AppStack.Screen
      name="CadastroFormaPagamento"
      component={CadastroFormaPagamento}
    />
    <AppStack.Screen name="ConsultaCliente" component={ConsultaCliente} />
    <AppStack.Screen name="RealizarVenda" component={RealizarVenda} />
    <AppStack.Screen name="OrcamentoScreen" component={OrcamentoScreen} />
    <AppStack.Screen name="EstoqueScreen" component={EstoqueScreen} />
    <AppStack.Screen name="CadastroBairro" component={CadastroBairro} />
    <AppStack.Screen name="ConsultaBairro" component={ConsultaBairro} />
    <AppStack.Screen name="ConsultaRota" component={ConsultaRota} />
    <AppStack.Screen name="CadastroRota" component={CadastroRota} />
    <AppStack.Screen name="PlanejamentoRotas" component={PlanejamentoRotas} />
    <AppStack.Screen name="RelatoriosScreen" component={RelatoriosScreen} />
    <AppStack.Screen name="ConsultaOrcamento" component={ConsultaOrcamento} />
    <AppStack.Screen name="ConsultaVenda" component={ConsultaVenda} />
    <AppStack.Screen
      name="ConfiguracoesScreen"
      component={ConfiguracoesScreen}
    />
  </AppStack.Navigator>
);

export function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Se tiver token, mostra as telas do app. Se não, mostra as de autenticação.
  return token ? <AppRoutes /> : <AuthRoutes />;
}
