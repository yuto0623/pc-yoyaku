import React from "react";

type TimeSlotCellProps = {
	pcId: string;
	hour: number;
	minute: number;
	slotIndex: number;
	pcIndex: number;
	isSelected: boolean;
	isHourStart: boolean;
	onMouseDown: (pcId: string, slotIndex: number, pcIndex: number) => void;
	onMouseEnter: (pcId: string, slotIndex: number) => void;
	onTouchStart: (pcId: string, slotIndex: number, pcIndex: number) => void;
};

/**
 * 予約グリッドの個々の時間セルを表示するコンポーネント
 */
export default function TimeSlotCell({
	pcId,
	hour,
	minute,
	slotIndex,
	pcIndex,
	isSelected,
	isHourStart,
	onMouseDown,
	onMouseEnter,
	onTouchStart,
}: TimeSlotCellProps) {
	// 背景色の決定
	const backgroundColor = isSelected
		? "bg-blue-200 dark:bg-blue-800"
		: "bg-white dark:bg-gray-800";

	// 時間の区切り（時間の始まり）に左ボーダーを追加
	const leftBorder = isHourStart ? "border-l border-l-gray-400" : "";

	return (
		<div
			key={`${pcId}-${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`}
			className={`w-[10px] h-full flex-shrink-0 border-r border-b ${backgroundColor} cursor-pointer transition-colors ${leftBorder} time-cell`}
			data-pc-id={pcId}
			data-index={slotIndex}
			onMouseDown={() => onMouseDown(pcId, slotIndex, pcIndex)}
			onMouseEnter={() => onMouseEnter(pcId, slotIndex)}
			onTouchStart={() => onTouchStart(pcId, slotIndex, pcIndex)}
		/>
	);
}
