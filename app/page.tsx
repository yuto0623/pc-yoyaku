"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect } from "react";
import { useState } from "react";
import { toast } from "sonner";
import ReservationForm from "./components/ReservationForm/ReservationForm";
import TimeSlotCell from "./components/TimeSlotCell/TimeSlotCell";
import { useTimeSelection } from "./components/hooks/useTimeSelection";
import { useTimeSlots } from "./components/hooks/useTimeSlots";
import { useTouchDrag } from "./components/hooks/useTouchDrag";
import { useComputers } from "./hook/useComputers";
import { useReservations } from "./hook/useReservations";

export default function Home() {
	const [date, setDate] = useState<Date>(new Date());

	// SQLiteからPCデータを取得
	const { computers: pcs, loading, error } = useComputers();

	// 予約データを取得
	const {
		reservations,
		loading: loadingReservations,
		error: reservationsError,
		refreshReservations,
	} = useReservations(date);

	// 既存予約をチェックする関数
	const isCellReserved = (
		pcId: string,
		hour: number,
		minute: number,
	): boolean => {
		// この時間が予約済みかチェック
		const cellTime = new Date(date);
		cellTime.setHours(hour, minute, 0, 0);

		return reservations.some(
			(reservation) =>
				reservation.computerId === pcId &&
				cellTime >= reservation.startTime &&
				cellTime < reservation.endTime,
		);
	};

	// セルの予約者名を取得
	const getReservationUserName = (
		pcId: string,
		hour: number,
		minute: number,
	): string | undefined => {
		const cellTime = new Date(date);
		cellTime.setHours(hour, minute, 0, 0);

		const reservation = reservations.find(
			(r) =>
				r.computerId === pcId &&
				cellTime >= r.startTime &&
				cellTime < r.endTime,
		);

		return reservation?.userName;
	};

	// 時間スロットと時間ヘッダーを生成
	const { timeSlots, hourHeaders } = useTimeSlots();

	// 時間選択のカスタムフック
	const {
		selection,
		isDragging,
		dragStartCell,
		startSelection,
		updateSelection,
		endSelection,
		resetSelection,
		isCellSelected,
	} = useTimeSelection(date, timeSlots);

	// タッチドラッグのカスタムフック
	const {
		isLongPressing,
		gridRef,
		startLongPress,
		cancelLongPress,
		endLongPress,
		preventScrollDuringDrag,
	} = useTouchDrag();

	// セルをクリック/タッチ開始したときの処理
	const handleCellMouseDown = (
		pcId: string,
		timeSlotIndex: number,
		pcIndex: number,
	) => {
		startSelection(pcId, timeSlotIndex, pcIndex);
	};

	// 長押しを開始する処理
	const handleTouchStart = (
		pcId: string,
		timeSlotIndex: number,
		pcIndex: number,
	) => {
		startLongPress(() => {
			// 長押しが検出されたら選択を開始
			handleCellMouseDown(pcId, timeSlotIndex, pcIndex);
		});
	};

	// タッチキャンセル時の処理
	const handleTouchCancel = () => {
		cancelLongPress();
	};

	// ドラッグ中の処理
	const handleCellMouseEnter = (pcId: string, timeSlotIndex: number) => {
		updateSelection(pcId, timeSlotIndex);
	};

	// タッチ移動時の処理（スマートフォン用）
	const handleTouchMove = (event: React.TouchEvent) => {
		// 長押しが検出されていない場合は処理しない
		if (
			!isLongPressing ||
			!isDragging ||
			!selection.pcId ||
			!dragStartCell ||
			!gridRef.current
		) {
			return;
		}

		event.preventDefault(); // スクロールを防止

		const touch = event.touches[0];

		// タッチ位置の要素を取得
		const elementsAtTouch = document.elementsFromPoint(
			touch.clientX,
			touch.clientY,
		);

		// タッチ要素からセルを探す
		const touchedCell = elementsAtTouch.find(
			(el) =>
				el.classList.contains("time-cell") &&
				el.getAttribute("data-pc-id") === selection.pcId,
		);

		if (touchedCell) {
			const timeSlotIndex = Number.parseInt(
				touchedCell.getAttribute("data-index") || "0",
				10,
			);
			handleCellMouseEnter(selection.pcId, timeSlotIndex);
		}
	};

	// ドラッグ終了の処理
	const handleMouseUp = () => {
		if (isDragging && selection.startTime && selection.endTime) {
			console.log(
				"予約時間確定:",
				format(selection.startTime, "HH:mm"),
				"-",
				format(selection.endTime, "HH:mm"),
			);
		}
		endSelection();
	};

	// タッチ終了時の処理
	const handleTouchEnd = () => {
		endLongPress(() => {
			// 通常のドラッグ終了処理
			handleMouseUp();
		});
	};

	// イベントリスナー設定
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		window.addEventListener("mouseup", handleMouseUp);
		window.addEventListener("touchend", handleTouchEnd);
		window.addEventListener("touchcancel", handleTouchCancel);

		return () => {
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("touchend", handleTouchEnd);
			window.removeEventListener("touchcancel", handleTouchCancel);
		};
	}, [isDragging, selection]);

	// 日付変更時の処理
	const handleDateChange = (newDate: Date | undefined) => {
		if (newDate) {
			setDate(newDate);
			resetSelection();
		}
	};

	// 予約を確定する処理
	const confirmReservation = async (userName: string, notes?: string) => {
		if (!selection.pcId || !selection.startTime || !selection.endTime) return;

		try {
			// 予約データをAPIに送信
			const response = await fetch("/api/reservations", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					computerId: selection.pcId,
					startTime: selection.startTime,
					endTime: selection.endTime,
					userName,
					notes,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "予約の登録に失敗しました");
			}

			// 予約成功の通知
			toast("予約が確定しました！");

			// 予約選択をリセット
			resetSelection();

			// 予約一覧を更新
			await refreshReservations();
		} catch (error) {
			console.error("予約エラー:", error);
			throw error;
		}
	};

	// 予約フォームをキャンセル
	const cancelReservation = () => {
		resetSelection();
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">PC予約システム</h1>

			{/* エラー表示 */}
			{error && (
				<div className="bg-destructive text-white p-4 rounded-md mb-4">
					{error}
				</div>
			)}

			{/* ローディング表示 */}
			{loading ? (
				<div className="flex items-center justify-center p-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
					<span className="ml-2">PCデータを読み込み中...</span>
				</div>
			) : (
				<div className="flex flex-col gap-6">
					{/* カレンダー */}
					<div className="mb-6 lg:mb-0">
						<h2 className="text-lg font-semibold mb-2">日付を選択</h2>
						<Calendar
							mode="single"
							selected={date}
							onSelect={handleDateChange}
							className="rounded-md border w-fit"
						/>
					</div>

					{/* PCと時間のグリッド */}
					<div className="flex-grow">
						<h2 className="text-lg font-semibold mb-2">
							{format(date, "yyyy年MM月dd日 (eee)", { locale: ja })}の予約状況
						</h2>

						{/* スマホ用の説明 */}
						<p className="text-sm text-gray-500 mb-2 md:hidden">
							長押し（0.5秒）してからドラッグで時間を選択できます
						</p>

						<div className="overflow-x-auto" ref={gridRef}>
							<div className="min-w-full" style={{ minWidth: "1600px" }}>
								{/* 時間ヘッダー - 1時間単位 */}
								<div className="flex">
									<div className="w-32 border-r border-b p-2 font-medium bg-gray-50 dark:bg-gray-700 sticky left-0">
										PC
									</div>
									{hourHeaders.map((hour) => (
										<div
											key={hour}
											className="w-[60px] flex-shrink-0 border-r border-b p-2 text-center font-medium bg-gray-50 dark:bg-gray-700"
										>
											{`${hour.toString().padStart(2, "0")}:00`}
										</div>
									))}
								</div>

								{/* PC行 */}
								{pcs.map((pc, pcIndex) => (
									<div key={pc.id} className="flex">
										{/* PC情報 */}
										<div className="w-32 border-r border-b p-2 bg-gray-50 dark:bg-gray-700 sticky left-0">
											<div className="font-medium">{pc.name}</div>
										</div>

										{/* 時間セル - 10分単位 */}
										<div
											className="flex"
											onTouchMove={handleTouchMove}
											onContextMenu={(e) => {
												// 長押し中に右クリックメニューが出るのを防止
												if (isLongPressing) e.preventDefault();
											}}
										>
											{timeSlots.map((slot, slotIndex) => (
												<TimeSlotCell
													key={`${pc.id}-${slot.hour}-${slot.minute}`}
													pcId={pc.id}
													hour={slot.hour}
													minute={slot.minute}
													slotIndex={slotIndex}
													pcIndex={pcIndex}
													isSelected={isCellSelected(
														pc.id,
														slot.hour,
														slot.minute,
													)}
													isHourStart={slot.minute === 0}
													isReserved={isCellReserved(
														pc.id,
														slot.hour,
														slot.minute + 10,
													)}
													reservedBy={getReservationUserName(
														pc.id,
														slot.hour,
														slot.minute,
													)}
													onMouseDown={handleCellMouseDown}
													onMouseEnter={handleCellMouseEnter}
													onTouchStart={handleTouchStart}
												/>
											))}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* 選択情報の表示 */}
						{/* 選択情報の表示 - ReservationFormに置き換え */}
						{selection.startTime && selection.endTime && selection.pcId && (
							<ReservationForm
								selection={selection}
								pcs={pcs}
								onConfirm={confirmReservation}
								onCancel={cancelReservation}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
