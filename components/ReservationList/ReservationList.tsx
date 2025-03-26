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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Computer, Reservation } from "@prisma/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useMemo, useState } from "react";

type ReservationListProps = {
  allReservations: Reservation[];
  pcs: Computer[];
  loading: boolean;
  onReservationClick: (reservation: Reservation) => void;
};

export default function ReservationList({
  allReservations,
  pcs,
  loading,
  onReservationClick,
}: ReservationListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "time">("date");

  // 検索機能
  const filteredReservations = useMemo(() => {
    if (!searchTerm.trim()) return allReservations;

    const lowerSearch = searchTerm.toLowerCase();
    return allReservations.filter((reservation) => {
      // PCの名前を取得
      const pc = pcs.find((p) => p.id === reservation.computerId);

      // 日付も検索対象に追加
      const dateStr = format(reservation.startTime, "yyyy年MM月dd日");

      return (
        reservation.userName.toLowerCase().includes(lowerSearch) ||
        pc?.name.toLowerCase().includes(lowerSearch) ||
        reservation.notes?.toLowerCase().includes(lowerSearch) ||
        dateStr.includes(lowerSearch)
      );
    });
  }, [allReservations, pcs, searchTerm]);

  // ソート
  const sortedReservations = useMemo(() => {
    return [...filteredReservations].sort((a, b) => {
      if (sortBy === "date") {
        // 日付優先でソート (同じ日付なら時間順)
        const dateCompare = a.startTime.getTime() - b.startTime.getTime();
        if (dateCompare !== 0) return dateCompare;

        // 同じ日付の場合はPC名でソート
        const pcA = pcs.find((p) => p.id === a.computerId)?.name || "";
        const pcB = pcs.find((p) => p.id === b.computerId)?.name || "";
        return pcA.localeCompare(pcB);
      } else {
        // 時間のみでソート (時刻部分だけを比較)
        const aHours = a.startTime.getHours();
        const aMinutes = a.startTime.getMinutes();
        const bHours = b.startTime.getHours();
        const bMinutes = b.startTime.getMinutes();

        if (aHours !== bHours) {
          return aHours - bHours;
        }
        return aMinutes - bMinutes;
      }
    });
  }, [filteredReservations, sortBy, pcs]);

  // PC名を取得する関数
  const getPcName = (pcId: string) => {
    return pcs.find((pc) => pc.id === pcId)?.name || "不明なPC";
  };

  // 現在時刻
  const now = new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between">
          <div className="sm:w-[30%]">
            <CardTitle className="text-lg">予約リスト</CardTitle>
            <CardDescription>すべての日付の予約一覧</CardDescription>
          </div>
          <div className="sm:w-[70%] mt-2 flex flex-col justify-between sm:flex-row gap-2 sm:items-center">
            <Input
              placeholder="名前・PC・日付で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">並び順:</span>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as "date" | "time")}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="並び順" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">日付順</SelectItem>
                  {/* <SelectItem value="time">時間順</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-65 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="ml-2">予約データを読み込み中...</span>
          </div>
        ) : sortedReservations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0">
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>PC</TableHead>
                  <TableHead>予約者</TableHead>
                  <TableHead>メモ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReservations.map((reservation) => {
                  // 予約の状態を判定
                  const isPast = reservation.endTime < now;
                  const isActive =
                    reservation.startTime <= now && now < reservation.endTime;

                  return (
                    <TableRow
                      key={reservation.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors
                        ${isPast ? "text-muted-foreground" : ""}
                        ${isActive ? "bg-green-50 dark:bg-green-950/20" : ""}`}
                      onClick={() => onReservationClick(reservation)}
                    >
                      <TableCell>
                        {format(reservation.startTime, "yyyy/MM/dd(eee)", {
                          locale: ja,
                        })}
                      </TableCell>
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
