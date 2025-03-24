import type { Reservation } from "@prisma/client";
import { format } from "date-fns";
import { useEffect, useState } from "react";

export const useReservations = (date: Date) => {
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 日付が変わったら予約を取得
	useEffect(() => {
		const fetchReservations = async () => {
			try {
				setLoading(true);

				// 日本時間の日付をYYYY-MM-DD形式で取得
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				const formattedDate = `${year}-${month}-${day}`;

				// console.log("APIに送信する日付:", formattedDate);

				const response = await fetch(`/api/reservations?date=${formattedDate}`);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || `API Error: ${response.status}`);
				}

				const data = await response.json();

				// レスポンスをDate型に変換
				const formattedData = Array.isArray(data)
					? data.map((item) => ({
							...item,
							startTime: new Date(item.startTime),
							endTime: new Date(item.endTime),
						}))
					: [];

				setReservations(formattedData);
			} catch (err) {
				console.error("予約取得エラー:", err);
				setError(
					err instanceof Error ? err.message : "予約データの取得に失敗しました",
				);
				setReservations([]);
			} finally {
				setLoading(false);
			}
		};

		fetchReservations();
	}, [date]);

	// 予約追加後に一覧を更新する関数
	const refreshReservations = async () => {
		try {
			setLoading(true);
			const dateStr = format(date, "yyyy-MM-dd");
			const response = await fetch(`/api/reservations?date=${dateStr}`);

			if (!response.ok) {
				throw new Error("予約データの更新に失敗しました");
			}

			let data = await response.json();
			data = data.map((reservation: Reservation) => ({
				...reservation,
				startTime: new Date(reservation.startTime),
				endTime: new Date(reservation.endTime),
			}));

			setReservations(data);
		} catch (err) {
			console.error("予約更新エラー:", err);
		} finally {
			setLoading(false);
		}
	};

	return { reservations, loading, error, refreshReservations };
};
