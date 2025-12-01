import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  QueryConstraint,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Trade, TradeFilters, TradeMetrics } from "@/types/trade";

export const saveTrade = async (trade: Omit<Trade, "id">): Promise<string> => {
  try {
    const entry =
      trade.entryTime instanceof Date
        ? trade.entryTime
        : new Date(trade.entryTime);
    const exit =
      trade.exitTime instanceof Date ? trade.exitTime : new Date(trade.exitTime);

    const timeInTradeMinutes = Math.max(
      0,
      Math.round((exit.getTime() - entry.getTime()) / 60000)
    );

    const entryHour = entry.getHours();
    const dayOfWeek = entry.getDay();

    // Derive streaks and trade number from the most recent trade
    let winStreak = trade.winStreak ?? 0;
    let lossStreak = trade.lossStreak ?? 0;
    let tradeNumber = trade.tradeNumber ?? 1;

    try {
      const lastTradeSnapshot = await getDocs(
        query(collection(db, "trades"), orderBy("entryTime", "desc"), limit(1))
      );

      if (!lastTradeSnapshot.empty) {
        const lastData = lastTradeSnapshot.docs[0].data() as Partial<Trade> & {
          entryTime?: Timestamp;
          realizedPnL?: number;
        };

        const lastEntryDate =
          lastData.entryTime?.toDate() ??
          (lastData.entryTime ? new Date(lastData.entryTime as any) : null);

        const lastWasWin = (lastData.realizedPnL ?? 0) > 0;
        const thisIsWin = trade.realizedPnL > 0;
        const thisIsLoss = trade.realizedPnL < 0;

        if (thisIsWin) {
          winStreak = lastWasWin ? (lastData.winStreak ?? 0) + 1 : 1;
          lossStreak = 0;
        } else if (thisIsLoss) {
          const lastWasLoss = (lastData.realizedPnL ?? 0) < 0;
          lossStreak = lastWasLoss ? (lastData.lossStreak ?? 0) + 1 : 1;
          winStreak = 0;
        } else {
          // breakeven – keep previous streaks
          winStreak = lastData.winStreak ?? 0;
          lossStreak = lastData.lossStreak ?? 0;
        }

        if (lastEntryDate) {
          const sameDay = lastEntryDate.toDateString() === entry.toDateString();
          tradeNumber = sameDay ? (lastData.tradeNumber ?? 0) + 1 : 1;
        }
      }
    } catch (streakError) {
      console.warn("Unable to derive streaks from previous trade:", streakError);
    }

    const tradeData = {
      ...trade,
      entryTime: Timestamp.fromDate(entry),
      exitTime: Timestamp.fromDate(exit),
      entryHour,
      dayOfWeek,
      timeInTradeMinutes,
      winStreak,
      lossStreak,
      tradeNumber,
    };

    const docRef = await addDoc(collection(db, "trades"), tradeData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving trade:", error);
    throw error;
  }
};

export const getTrades = async (filters?: TradeFilters): Promise<Trade[]> => {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters?.strategyId) {
      constraints.push(where("strategyId", "==", filters.strategyId));
    }

    if (filters?.direction) {
      constraints.push(where("direction", "==", filters.direction));
    }

    if (filters?.isAdherent !== undefined && filters.isAdherent !== "") {
      constraints.push(where("isAdherent", "==", filters.isAdherent));
    }

    const q = query(collection(db, "trades"), ...constraints);
    const querySnapshot = await getDocs(q);

    let trades: Trade[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        entryTime: data.entryTime?.toDate() || new Date(data.entryTime),
        exitTime: data.exitTime?.toDate() || new Date(data.exitTime),
      } as Trade;
    });

    // Apply date range filter in memory (Firestore doesn't support multiple range queries easily)
    if (filters?.startDate) {
      const startDate = new Date(filters.startDate);
      trades = trades.filter(
        (trade) => new Date(trade.entryTime) >= startDate
      );
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      trades = trades.filter((trade) => new Date(trade.entryTime) <= endDate);
    }

    // Sort by entry time descending (newest first)
    trades.sort(
      (a, b) =>
        new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
    );

    return trades;
  } catch (error) {
    console.error("Error fetching trades:", error);
    throw error;
  }
};

export const calculateMetrics = (trades: Trade[]): TradeMetrics => {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      overallPnL: 0,
      winRate: 0,
      averageRR: 0,
      expectancy: 0,
      adherenceRate: 0,
    };
  }

  const totalTrades = trades.length;
  const overallPnL = trades.reduce((sum, trade) => sum + trade.realizedPnL, 0);
  const winningTrades = trades.filter((trade) => trade.realizedPnL > 0);
  const winRate = (winningTrades.length / totalTrades) * 100;
  const averageRR =
    trades.reduce((sum, trade) => sum + trade.realizedRR, 0) / totalTrades;

  // Calculate expectancy
  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.realizedRR, 0) /
        winningTrades.length
      : 0;
  const losingTrades = trades.filter((trade) => trade.realizedPnL < 0);
  const avgLoss =
    losingTrades.length > 0
      ? losingTrades.reduce((sum, trade) => sum + Math.abs(trade.realizedRR), 0) /
        losingTrades.length
      : 0;
  const lossRate = (losingTrades.length / totalTrades) * 100;
  const expectancy = (winRate / 100) * avgWin - (lossRate / 100) * avgLoss;

  const adherentTrades = trades.filter((trade) => trade.isAdherent);
  const adherenceRate = (adherentTrades.length / totalTrades) * 100;

  return {
    totalTrades,
    overallPnL,
    winRate: Number(winRate.toFixed(2)),
    averageRR: Number(averageRR.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    adherenceRate: Number(adherenceRate.toFixed(2)),
  };
};

export const getTradeById = async (id: string): Promise<Trade | null> => {
  try {
    const ref = doc(db, "trades", id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      entryTime: data.entryTime?.toDate() || new Date(data.entryTime),
      exitTime: data.exitTime?.toDate() || new Date(data.exitTime),
    } as Trade;
  } catch (error) {
    console.error("Error fetching trade by id:", error);
    throw error;
  }
};

export const updateTrade = async (
  id: string,
  trade: Omit<Trade, "id">
): Promise<void> => {
  try {
    const entry =
      trade.entryTime instanceof Date
        ? trade.entryTime
        : new Date(trade.entryTime);
    const exit =
      trade.exitTime instanceof Date ? trade.exitTime : new Date(trade.exitTime);

    const timeInTradeMinutes = Math.max(
      0,
      Math.round((exit.getTime() - entry.getTime()) / 60000)
    );

    const entryHour = entry.getHours();
    const dayOfWeek = entry.getDay();

    const tradeData = {
      ...trade,
      entryTime: Timestamp.fromDate(entry),
      exitTime: Timestamp.fromDate(exit),
      entryHour,
      dayOfWeek,
      timeInTradeMinutes,
    };

    const ref = doc(db, "trades", id);
    await updateDoc(ref, tradeData);
  } catch (error) {
    console.error("Error updating trade:", error);
    throw error;
  }
};

