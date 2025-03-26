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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addMinutes, format, parse, setHours, setMinutes } from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog/ConfirmDeleteDialog";

type PC = {
  id: string;
  name: string;
};

type ReservationEditFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pcs: PC[];
  editingReservation: {
    id: string;
    pcId: string;
    startTime: Date;
    endTime: Date;
    userName: string;
    notes?: string;
  };
  onUpdate: (
    userName: string,
    startTime: Date,
    endTime: Date,
    notes?: string
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCancel: () => void;
};

// 時間オプション（10分間隔）を生成
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      options.push(timeString);
    }
  }
  return options;
};

export default function ReservationEditForm({
  open,
  onOpenChange,
  pcs,
  editingReservation,
  onUpdate,
  onDelete,
  onCancel,
}: ReservationEditFormProps) {
  const {
    id,
    pcId,
    startTime: initialStartTime,
    endTime: initialEndTime,
    userName: initialUserName = "",
    notes: initialNotes = "",
  } = editingReservation;
  const [userName, setUserName] = useState(initialUserName);
  const [notes, setNotes] = useState(initialNotes);
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // 時間オプション
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  // 初期値を設定するためのuseEffect
  useEffect(() => {
    // 開始時間が存在する場合にのみ設定
    if (
      initialStartTime instanceof Date &&
      !Number.isNaN(initialStartTime.getTime())
    ) {
      const formattedStartTime = format(initialStartTime, "HH:mm");
      setSelectedStartTime(formattedStartTime);
    }

    // 終了時間が存在する場合にのみ設定
    if (
      initialEndTime instanceof Date &&
      !Number.isNaN(initialEndTime.getTime())
    ) {
      const formattedEndTime = format(initialEndTime, "HH:mm");
      setSelectedEndTime(formattedEndTime);
    }

    // openの状態も依存配列に追加
  }, [initialStartTime, initialEndTime]);

  // 選択されたPCの情報
  const selectedPc = pcs.find((pc) => pc.id === pcId);

  // 日付フォーマット関数
  const formatJstDate = (date?: Date) => {
    if (!date) return "";
    return format(date, "yyyy年MM月dd日", { locale: ja });
  };

  // 時間変更のハンドリング
  const handleStartTimeChange = (value: string) => {
    setSelectedStartTime(value);

    // 終了時間が開始時間より前の場合、開始時間+10分を終了時間にする
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

  // フォーム送信処理
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
      // 日付部分を維持して時間だけ変更
      const baseDate = initialStartTime || new Date();
      const newStartTime = new Date(baseDate);
      const [startHours, startMinutes] = selectedStartTime
        .split(":")
        .map(Number);
      newStartTime.setHours(startHours, startMinutes, 0, 0);

      const newEndTime = new Date(baseDate);
      const [endHours, endMinutes] = selectedEndTime.split(":").map(Number);
      newEndTime.setHours(endHours, endMinutes, 0, 0);

      await onUpdate(userName, newStartTime, newEndTime, notes);
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
      await onDelete(editingReservation.id);
      setIsDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "予約の削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setUserName(initialUserName || "");
    setNotes(initialNotes || "");
    setError(null);
    onCancel();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          // ダイアログが開かれる時だけ初期値を再設定
          if (newOpen && initialStartTime && initialEndTime) {
            setSelectedStartTime(format(initialStartTime, "HH:mm"));
            setSelectedEndTime(format(initialEndTime, "HH:mm"));
            setUserName(initialUserName || "");
            setNotes(initialNotes || "");
          }
          onOpenChange(newOpen);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>予約の編集</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-[auto_1fr] gap-2 text-sm mb-2">
                <div className="font-medium">PC:</div>
                <div>{selectedPc?.name}</div>

                <div className="font-medium">日付:</div>
                <div>{formatJstDate(initialStartTime)}</div>
              </div>

              {/* 時間選択部分 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">開始時間</Label>
                  <Select
                    value={selectedStartTime}
                    defaultValue={format(
                      initialStartTime || new Date(),
                      "HH:mm"
                    )}
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
                    defaultValue={format(initialEndTime || new Date(), "HH:mm")}
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
      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="予約を削除しますか？"
        description="この操作は取り消せません。本当に予約を削除しますか？"
        isSubmitting={isSubmitting}
        onConfirm={handleDelete}
      />
    </>
  );
}
