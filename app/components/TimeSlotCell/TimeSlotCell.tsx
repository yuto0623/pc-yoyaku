import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
	reservationStartTime?: Date;
	reservationEndTime?: Date;
	onMouseDown: (pcId: string, slotIndex: number, pcIndex: number) => void;
	onMouseEnter: (pcId: string, slotIndex: number) => void;
	onTouchStart: (pcId: string, slotIndex: number, pcIndex: number) => void;
};

export default function TimeSlotCell({
	pcId,
	hour,
	minute,
	slotIndex,
	pcIndex,
	isSelected,
	isHourStart,
	startTime,
	isReserved,
	reservedBy,
	reservationStartTime,
	reservationEndTime,
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

	// 日本時間でフォーマットする関数
	function formatJstTime(hour: number, minute: number): string {
		const hourStr = hour.toString().padStart(2, "0");
		const minuteStr = minute.toString().padStart(2, "0");
		return `${hourStr}:${minuteStr}`;
	}

	// 予約の時間範囲を表示する関数
	function formatReservationTimeRange(
		startTime?: Date,
		endTime?: Date,
	): string {
		if (!startTime || !endTime) return "";

		// HH:MM形式でフォーマット
		const startFormatted = format(startTime, "HH:mm", { locale: ja });
		const endFormatted = format(endTime, "HH:mm", { locale: ja });

		return `${startFormatted}～${endFormatted}`;
	}

	return (
		<TooltipProvider>
			<Tooltip delayDuration={200}>
				<TooltipTrigger asChild>
					<div
						className={`w-[10px] h-full flex-shrink-0 border-r border-b ${backgroundColor} cursor-pointer transition-colors ${leftBorder} time-cell relative`}
						data-pc-id={pcId}
						data-index={slotIndex}
						onMouseDown={handleMouseDown}
						onMouseEnter={handleMouseEnter}
						onTouchStart={handleTouchStart}
					>
						{isReserved && startTime && (
							<span className="absolute whitespace-nowrap inset-0 flex items-center justify-start z-10 font-bold">
								{reservedBy}
							</span>
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="px-3 py-2  shadow-lg border border-gray-200 dark:border-gray-700 rounded-md"
				>
					{isReserved ? (
						<div className="flex flex-col gap-1">
							<div className="font-medium text-sm">
								{reservedBy || "名前なし"}
							</div>
							<div className="text-xs flex items-center gap-1.5">
								<svg
									aria-label="予約済み"
									className="w-3 h-3"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<title>予約済み</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								{formatReservationTimeRange(
									reservationStartTime,
									reservationEndTime,
								)}
							</div>
						</div>
					) : (
						timeLabel
					)}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
