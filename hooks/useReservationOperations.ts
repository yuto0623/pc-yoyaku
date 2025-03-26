// hooks/useReservationOperations.ts
import type { Reservation } from "@prisma/client";
import { format } from "date-fns";
import { useCallback, useEffect, useReducer, useState } from "react";
import { toast } from "sonner";

type AllReservationsResponse = {
  reservations: Reservation[];
  byDate: Record<string, Reservation[]>;
  totalCount: number;
};

type ApiAction = {
  method: string;
  url: string;
  body?: any;
  successMessage?: string;
  errorMessage?: string;
};

// 日付をISO文字列から変換する汎用関数
const convertDates = (data: any[]): Reservation[] => {
  return data.map((item) => ({
    ...item,
    startTime: new Date(item.startTime),
    endTime: new Date(item.endTime),
  }));
};

/**
 * 予約の取得・作成・更新・削除を一元管理するカスタムフック
 */
export function useReservationOperations(date: Date) {
  // 日別および全予約のステート
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservationsData, setAllReservationsData] =
    useState<AllReservationsResponse | null>(null);

  // 操作状態のステート（単一のオブジェクトに統合）
  const [apiState, setApiState] = useState({
    loading: false,
    error: null as string | null,
  });

  /**
   * API呼び出しの汎用関数
   */
  const callApi = async ({
    method,
    url,
    body,
    successMessage,
    errorMessage,
  }: ApiAction) => {
    setApiState({ loading: true, error: null });

    try {
      const options: RequestInit = { method };

      if (body) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      if (successMessage) {
        toast.success(successMessage);
      }

      return await response.json();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : errorMessage || "操作に失敗しました";
      setApiState((prev) => ({ ...prev, error: message }));
      toast.error(message);
      throw err;
    } finally {
      setApiState((prev) => ({ ...prev, loading: false }));
    }
  };

  /**
   * 特定日の予約を取得
   */
  const _fetchReservations = useCallback(async () => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const data = await callApi({
        method: "GET",
        url: `/api/reservations?date=${dateStr}`,
        errorMessage: "予約データの取得に失敗しました",
      });

      const formattedData = convertDates(data);
      setReservations(formattedData);
      return formattedData;
    } catch (err) {
      console.error("予約取得エラー:", err);
      return [];
    }
  }, [date]);

  /**
   * すべての予約を取得
   */
  const _fetchAllReservations = useCallback(async () => {
    try {
      const data = await callApi({
        method: "GET",
        url: "/api/reservations/all",
        errorMessage: "全予約データの取得に失敗しました",
      });

      const formattedData = {
        reservations: convertDates(data.reservations),
        byDate: Object.entries(data.byDate).reduce(
          (acc, [date, reservations]) => {
            acc[date] = convertDates(reservations as any[]);
            return acc;
          },
          {} as Record<string, Reservation[]>
        ),
        totalCount: data.totalCount,
      };

      setAllReservationsData(formattedData);
      return formattedData;
    } catch (err) {
      console.error("全予約取得エラー:", err);
      return { reservations: [], byDate: {}, totalCount: 0 };
    }
  }, []);

  /**
   * 両方のデータセットを更新する公開関数
   */
  const refreshAllData = useCallback(async () => {
    setApiState((prev) => ({ ...prev, loading: true }));
    try {
      await Promise.all([_fetchReservations(), _fetchAllReservations()]);
      return true;
    } catch (err) {
      console.error("データ更新エラー:", err);
      return false;
    } finally {
      setApiState((prev) => ({ ...prev, loading: false }));
    }
  }, [_fetchReservations, _fetchAllReservations]);

  /**
   * 予約を作成
   */
  const createReservation = useCallback(
    async ({
      computerId,
      userName,
      startTime,
      endTime,
      notes,
    }: {
      computerId: string;
      userName: string;
      startTime: Date;
      endTime: Date;
      notes?: string;
    }) => {
      try {
        await callApi({
          method: "POST",
          url: "/api/reservations",
          body: {
            computerId,
            userName,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            notes,
          },
          successMessage: "予約を作成しました！",
          errorMessage: "予約の登録に失敗しました",
        });

        // 予約リストを更新
        await refreshAllData();
        return true;
      } catch (err) {
        return false;
      }
    },
    [refreshAllData]
  );

  /**
   * 予約を更新
   */
  const updateReservation = useCallback(
    async ({
      id,
      userName,
      startTime,
      endTime,
      notes,
    }: {
      id: string;
      userName: string;
      startTime: Date;
      endTime: Date;
      notes?: string;
    }) => {
      try {
        await callApi({
          method: "PUT",
          url: `/api/reservations/${id}`,
          body: {
            userName,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            notes,
          },
          successMessage: "予約を更新しました",
          errorMessage: "予約の更新に失敗しました",
        });

        // 予約リストを更新
        await refreshAllData();

        return true;
      } catch (err) {
        return false;
      }
    },
    [refreshAllData]
  );

  /**
   * 予約を削除
   */
  const deleteReservation = useCallback(
    async (id: string) => {
      try {
        await callApi({
          method: "DELETE",
          url: `/api/reservations/${id}`,
          successMessage: "予約を削除しました",
          errorMessage: "予約の削除に失敗しました",
        });

        // 予約リストを更新
        await refreshAllData();

        return true;
      } catch (err) {
        return false;
      }
    },
    [refreshAllData]
  );

  // 初期読み込み
  useEffect(() => {
    refreshAllData();
  }, [date, refreshAllData]);

  return {
    // データ
    reservations,
    allReservations: allReservationsData?.reservations || [],
    allReservationsByDate: allReservationsData?.byDate || {},

    // メソッド
    refreshData: refreshAllData,
    createReservation,
    updateReservation,
    deleteReservation,

    // 状態
    loading: apiState.loading,
    error: apiState.error,
  };
}
