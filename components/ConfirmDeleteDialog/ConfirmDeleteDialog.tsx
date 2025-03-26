import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JSX } from "react";

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string | JSX.Element;
  isSubmitting?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
};

export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "削除の確認",
  description = "この操作は取り消せません。本当に削除しますか？",
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
    if (onCancel) onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p>{description}</p>
        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "削除中..." : "削除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
