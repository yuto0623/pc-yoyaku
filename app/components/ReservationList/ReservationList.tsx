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

	// 予約の状態を判断する関数
	const getReservationStatus = (reservation: Reservation) => {
		const isToday = new Date(date).toDateString() === new Date().toDateString();

		if (!isToday) {
			return { status: "scheduled", label: "予定" };
		}

		if (reservation.endTime < now) {
			return { status: "completed", label: "終了" };
		}

		if (reservation.startTime <= now && reservation.endTime > now) {
			return { status: "active", label: "利用中" };
		}

		return { status: "upcoming", label: "予定" };
	};

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
									<TableHead>状態</TableHead>
									<TableHead>メモ</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sortedReservations.map((reservation) => {
									const { status, label } = getReservationStatus(reservation);
									return (
										<TableRow
											key={reservation.id}
											className="cursor-pointer hover:bg-muted/50 transition-colors"
											onClick={() => onReservationClick(reservation)}
										>
											<TableCell>
												{format(reservation.startTime, "HH:mm")} -{" "}
												{format(reservation.endTime, "HH:mm")}
											</TableCell>
											<TableCell>{getPcName(reservation.computerId)}</TableCell>
											<TableCell>{reservation.userName}</TableCell>
											<TableCell>
												<Badge
													variant={
														status === "active"
															? "default"
															: status === "completed"
																? "outline"
																: "secondary"
													}
												>
													{label}
												</Badge>
											</TableCell>
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
