import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext'; // 1. IMPORTE O PROVIDER
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
    return (
        <AuthProvider>
            <SafeAreaProvider>
                <NavigationContainer>
                    <AppNavigator />
                    <StatusBar style="auto" />
                </NavigationContainer>
            </SafeAreaProvider>
        </AuthProvider>
    );
}