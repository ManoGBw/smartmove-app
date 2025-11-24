// src/context/AuthContext.tsx

import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/config";

// Definindo os tipos para os dados do usuário e o contexto
interface User {
  id: number;
  email: string;
  status: string;
  nome?: string;
  raio?: number;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ao iniciar o app, verifica se já existe um token salvo
    async function loadStorageData() {
      const storedToken = await SecureStore.getItemAsync("user_token");
      const storedUser = await SecureStore.getItemAsync("user_data");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), senha: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "E-mail ou senha inválidos.");
      }

      // Salva o usuário e o token no estado
      setUser(data.usuario);
      setToken(data.token);

      // Salva os dados de forma segura no dispositivo
      await SecureStore.setItemAsync("user_token", data.token);
      await SecureStore.setItemAsync("user_data", JSON.stringify(data.usuario));
    } catch (error: any) {
      console.error("Erro no login:", error);
      Alert.alert("Erro ao Fazer Login", error.message);
      // Garante que o erro seja propagado para a tela de login
      throw error;
    }
  };

  const logout = async () => {
    // Limpa os dados do estado
    setUser(null);
    setToken(null);

    // Limpa os dados do armazenamento seguro
    await SecureStore.deleteItemAsync("user_token");
    await SecureStore.deleteItemAsync("user_data");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
