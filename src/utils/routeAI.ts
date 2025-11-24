// src/utils/routeAI.ts

import type { Cliente, Venda } from "../types/interfaces";

// --- Funções Auxiliares (Mantidas) ---

const getDaysDiff = (date1: Date, date2: Date) => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateNextPurchaseDate = (
  clientSales: Venda[]
): Date | null => {
  if (!clientSales || clientSales.length < 2) return null;

  const sortedSales = [...clientSales].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  let totalDays = 0;
  let intervals = 0;

  for (let i = 1; i < sortedSales.length; i++) {
    const prevDate = new Date(sortedSales[i - 1].data);
    const currDate = new Date(sortedSales[i].data);
    totalDays += getDaysDiff(prevDate, currDate);
    intervals++;
  }

  const averageInterval = totalDays / intervals;
  const lastPurchaseDate = new Date(sortedSales[sortedSales.length - 1].data);

  const nextDate = new Date(lastPurchaseDate);
  nextDate.setDate(nextDate.getDate() + averageInterval);

  return nextDate;
};

const toRad = (value: number) => (value * Math.PI) / 180;

export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- NOVA FUNÇÃO: Análise de Grupo Genérico ---
// Serve tanto para o Raio quanto para a Rota Cadastrada
export const analyzeClientGroup = (
  targetClients: Cliente[],
  allSales: Venda[]
) => {
  const today = new Date();
  const clientsWithProjections: { client: Cliente; daysUntil: number }[] = [];

  targetClients.forEach((client) => {
    const clientSales = allSales.filter((s) => s.clienteId === client.id);
    const nextDate = calculateNextPurchaseDate(clientSales);

    if (nextDate) {
      // Diferença real em dias (pode ser negativa se já passou da data)
      const diffReal =
        (nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
      clientsWithProjections.push({ client, daysUntil: diffReal });
    }
  });

  // Média das médias
  let avgDaysSum = 0;
  let count = 0;

  clientsWithProjections.forEach((item) => {
    avgDaysSum += item.daysUntil;
    count++;
  });

  // Se não houver histórico suficiente, sugere 7 dias por padrão
  const finalAvgDays = count > 0 ? avgDaysSum / count : 7;

  const suggestedDate = new Date();
  suggestedDate.setDate(
    suggestedDate.getDate() + Math.max(0, Math.ceil(finalAvgDays))
  );

  return {
    suggestedDate,
    averageDaysUntilPurchase: finalAvgDays,
    clientsCount: targetClients.length,
    analyzedCount: count, // Quantos tinham histórico para análise
  };
};

// --- Funções Específicas ---

// 1. Sugestão por Raio (Geolocalização)
export const generateSmartRoute = (
  baseClient: Cliente,
  allClients: Cliente[],
  allSales: Venda[],
  radiusKm: number
) => {
  // Filtra por distância
  const nearbyClients = allClients.filter((c) => {
    if (
      !c.latitude ||
      !c.longitude ||
      !baseClient.latitude ||
      !baseClient.longitude
    )
      return false;
    if (c.id === baseClient.id) return true;

    const dist = calculateDistanceKm(
      baseClient.latitude,
      baseClient.longitude,
      c.latitude,
      c.longitude
    );
    return dist <= radiusKm;
  });

  const analysis = analyzeClientGroup(nearbyClients, allSales);

  return {
    ...analysis,
    clients: nearbyClients,
    baseClient,
  };
};

// 2. Sugestão por Rota Cadastrada (Bairros)
// Recebe a lista de IDs de bairros da rota selecionada
export const generateRouteFromSaved = (
  bairroIds: number[],
  allClients: Cliente[],
  allSales: Venda[]
) => {
  // Filtra clientes que pertencem aos bairros da rota
  const routeClients = allClients.filter(
    (c) => c.bairroId && bairroIds.includes(c.bairroId)
  );

  const analysis = analyzeClientGroup(routeClients, allSales);

  return {
    ...analysis,
    clients: routeClients,
  };
};
