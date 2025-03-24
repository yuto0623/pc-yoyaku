import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
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
};

export default function ReservationForm({
	selection,
	pcs,
	onConfirm,
	onCancel,
}: ReservationFormProps) {
	const [userName, setUserName] = useState("");
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 選択されたPCの情報を取得
	const selectedPc = pcs.find((pc) => pc.id === selection.pcId);

	// 予約内容が不完全な場合は何も表示しない
	if (!selection.startTime || !selection.endTime || !selection.pcId) {
		return null;
	}

	// フォーム送信処理
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!userName.trim()) {
			setError("お名前を入力してください");
			return;
		}

		setError(null);
		setSubmitting(true);

		try {
			await onConfirm(userName, notes);
			// 成功したら入力をクリア
			setUserName("");
			setNotes("");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "予約処理中にエラーが発生しました",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Card className="mt-4">
			<form onSubmit={handleSubmit}>
				<CardHeader>
					<CardTitle>予約内容</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<p>
							<strong>PC:</strong> {selectedPc?.name}
						</p>
						<p>
							<strong>日時:</strong>{" "}
							{format(selection.startTime, "yyyy/MM/dd HH:mm")} -
							{format(selection.endTime, "HH:mm")}
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="userName">お名前 *</Label>
						<Input
							id="userName"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							required
							placeholder="予約者名"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">備考</Label>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="特記事項があればご記入ください"
							rows={2}
						/>
					</div>

					{error && (
						<div className="text-sm font-medium text-destructive">{error}</div>
					)}
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button type="button" variant="outline" onClick={onCancel}>
						キャンセル
					</Button>
					<Button type="submit" disabled={submitting}>
						{submitting ? "処理中..." : "この時間で予約する"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
