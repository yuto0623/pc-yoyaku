"use client";
import { Calendar } from "@/components/ui/calendar";
import type { Computer, Reservation } from "@prisma/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useCallback, useEffect, useMemo } from "react";
import { useState } from "react";
import { toast } from "sonner";
import ReservationEditForm from "./components/ReservationEditForm/ReservationEditForm";
import ReservationForm from "./components/ReservationForm/ReservationForm";
import ReservationList from "./components/ReservationList/ReservationList";
import TimeSlotCell from "./components/TimeSlotCell/TimeSlotCell";
import { useComputers } from "./hooks/useComputers";
import { useReservationHelpers } from "./hooks/useReservationHelpers";
import { useReservations } from "./hooks/useReservations";
import { useTimeSelection } from "./hooks/useTimeSelection";
import { useTimeSlots } from "./hooks/useTimeSlots";
import { useTouchDrag } from "./hooks/useTouchDrag";

export default function Home() {
	const [date, setDate] = useState<Date>(new Date());
	const [isReservationFormOpen, setIsReservationFormOpen] = useState(false);

	// DBからPCデータを取得
	const { computers: pcs, loading, error } = useComputers();

	// 予約データを取得
	const {
		reservations,
		loading: loadingReservations,
		error: reservationsError,
		refreshReservations,
	} = useReservations(date);

	// カスタムフックの使用
	const {
		isCellReserved,
		getReservationUserName,
		isReservationStart,
		getReservationTimes,
		formatReservationTimeRange,
		reservationCount,
	} = useReservationHelpers(date, reservations);

	// 予約編集用のステートを追加
	const [editingReservation, setEditingReservation] = useState<{
		pcId: string;
		startTime?: Date;
		endTime?: Date;
		userName?: string;
		notes?: string;
		id?: string;
	} | null>(null);

	// 予約クリック時の処理を追加
	const handleReservationClick = useCallback(
		(
			pcId: string,
			slotIndex: number,
			startTime?: Date,
			endTime?: Date,
			reservedBy?: string,
		) => {
			// スロットインデックスからその時間に対応する予約を検索
			if (!startTime || !endTime) return;

			// 予約を探す
			const reservation = reservations.find(
				(r) =>
					r.computerId === pcId &&
					r.startTime.getTime() === startTime.getTime() &&
					r.endTime.getTime() === endTime.getTime(),
			);

			if (reservation) {
				// 編集モードを開始
				setEditingReservation({
					pcId,
					startTime,
					endTime,
					userName: reservation.userName,
					notes: reservation.notes || "",
					id: reservation.id,
				});
			}
		},
		[reservations],
	);

	// 予約更新処理
	const updateReservation = async (
		userName: string,
		startTime: Date,
		endTime: Date,
		notes?: string,
	) => {
		if (!editingReservation?.id) return;

		try {
			const response = await fetch(
				`/api/reservations/${editingReservation.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userName,
						notes,
						startTime: startTime.toISOString(),
						endTime: endTime.toISOString(),
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "予約の更新に失敗しました");
			}

			toast.success("予約が更新されました");
			setEditingReservation(null);

			// 予約一覧を更新
			await refreshReservations();
		} catch (error) {
			console.error("更新エラー:", error);
			throw error;
		}
	};

	// 予約削除処理
	const deleteReservation = async () => {
		if (!editingReservation?.id) return;

		try {
			const response = await fetch(
				`/api/reservations/${editingReservation.id}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "予約の削除に失敗しました");
			}

			toast("予約が削除されました");
			setEditingReservation(null);

			// 予約一覧を更新
			await refreshReservations();
		} catch (error) {
			console.error("削除エラー:", error);
			throw error;
		}
	};

	// 編集キャンセル
	const cancelEdit = () => {
		setEditingReservation(null);
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
		// if (isDragging && selection.startTime && selection.endTime) {
		// 	console.log(
		// 		"予約時間確定:",
		// 		format(selection.startTime, "HH:mm"),
		// 		"-",
		// 		format(selection.endTime, "HH:mm"),
		// 	);
		// }
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
	const confirmReservation = async (
		userName: string,
		startTime: Date,
		endTime: Date,
		notes?: string,
	) => {
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
					startTime,
					endTime,
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

	// 選択に変更があった場合、ダイアログを開く処理を追加
	useEffect(() => {
		if (
			selection.startTime &&
			selection.endTime &&
			selection.pcId &&
			!isDragging
		) {
			setIsReservationFormOpen(true);
		}
	}, [selection.startTime, selection.endTime, selection.pcId, isDragging]);

	// 予約フォームキャンセル処理を修正
	const cancelReservation = () => {
		resetSelection();
		setIsReservationFormOpen(false);
	};

	// 予約リストクリック時の処理
	const handleReservationListClick = (reservation: Reservation) => {
		// 予約を編集モードで開く
		setEditingReservation({
			pcId: reservation.computerId,
			startTime: reservation.startTime,
			endTime: reservation.endTime,
			userName: reservation.userName,
			notes: reservation.notes || "",
			id: reservation.id,
		});
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
					<div className="w-full flex justify-center gap-10 flex-col md:flex-row">
						<div className="mb-6 lg:mb-0">
							<h2 className="text-lg font-semibold mb-2">日付を選択</h2>
							<Calendar
								mode="single"
								selected={date}
								onSelect={handleDateChange}
								className="rounded-md border w-fit"
							/>
						</div>
						<ReservationList
							reservations={reservations}
							pcs={pcs}
							date={date}
							loading={loadingReservations}
							onReservationClick={handleReservationListClick}
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
									<div className="w-24 border-r border-b p-2 font-medium bg-gray-50 dark:bg-gray-700 sticky left-0">
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
										<div className="w-24 border-r border-b p-2 bg-gray-50 dark:bg-gray-700 sticky left-0 z-20">
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
													startTime={isReservationStart(
														pc.id,
														slot.hour,
														slot.minute + 10,
													)}
													isReserved={isCellReserved(
														pc.id,
														slot.hour,
														slot.minute + 10,
													)}
													reservedBy={getReservationUserName(
														pc.id,
														slot.hour,
														slot.minute + 10,
													)}
													reservationStartTime={
														getReservationTimes(
															pc.id,
															slot.hour,
															slot.minute + 10,
														).startTime
													}
													reservationEndTime={
														getReservationTimes(
															pc.id,
															slot.hour,
															slot.minute + 10,
														).endTime
													}
													onMouseDown={handleCellMouseDown}
													onMouseEnter={handleCellMouseEnter}
													onTouchStart={handleTouchStart}
													onReservationClick={handleReservationClick}
												/>
											))}
											{/* 予約編集フォームを追加 */}
											{editingReservation && (
												<ReservationEditForm
													open={!!editingReservation}
													onOpenChange={(open) => {
														if (!open) setEditingReservation(null);
													}}
													pcId={editingReservation.pcId}
													pcs={pcs}
													startTime={editingReservation.startTime}
													endTime={editingReservation.endTime}
													userName={editingReservation.userName}
													notes={editingReservation.notes}
													onUpdate={updateReservation}
													onDelete={deleteReservation}
													onCancel={cancelEdit}
												/>
											)}
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
								onCancel={resetSelection}
								open={isReservationFormOpen}
								onOpenChange={setIsReservationFormOpen}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
