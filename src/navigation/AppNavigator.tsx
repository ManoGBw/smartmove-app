import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

import { CadastroCliente } from "../screens/CadastroCliente";
import { CadastroFormaPagamento } from "../screens/CadastroFormaPagamento";
import { CadastroProduto } from "../screens/CadastroProduto";
import { CadastrosMenu } from "../screens/CadastrosMenu";
import { Dashboard } from "../screens/Dashboard";
import { ForgotPasswordScreen } from "../screens/ForgotPassword";
import { LoginScreen } from "../screens/LoginScreen";
import { RealizarVenda } from "../screens/RealizarVenda";
import { RegisterScreen } from "../screens/RegisterScreen";

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
    <AppStack.Screen name="CadastroCliente" component={CadastroCliente} />
    <AppStack.Screen name="CadastroProduto" component={CadastroProduto} />
    <AppStack.Screen
      name="CadastroFormaPagamento"
      component={CadastroFormaPagamento}
    />
    <AppStack.Screen name="RealizarVenda" component={RealizarVenda} />
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
