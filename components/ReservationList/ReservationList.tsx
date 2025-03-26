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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HiOutlineDotsVertical } from "react-icons/hi";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog/ConfirmDeleteDialog";

type ReservationListProps = {
  allReservations: Reservation[];
  pcs: Computer[];
  loading: boolean;
  onReservationClick: (reservation: Reservation) => void;
  onDeleteReservation: (id: string) => Promise<void>;
};

export default function ReservationList({
  allReservations,
  pcs,
  loading,
  onReservationClick,
  onDeleteReservation,
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

  // 削除確認関連のステート
  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 削除処理
  const handleDelete = async () => {
    if (!reservationToDelete) return;

    try {
      setIsDeleting(true);
      await onDeleteReservation(reservationToDelete.id);
      // 削除成功時の処理
    } catch (error) {
      console.error("予約削除エラー:", error);
    } finally {
      setIsDeleting(false);
      setReservationToDelete(null);
    }
  };

  // 削除確認用のテキスト生成関数
  const getDeleteConfirmationText = (reservation: Reservation) => {
    const pcName = getPcName(reservation.computerId);
    const dateTime = format(reservation.startTime, "yyyy年MM月dd日 HH:mm");
    return (
      <>
        <span className="mb-2">
          {dateTime}～{format(reservation.endTime, "HH:mm")}
          <br />
          {pcName}（{reservation.userName}）の予約を削除します。
        </span>
        <span className="block text-sm text-muted-foreground">
          この操作は取り消せません。本当に削除しますか？
        </span>
      </>
    );
  };

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
      <ScrollArea className="h-68">
        <CardContent>
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
                    <TableHead>編集</TableHead>
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
                        className={`
                        ${isPast ? "text-muted-foreground" : ""}
                        ${isActive ? "bg-green-50 dark:bg-green-950/20" : ""}`}
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
                        <TableCell>
                          {getPcName(reservation.computerId)}
                        </TableCell>
                        <TableCell>{reservation.userName}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {reservation.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="cursor-pointer transition-all px-1 hover:opacity-70">
                              <HiOutlineDotsVertical size={20} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => onReservationClick(reservation)}
                              >
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-700 dark:text-red-400"
                                onClick={() =>
                                  setReservationToDelete(reservation)
                                }
                              >
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* 削除確認ダイアログ - 共通コンポーネントを使用 */}
                  <ConfirmDeleteDialog
                    open={!!reservationToDelete}
                    onOpenChange={(open) => {
                      if (!open) setReservationToDelete(null);
                    }}
                    title="予約を削除しますか？"
                    description={
                      reservationToDelete
                        ? getDeleteConfirmationText(reservationToDelete)
                        : ""
                    }
                    isSubmitting={isDeleting}
                    onConfirm={handleDelete}
                  />
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              予約はありません
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
