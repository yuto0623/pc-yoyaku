import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Computer, Reservation } from "@prisma/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useMemo, useState } from "react";

type ReservationListProps = {
	reservations: Reservation[];
	pcs: Computer[];
	date: Date;
	loading: boolean;
	onReservationClick: (reservation: Reservation) => void;
};

export default function ReservationList({
	reservations,
	pcs,
	date,
	loading,
	onReservationClick,
}: ReservationListProps) {
	const [searchTerm, setSearchTerm] = useState("");

	// 検索機能
	const filteredReservations = useMemo(() => {
		if (!searchTerm.trim()) return reservations;

		const lowerSearch = searchTerm.toLowerCase();
		return reservations.filter((reservation) => {
			// PCの名前を取得
			const pc = pcs.find((p) => p.id === reservation.computerId);

			return (
				reservation.userName.toLowerCase().includes(lowerSearch) ||
				pc?.name.toLowerCase().includes(lowerSearch) ||
				reservation.notes?.toLowerCase().includes(lowerSearch)
			);
		});
	}, [reservations, pcs, searchTerm]);

	// 時間でソート
	const sortedReservations = useMemo(() => {
		return [...filteredReservations].sort(
			(a, b) => a.startTime.getTime() - b.startTime.getTime(),
		);
	}, [filteredReservations]);

	// PC名を取得する関数
	const getPcName = (pcId: string) => {
		return pcs.find((pc) => pc.id === pcId)?.name || "不明なPC";
	};

	// 現在時刻
	const now = new Date();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">予約リスト</CardTitle>
				<CardDescription>
					{format(date, "yyyy年MM月dd日 (eee)", { locale: ja })}の予約一覧
				</CardDescription>
				<div className="mt-2">
					<Input
						placeholder="名前やPCで検索..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-sm"
					/>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex items-center justify-center p-4">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
						<span className="ml-2">予約データを読み込み中...</span>
					</div>
				) : sortedReservations.length > 0 ? (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>時間</TableHead>
									<TableHead>PC</TableHead>
									<TableHead>予約者</TableHead>
									<TableHead>メモ</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sortedReservations.map((reservation) => {
									return (
										<TableRow
											key={reservation.id}
											className="cursor-pointer hover:bg-muted/50 transition-colors"
											onClick={() => onReservationClick(reservation)}
										>
											<TableCell>
												{format(reservation.startTime, "HH:mm")} ～{" "}
												{format(reservation.endTime, "HH:mm")}
											</TableCell>
											<TableCell>{getPcName(reservation.computerId)}</TableCell>
											<TableCell>{reservation.userName}</TableCell>
											<TableCell className="max-w-[200px] truncate">
												{reservation.notes || "-"}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				) : (
					<div className="text-center py-4 text-gray-500">予約はありません</div>
				)}
			</CardContent>
		</Card>
	);
}
