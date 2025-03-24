import { addHours, format } from "date-fns";
import { ja } from "date-fns/locale";

type TimeSlotCellProps = {
	pcId: string;
	hour: number;
	minute: number;
	slotIndex: number;
	pcIndex: number;
	isSelected: boolean;
	isHourStart: boolean;
	startTime: boolean;
	isReserved?: boolean; // 追加: 既存予約かどうか
	reservedBy?: string; // 追加: 予約者名
	onMouseDown: (pcId: string, slotIndex: number, pcIndex: number) => void;
	onMouseEnter: (pcId: string, slotIndex: number) => void;
	onTouchStart: (pcId: string, slotIndex: number, pcIndex: number) => void;
};

// 日本時間でフォーマットする関数
function formatJstTime(hour: number, minute: number): string {
	const date = new Date();
	date.setHours(hour, minute, 0, 0);
	return format(addHours(date, 9), "HH:mm", { locale: ja });
}
export default function TimeSlotCell({
	pcId,
	hour,
	minute,
	slotIndex,
	pcIndex,
	isSelected,
	isHourStart,
	startTime,
	isReserved = false,
	reservedBy,
	onMouseDown,
	onMouseEnter,
	onTouchStart,
}: TimeSlotCellProps) {
	// 背景色の決定
	let backgroundColor: string;
	if (isReserved) {
		backgroundColor = "bg-red-200 dark:bg-red-800"; // 予約済み
	} else if (isSelected) {
		backgroundColor = "bg-blue-200 dark:bg-blue-800"; // 選択中
	} else {
		backgroundColor = "bg-white dark:bg-gray-800"; // デフォルト
	}

	// 時間の区切り（時間の始まり）に左ボーダーを追加
	const leftBorder = isHourStart ? "border-l border-l-gray-400" : "";

	// 予約済みのセルはクリック不可
	const handleMouseDown = isReserved
		? undefined
		: () => onMouseDown(pcId, slotIndex, pcIndex);
	const handleMouseEnter = isReserved
		? undefined
		: () => onMouseEnter(pcId, slotIndex);
	const handleTouchStart = isReserved
		? undefined
		: () => onTouchStart(pcId, slotIndex, pcIndex);

	const timeLabel = formatJstTime(hour, minute);
	const title = isReserved
		? `${timeLabel} - 予約済み: ${reservedBy || "名前なし"}`
		: `${timeLabel}`;

	return (
		<div
			key={`${pcId}-${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`}
			className={`w-[10px] h-full flex-shrink-0 border-r border-b ${backgroundColor} cursor-pointer transition-colors ${leftBorder} time-cell relative`}
			data-pc-id={pcId}
			data-index={slotIndex}
			onMouseDown={handleMouseDown}
			onMouseEnter={handleMouseEnter}
			onTouchStart={handleTouchStart}
			title={title}
		>
			{/* 予約済みかつ時間の開始位置で名前の頭文字を表示 */}
			{isReserved && startTime && (
				<span className="absolute inset-0 flex items-center justify-start font-bold overflow-visible pl-1 z-10">
					{reservedBy}
				</span>
			)}
		</div>
	);
}
