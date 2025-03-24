// 時間スロットの型定義
export type TimeSlot = {
	hour: number;
	minute: number;
};

/**
 * 時間スロットと時間ヘッダーを生成するカスタムフック
 */
export function useTimeSlots() {
	// 10分単位のタイムスロットを生成（0:00-23:50）- 24時間対応
	const generateTimeSlots = (): TimeSlot[] => {
		const slots: TimeSlot[] = [];
		for (let hour = 0; hour <= 23; hour++) {
			for (let minute = 0; minute < 60; minute += 10) {
				slots.push({ hour, minute });
			}
		}
		return slots;
	};

	// 1時間単位の時間ヘッダーを生成（0-23時）
	const generateHourHeaders = (): number[] => {
		return Array.from({ length: 24 }, (_, i) => i); // 0時から23時まで
	};

	const timeSlots = generateTimeSlots();
	const hourHeaders = generateHourHeaders();

	return {
		timeSlots,
		hourHeaders,
	};
}
