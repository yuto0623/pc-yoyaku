import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useCallback, useMemo } from "react";

// 必要な型定義
type Computer = {
	id: string;
	name: string;
	// 他のPC関連フィールド
};

type Reservation = {
	id: string;
	computerId: string;
	startTime: Date;
	endTime: Date;
	userName: string;
	notes?: string | null;
	computer?: Computer;
};

/**
 * 予約関連のヘルパー関数を提供するカスタムフック
 *
 * @param date 現在選択されている日付
 * @param reservations 予約データの配列
 * @returns 予約チェック・情報取得用の関数群
 */
export function useReservationHelpers(date: Date, reservations: Reservation[]) {
	// 予約データのインデックス作成（高速検索用）
	const reservationIndex = useMemo(() => {
		const pcMap = new Map<string, Reservation[]>();

		// PCごとに予約をグループ化
		for (const reservation of reservations) {
			if (!pcMap.has(reservation.computerId)) {
				pcMap.set(reservation.computerId, []);
			}
			pcMap.get(reservation.computerId)?.push(reservation);
		}

		return {
			byPc: pcMap,
			all: reservations,
		};
	}, [reservations]);

	/**
	 * セルが予約済みかどうかを確認
	 */
	const isCellReserved = useCallback(
		(pcId: string, hour: number, minute: number): boolean => {
			const cellTime = new Date(date);
			cellTime.setHours(hour, minute, 0, 0);

			// 最適化: インデックスから特定PCの予約だけを検索
			const pcReservations = reservationIndex.byPc.get(pcId) || [];
			return pcReservations.some(
				(r) => cellTime >= r.startTime && cellTime < r.endTime,
			);
		},
		[date, reservationIndex],
	);

	/**
	 * セルの予約者名を取得
	 */
	const getReservationUserName = useCallback(
		(pcId: string, hour: number, minute: number): string | undefined => {
			const cellTime = new Date(date);
			cellTime.setHours(hour, minute, 0, 0);

			// 最適化: インデックスから特定PCの予約だけを検索
			const pcReservations = reservationIndex.byPc.get(pcId) || [];
			const reservation = pcReservations.find(
				(r) => cellTime >= r.startTime && cellTime < r.endTime,
			);

			return reservation?.userName;
		},
		[date, reservationIndex],
	);

	/**
	 * セルが予約の開始時間かどうかを確認
	 */
	const isReservationStart = useCallback(
		(pcId: string, hour: number, minute: number): boolean => {
			const cellTime = new Date(date);
			cellTime.setHours(hour, minute, 0, 0);

			// この時間を含む予約を検索
			const pcReservations = reservationIndex.byPc.get(pcId) || [];
			const currentReservation = pcReservations.find(
				(r) => cellTime >= r.startTime && cellTime < r.endTime,
			);

			// 予約がなければfalseを返す
			if (!currentReservation) return false;

			// 現在の予約の開始時間（分）を10分単位に丸める
			const resStartHour = currentReservation.startTime.getHours();
			const resStartMinute =
				Math.floor(currentReservation.startTime.getMinutes() / 10) * 10;

			// 現在のセルが予約の開始時間と一致するかチェック
			// 注意: ここの比較ロジックは必要に応じて調整する（+10の調整など）
			return resStartHour === hour && resStartMinute + 10 === minute;
		},
		[date, reservationIndex],
	);

	/**
	 * セルの予約時間情報を取得
	 */
	const getReservationTimes = useCallback(
		(
			pcId: string,
			hour: number,
			minute: number,
		): { startTime?: Date; endTime?: Date } => {
			const cellTime = new Date(date);
			cellTime.setHours(hour, minute, 0, 0);

			const pcReservations = reservationIndex.byPc.get(pcId) || [];
			const reservation = pcReservations.find(
				(r) => cellTime >= r.startTime && cellTime < r.endTime,
			);

			return {
				startTime: reservation?.startTime,
				endTime: reservation?.endTime,
			};
		},
		[date, reservationIndex],
	);

	/**
	 * 予約時間の範囲をフォーマット
	 */
	const formatReservationTimeRange = useCallback(
		(startTime?: Date, endTime?: Date): string => {
			if (!startTime || !endTime) return "";

			// HH:MM形式でフォーマット
			const startFormatted = format(startTime, "HH:mm", { locale: ja });
			const endFormatted = format(endTime, "HH:mm", { locale: ja });

			return `${startFormatted}～${endFormatted}`;
		},
		[],
	);

	return {
		isCellReserved,
		getReservationUserName,
		isReservationStart,
		getReservationTimes,
		formatReservationTimeRange,
		reservationCount: reservations.length,
	};
}
