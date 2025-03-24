import { format as dateFnsFormat } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import {
	DayFlag,
	DayPicker,
	type Locale,
	SelectionState,
	UI,
} from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	const formatters = {
		// 「実際の年+0始まりの月」形式でフォーマット
		formatMonthCaption: (date: Date, options?: { locale?: Locale }) => {
			// 実際の年を取得
			const year = date.getFullYear();
			// 月を0始まりで表示
			const monthIndex = date.getMonth() + 1; // 1-12の値を取得
			return `${year}年${monthIndex}月`; // 例：2025年0月、2025年1月、などの形式
		},
	};

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-3", className)}
			classNames={{
				[UI.Months]: "relative",
				[UI.Month]: "space-y-4 ml-0",
				[UI.MonthCaption]: "flex justify-center items-center h-7",
				[UI.CaptionLabel]: "text-sm font-medium",
				[UI.PreviousMonthButton]: cn(
					buttonVariants({ variant: "outline" }),
					"absolute left-1 top-0 h-7 w-7 bg-transparent dark:fill-white p-0 opacity-50 hover:opacity-100",
				),
				[UI.NextMonthButton]: cn(
					buttonVariants({ variant: "outline" }),
					"absolute right-1 top-0 h-7 w-7 bg-transparent dark:fill-white p-0 opacity-50 hover:opacity-100",
				),
				[UI.MonthGrid]: "w-full border-collapse space-y-1",
				[UI.Weekdays]: "flex",
				[UI.Weekday]:
					"text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
				[UI.Week]: "flex w-full mt-2",
				[UI.Day]:
					"h-9 w-9 text-center rounded-md text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
				[UI.DayButton]: cn(
					buttonVariants({ variant: "ghost" }),
					"h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary dark:hover:bg-white hover:text-primary-foreground",
				),
				[SelectionState.range_end]: "day-range-end",
				[SelectionState.selected]:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
				[SelectionState.range_middle]:
					"aria-selected:bg-accent aria-selected:text-accent-foreground",
				[DayFlag.today]: "bg-accent text-accent-foreground :",
				[DayFlag.outside]:
					"day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
				[DayFlag.disabled]: "text-muted-foreground opacity-50",
				[DayFlag.hidden]: "invisible",
				...classNames,
			}}
			formatters={formatters}
			components={{
				// @ts-expect-error https://github.com/shadcn-ui/ui/issues/5799
				IconLeft: ({ className, ...props }) => (
					<ChevronLeft className={cn("h-4 w-4", className)} {...props} />
				),
				// @ts-expect-error https://github.com/shadcn-ui/ui/issues/5799
				IconRight: ({ className, ...props }) => (
					<ChevronRight className={cn("h-4 w-4", className)} {...props} />
				),
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
