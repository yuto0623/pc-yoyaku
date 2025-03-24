import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
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

type PC = {
	id: string;
	name: string;
};

type ReservationEditFormProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	pcId: string;
	pcs: PC[];
	startTime?: Date;
	endTime?: Date;
	userName?: string;
	notes?: string;
	onUpdate: (userName: string, notes?: string) => Promise<void>;
	onDelete: () => Promise<void>;
	onCancel: () => void;
};

export default function ReservationEditForm({
	open,
	onOpenChange,
	pcId,
	pcs,
	startTime,
	endTime,
	userName: initialUserName = "",
	notes: initialNotes = "",
	onUpdate,
	onDelete,
	onCancel,
}: ReservationEditFormProps) {
	const [userName, setUserName] = useState(initialUserName);
	const [notes, setNotes] = useState(initialNotes);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

	// 選択されたPCの情報を取得
	const selectedPc = pcs.find((pc) => pc.id === pcId);

	// フォーマット関数
	const formatJstDate = (date?: Date) => {
		if (!date) return "";
		return format(date, "yyyy年MM月dd日", { locale: ja });
	};

	const formatJstTime = (date?: Date) => {
		if (!date) return "";
		return format(date, "HH:mm", { locale: ja });
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
			await onUpdate(userName, notes);
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "予約の更新に失敗しました");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		setIsSubmitting(true);
		setError(null);

		try {
			await onDelete();
			setIsDeleteConfirmOpen(false);
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "予約の削除に失敗しました");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		onCancel();
		onOpenChange(false);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>予約の編集</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<div className="grid grid-cols-[auto_1fr] gap-2 text-sm">
								<div className="font-medium">PC:</div>
								<div>{selectedPc?.name}</div>

								<div className="font-medium">日付:</div>
								<div>{formatJstDate(startTime)}</div>

								<div className="font-medium">時間:</div>
								<div>
									{startTime && endTime
										? `${formatJstTime(startTime)} - ${formatJstTime(endTime)}`
										: ""}
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

						<DialogFooter className="flex justify-between sm:justify-between">
							<Button
								type="button"
								variant="destructive"
								onClick={() => setIsDeleteConfirmOpen(true)}
								disabled={isSubmitting}
							>
								削除
							</Button>

							<div className="space-x-2">
								<Button
									type="button"
									variant="outline"
									onClick={handleCancel}
									disabled={isSubmitting}
								>
									キャンセル
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "更新中..." : "更新"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* 削除確認ダイアログ */}
			<Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>予約を削除しますか？</DialogTitle>
					</DialogHeader>
					<p>この操作は取り消せません。本当に予約を削除しますか？</p>
					<DialogFooter className="sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDeleteConfirmOpen(false)}
							disabled={isSubmitting}
						>
							キャンセル
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={isSubmitting}
						>
							{isSubmitting ? "削除中..." : "削除"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
