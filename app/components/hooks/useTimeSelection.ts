import { addMinutes, set } from "date-fns";
import { useState } from "react";
import type { TimeSlot } from "./useTimeSlots";

// 予約時間帯選択のための状態タイプ
export type TimeSelection = {
	pcId: string | null;
	startTime: Date | null;
	endTime: Date | null;
};

/**
 * 時間選択のロジックを管理するカスタムフック
 */
export function useTimeSelection(date: Date, timeSlots: TimeSlot[]) {
	// 時間選択の状態
	const [selection, setSelection] = useState<TimeSelection>({
		pcId: null,
		startTime: null,
		endTime: null,
	});

	// ドラッグ操作のための状態
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartCell, setDragStartCell] = useState<{
		pcIndex: number;
		timeSlotIndex: number;
	} | null>(null);

	// セルをクリック/タッチ開始したときの処理
	const startSelection = (
		pcId: string,
		timeSlotIndex: number,
		pcIndex: number,
	) => {
		const slot = timeSlots[timeSlotIndex];
		const startTime = set(date, {
			hours: slot.hour,
			minutes: slot.minute,
			seconds: 0,
		});

		setSelection({
			pcId,
			startTime,
			endTime: addMinutes(startTime, 10),
		});
		setIsDragging(true);
		setDragStartCell({ pcIndex, timeSlotIndex });
	};

	// ドラッグ中の処理
	const updateSelection = (pcId: string, timeSlotIndex: number) => {
		if (isDragging && selection.pcId === pcId && dragStartCell) {
			const startSlot = timeSlots[dragStartCell.timeSlotIndex];
			const currentSlot = timeSlots[timeSlotIndex];

			// 日付に基づいて時間を設定
			const baseTime = set(date, {
				hours: startSlot.hour,
				minutes: startSlot.minute,
				seconds: 0,
			});

			// ドラッグ方向に応じて開始時間と終了時間を設定
			if (timeSlotIndex > dragStartCell.timeSlotIndex) {
				// 右方向へのドラッグ
				setSelection({
					...selection,
					startTime: baseTime,
					// 終了時間は選択した枠の次の10分から
					endTime: addMinutes(
						set(date, {
							hours: currentSlot.hour,
							minutes: currentSlot.minute,
							seconds: 0,
						}),
						10,
					),
				});
			} else {
				// 左方向へのドラッグ
				setSelection({
					...selection,
					startTime: set(date, {
						hours: currentSlot.hour,
						minutes: currentSlot.minute,
						seconds: 0,
					}),
					endTime: addMinutes(baseTime, 10),
				});
			}
		}
	};

	// ドラッグ終了の処理
	const endSelection = () => {
		setIsDragging(false);
	};

	// 選択のリセット
	const resetSelection = () => {
		setSelection({
			pcId: null,
			startTime: null,
			endTime: null,
		});
	};

	// セルの選択状態を判定
	const isCellSelected = (
		pcId: string,
		hour: number,
		minute: number,
	): boolean => {
		if (selection.pcId === pcId && selection.startTime && selection.endTime) {
			const cellTime = set(date, { hours: hour, minutes: minute, seconds: 0 });
			return cellTime >= selection.startTime && cellTime < selection.endTime;
		}
		return false;
	};

	return {
		selection,
		setSelection, // 直接更新が必要な場合のために残しておく
		isDragging,
		dragStartCell,
		startSelection,
		updateSelection,
		endSelection,
		resetSelection,
		isCellSelected,
	};
}
