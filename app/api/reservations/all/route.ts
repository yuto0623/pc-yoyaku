import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
	try {
		// 検索パラメータを取得（オプション）
		const searchParams = request.nextUrl.searchParams;
		const limitParam = searchParams.get("limit");
		const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

		// 過去の予約も含めてすべての予約を取得
		const reservations = await prisma.reservation.findMany({
			include: {
				computer: true,
			},
			orderBy: {
				startTime: "desc",
			},
			...(limit ? { take: limit } : {}),
		});

		// 日付ごとにグループ化
		const reservationsByDate = reservations.reduce(
			(acc, reservation) => {
				const dateKey = new Date(reservation.startTime)
					.toISOString()
					.split("T")[0];

				if (!acc[dateKey]) {
					acc[dateKey] = [];
				}

				acc[dateKey].push(reservation);
				return acc;
			},
			{} as Record<string, (typeof reservations)[number][]>,
		);

		return NextResponse.json({
			reservations: reservations,
			byDate: reservationsByDate,
			totalCount: reservations.length,
		});
	} catch (error) {
		console.error("全予約データ取得エラー:", error);
		return NextResponse.json(
			{ error: "予約データの取得に失敗しました" },
			{ status: 500 },
		);
	}
}
