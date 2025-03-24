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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import type { TimeSelection } from "../../components/hooks/useTimeSelection";

type PC = {
	id: string;
	name: string;
};

type ReservationFormProps = {
	selection: TimeSelection;
	pcs: PC[];
	onConfirm: (userName: string, notes?: string) => Promise<void>;
	onCancel: () => void;
	open: boolean; // ダイアログの表示状態
	onOpenChange: (open: boolean) => void; // ダイアログの表示状態を変更するコールバック
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

	// 選択されたPCの情報を取得
	const selectedPc = pcs.find((pc) => pc.id === selection.pcId);

	// 日本時間でフォーマット
	const formatJstDate = (date: Date | null) => {
		return date ? format(date, "yyyy年MM月dd日", { locale: ja }) : "未設定";
	};

	const formatJstTime = (date: Date | null) => {
		return date ? format(date, "HH:mm", { locale: ja }) : "未設定";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!userName.trim()) {
			setError("お名前を入力してください");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			await onConfirm(userName, notes);
			// 送信成功後にフォームをリセット
			setUserName("");
			setNotes("");
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
						選択した時間帯で予約を確定します。
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<div className="grid grid-cols-[auto_1fr] gap-2 text-sm">
							<div className="font-medium">PC:</div>
							<div>{selectedPc?.name}</div>

							<div className="font-medium">日付:</div>
							<div>{formatJstDate(selection.startTime)}</div>

							<div className="font-medium">時間:</div>
							<div>
								{formatJstTime(selection.startTime)} -{" "}
								{formatJstTime(selection.endTime)}
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
