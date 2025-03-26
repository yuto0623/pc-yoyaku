import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, parse, setHours, setMinutes } from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect, useState } from "react";
import type { TimeSelection } from "../../../hooks/useTimeSelection";

type PC = {
	id: string;
	name: string;
};

type ReservationFormProps = {
	selection: TimeSelection;
	pcs: PC[];
	onConfirm: (
		userName: string,
		startTime: Date,
		endTime: Date,
		notes?: string,
	) => Promise<void>;
	onCancel: () => void;
	open: boolean; // ダイアログの表示状態
	onOpenChange: (open: boolean) => void; // ダイアログの表示状態を変更するコールバック
};

// 時間オプション（10分間隔）を生成
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 0; hour <= 23; hour++) {
		for (let minute = 0; minute < 60; minute += 10) {
			const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
			options.push(timeString);
		}
	}
	return options;
};

export default function ReservationForm({
	selection,
	pcs,
	onConfirm,
	onCancel,
	open,
	onOpenChange,
}: ReservationFormProps) {
	const [userName, setUserName] = useState("");
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 時間選択用の状態
	const [selectedStartTime, setSelectedStartTime] = useState("");
	const [selectedEndTime, setSelectedEndTime] = useState("");

	// 時間オプション
	const timeOptions = generateTimeOptions();

	// 選択されたPCの情報を取得
	const selectedPc = pcs.find((pc) => pc.id === selection.pcId);

	// 初期時間を設定
	useEffect(() => {
		if (selection.startTime) {
			setSelectedStartTime(format(selection.startTime, "HH:mm"));
		}
		if (selection.endTime) {
			setSelectedEndTime(format(selection.endTime, "HH:mm"));
		}
	}, [selection.startTime, selection.endTime]);

	// 日本時間でフォーマット
	const formatJstDate = (date: Date | null) => {
		return date ? format(date, "yyyy年MM月dd日", { locale: ja }) : "未設定";
	};

	// 時間変更のハンドリング
	const handleStartTimeChange = (value: string) => {
		setSelectedStartTime(value);

		// 終了時間が開始時間より前か同じ場合、開始時間+10分を終了時間にする
		const startInMinutes = parseTimeToMinutes(value);
		const endInMinutes = parseTimeToMinutes(selectedEndTime);

		if (endInMinutes <= startInMinutes) {
			// 開始時間の次の10分を設定
			const nextTimeOption = timeOptions[timeOptions.indexOf(value) + 1];
			if (nextTimeOption) {
				setSelectedEndTime(nextTimeOption);
			}
		}
	};

	// 時間文字列を分に変換
	const parseTimeToMinutes = (timeStr: string): number => {
		const [hours, minutes] = timeStr.split(":").map(Number);
		return hours * 60 + minutes;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!userName.trim()) {
			setError("お名前を入力してください");
			return;
		}

		if (!selectedStartTime || !selectedEndTime) {
			setError("予約時間を選択してください");
			return;
		}

		const startInMinutes = parseTimeToMinutes(selectedStartTime);
		const endInMinutes = parseTimeToMinutes(selectedEndTime);

		if (endInMinutes <= startInMinutes) {
			setError("終了時間は開始時間より後にしてください");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// 選択された時間を日付オブジェクトに変換
			const baseDate = selection.startTime || new Date();

			const newStartTime = new Date(baseDate);
			const [startHours, startMinutes] = selectedStartTime
				.split(":")
				.map(Number);
			newStartTime.setHours(startHours, startMinutes, 0, 0);

			const newEndTime = new Date(baseDate);
			const [endHours, endMinutes] = selectedEndTime.split(":").map(Number);
			newEndTime.setHours(endHours, endMinutes, 0, 0);

			await onConfirm(userName, newStartTime, newEndTime, notes);

			// 送信成功後にフォームをリセット
			setUserName("");
			setNotes("");
			setSelectedStartTime("");
			setSelectedEndTime("");
			onOpenChange(false); // ダイアログを閉じる
		} catch (err) {
			setError(err instanceof Error ? err.message : "予約の登録に失敗しました");
		} finally {
			setIsSubmitting(false);
		}
	};

	// キャンセル処理
	const handleCancel = () => {
		setUserName("");
		setNotes("");
		setSelectedStartTime("");
		setSelectedEndTime("");
		setError(null);
		onCancel();
		onOpenChange(false); // ダイアログを閉じる
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>予約の確定</DialogTitle>
					<DialogDescription>
						選択した時間帯で予約を確定します。時間を調整することもできます。
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<div className="grid grid-cols-[auto_1fr] gap-2 text-sm mb-2">
							<div className="font-medium">PC:</div>
							<div>{selectedPc?.name}</div>

							<div className="font-medium">日付:</div>
							<div>{formatJstDate(selection.startTime)}</div>
						</div>

						{/* 時間選択部分 */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="startTime">開始時間</Label>
								<Select
									value={selectedStartTime}
									onValueChange={handleStartTimeChange}
								>
									<SelectTrigger>
										<SelectValue placeholder="開始時間" />
									</SelectTrigger>
									<SelectContent>
										{timeOptions.map((time) => (
											<SelectItem key={`start-${time}`} value={time}>
												{time}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="endTime">終了時間</Label>
								<Select
									value={selectedEndTime}
									onValueChange={setSelectedEndTime}
								>
									<SelectTrigger>
										<SelectValue placeholder="終了時間" />
									</SelectTrigger>
									<SelectContent>
										{timeOptions.map((time) => (
											<SelectItem
												key={`end-${time}`}
												value={time}
												disabled={
													parseTimeToMinutes(time) <=
													parseTimeToMinutes(selectedStartTime)
												}
											>
												{time}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="userName">
							お名前 <span className="text-destructive">*</span>
						</Label>
						<Input
							id="userName"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							placeholder="予約者名"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">メモ</Label>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="備考や用件など"
							rows={3}
						/>
					</div>

					{error && <div className="text-destructive text-sm">{error}</div>}

					<DialogFooter className="sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting}
						>
							キャンセル
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "送信中..." : "予約を確定"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
