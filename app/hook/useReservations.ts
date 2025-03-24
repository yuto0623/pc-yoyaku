import { format } from "date-fns";
import { useEffect, useState } from "react";

export type Reservation = {
	id: string;
	computerId: string;
	userName: string;
	startTime: Date;
	endTime: Date;
	notes?: string | null;
	computer: {
		id: string;
		name: string;
	};
};

export const useReservations = (date: Date) => {
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 日付が変わったら予約を取得
	useEffect(() => {
		const fetchReservations = async () => {
			try {
				setLoading(true);
				const dateStr = format(date, "yyyy-MM-dd");
				const response = await fetch(`/api/reservations?date=${dateStr}`);

				if (!response.ok) {
					throw new Error("予約データの取得に失敗しました");
				}

				let data = await response.json();
				// 日時文字列をDateオブジェクトに変換
				data = data.map((reservation: Reservation) => ({
					...reservation,
					startTime: new Date(reservation.startTime),
					endTime: new Date(reservation.endTime),
				}));

				setReservations(data);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "予約データの取得中にエラーが発生しました",
				);
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
