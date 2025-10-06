// src/navigation/AppNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { ForgotPasswordScreen } from '../screens/ForgotPassword';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
// Importe outras telas aqui quando as converter
// import { Dashboard } from '../screens/Dashboard';

const Stack = createStackNavigator();

export function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            {/* Adicione outras telas aqui */}
            {/* <Stack.Screen name="Dashboard" component={Dashboard} /> */}
        </Stack.Navigator>
    );
}