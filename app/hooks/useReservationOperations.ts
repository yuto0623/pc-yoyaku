import type { Reservation } from "@prisma/client";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ReservationOperationStatus = {
	isFetching: boolean;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
};

type ReservationOperationErrors = {
	fetchError: string | null;
	createError: string | null;
	updateError: string | null;
	deleteError: string | null;
};

type CreateReservationParams = {
	computerId: string;
	userName: string;
	startTime: Date;
	endTime: Date;
	notes?: string;
};

type UpdateReservationParams = {
	id: string;
	userName: string;
	startTime: Date;
	endTime: Date;
	notes?: string;
};

/**
 * 予約の取得・作成・更新・削除を一元管理するカスタムフック
 */
export function useReservationOperations(date: Date) {
	// 予約データと状態
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [allReservations, setAllReservations] = useState<Reservation[]>([]);

	// 操作の状態
	const [status, setStatus] = useState<ReservationOperationStatus>({
		isFetching: false,
		isCreating: false,
		isUpdating: false,
		isDeleting: false,
	});

	// エラー状態
	const [errors, setErrors] = useState<ReservationOperationErrors>({
		fetchError: null,
		createError: null,
		updateError: null,
		deleteError: null,
	});

	/**
	 * Date型をISO文字列から変換する
	 */
	type RawReservation = Omit<Reservation, "startTime" | "endTime"> & {
		startTime: string;
		endTime: string;
	};

	const convertDates = useCallback((data: RawReservation[]): Reservation[] => {
		return data.map((item) => ({
			...item,
			startTime: new Date(item.startTime),
			endTime: new Date(item.endTime),
		}));
	}, []);

	/**
	 * 特定の日付の予約を取得
	 */
	const fetchReservations = useCallback(async () => {
		try {
			setStatus((prev) => ({ ...prev, isFetching: true }));
			setErrors((prev) => ({ ...prev, fetchError: null }));

			// 日本時間の日付をYYYY-MM-DD形式で取得
			const dateStr = format(date, "yyyy-MM-dd");

			const response = await fetch(`/api/reservations?date=${dateStr}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API Error: ${response.status}`);
			}

			const data = await response.json();
			const formattedData = convertDates(data);
			setReservations(formattedData);

			return formattedData;
		} catch (err) {
			console.error("予約取得エラー:", err);
			const errorMessage =
				err instanceof Error ? err.message : "予約データの取得に失敗しました";
			setErrors((prev) => ({ ...prev, fetchError: errorMessage }));

			return [];
		} finally {
			setStatus((prev) => ({ ...prev, isFetching: false }));
		}
	}, [date, convertDates]);

	/**
	 * すべての予約を取得
	 */
	const fetchAllReservations = useCallback(async () => {
		try {
			setStatus((prev) => ({ ...prev, isFetching: true }));
			setErrors((prev) => ({ ...prev, fetchError: null }));

			const response = await fetch("/api/reservations/all");

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API Error: ${response.status}`);
			}

			const data = await response.json();
			const formattedData = convertDates(data);
			setAllReservations(formattedData);

			return formattedData;
		} catch (err) {
			console.error("全予約取得エラー:", err);
			const errorMessage =
				err instanceof Error ? err.message : "予約データの取得に失敗しました";
			setErrors((prev) => ({ ...prev, fetchError: errorMessage }));

			return [];
		} finally {
			setStatus((prev) => ({ ...prev, isFetching: false }));
		}
	}, [convertDates]);

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
		}: CreateReservationParams) => {
			try {
				setStatus((prev) => ({ ...prev, isCreating: true }));
				setErrors((prev) => ({ ...prev, createError: null }));

				const response = await fetch("/api/reservations", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						computerId,
						userName,
						startTime: startTime.toISOString(),
						endTime: endTime.toISOString(),
						notes,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "予約の登録に失敗しました");
				}

				// 成功通知
				toast.success("予約を作成しました！");

				// 予約リストを更新
				await fetchReservations();
				// await fetchAllReservations();

				// 成功
				return true;
			} catch (err) {
				console.error("予約作成エラー:", err);
				const errorMessage =
					err instanceof Error ? err.message : "予約の登録に失敗しました";

				setErrors((prev) => ({ ...prev, createError: errorMessage }));
				toast.error(errorMessage);

				return false;
			} finally {
				setStatus((prev) => ({ ...prev, isCreating: false }));
			}
		},
		[
			fetchReservations,
			// fetchAllReservations
		],
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
		}: UpdateReservationParams) => {
			try {
				setStatus((prev) => ({ ...prev, isUpdating: true }));
				setErrors((prev) => ({ ...prev, updateError: null }));

				const response = await fetch(`/api/reservations/${id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userName,
						startTime: startTime.toISOString(),
						endTime: endTime.toISOString(),
						notes,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "予約の更新に失敗しました");
				}

				// 成功通知
				toast.success("予約を更新しました");

				// 予約リストを更新
				await fetchReservations();
				// await fetchAllReservations();

				return true;
			} catch (err) {
				console.error("予約更新エラー:", err);
				const errorMessage =
					err instanceof Error ? err.message : "予約の更新に失敗しました";

				setErrors((prev) => ({ ...prev, updateError: errorMessage }));
				toast.error(errorMessage);

				return false;
			} finally {
				setStatus((prev) => ({ ...prev, isUpdating: false }));
			}
		},
		[
			fetchReservations,
			// fetchAllReservations
		],
	);

	/**
	 * 予約を削除
	 */
	const deleteReservation = useCallback(
		async (id: string) => {
			try {
				setStatus((prev) => ({ ...prev, isDeleting: true }));
				setErrors((prev) => ({ ...prev, deleteError: null }));

				const response = await fetch(`/api/reservations/${id}`, {
					method: "DELETE",
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "予約の削除に失敗しました");
				}

				// 成功通知
				toast.success("予約を削除しました");

				// 予約リストを更新
				await fetchReservations();
				// await fetchAllReservations();

				return true;
			} catch (err) {
				console.error("予約削除エラー:", err);
				const errorMessage =
					err instanceof Error ? err.message : "予約の削除に失敗しました";

				setErrors((prev) => ({ ...prev, deleteError: errorMessage }));
				toast.error(errorMessage);

				return false;
			} finally {
				setStatus((prev) => ({ ...prev, isDeleting: false }));
			}
		},
		[
			fetchReservations,
			// fetchAllReservations
		],
	);

	// 初期読み込み
	useEffect(() => {
		fetchReservations();
	}, [fetchReservations]);

	// 便宜上の複合状態
	const isLoading =
		status.isFetching ||
		status.isCreating ||
		status.isUpdating ||
		status.isDeleting;
	const error =
		errors.fetchError ||
		errors.createError ||
		errors.updateError ||
		errors.deleteError;

	return {
		// データ
		reservations,
		allReservations,

		// 操作関数
		fetchReservations,
		fetchAllReservations,
		createReservation,
		updateReservation,
		deleteReservation,

		// 詳細な状態
		status,
		errors,

		// 簡易状態 (従来のAPIとの互換性維持)
		loading: isLoading,
		error,
		refreshReservations: fetchReservations,
	};
}
