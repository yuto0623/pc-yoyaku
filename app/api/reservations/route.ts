import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

// 予約を作成するAPI
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { computerId, startTime, endTime, userName, notes } = body;

		// 入力値のバリデーション
		if (!computerId || !startTime || !endTime || !userName) {
			return NextResponse.json(
				{ error: "PCの選択、予約時間、お名前は必須です" },
				{ status: 400 },
			);
		}

		// 日時文字列をDateオブジェクトに変換
		const start = new Date(startTime);
		const end = new Date(endTime);

		// console.log("受信した予約開始時間:", startTime);
		// console.log("変換後の予約開始時間:", start.toISOString());
		// console.log("受信した予約終了時間:", endTime);
		// console.log("変換後の予約終了時間:", end.toISOString());

		// 予約時間の重複チェック
		const existingReservation = await prisma.reservation.findFirst({
			where: {
				computerId,
				OR: [
					// 新しい予約の開始時間が既存の予約時間内にある
					{
						startTime: { lte: start },
						endTime: { gt: start },
					},
					// 新しい予約の終了時間が既存の予約時間内にある
					{
						startTime: { lt: end },
						endTime: { gte: end },
					},
					// 新しい予約が既存の予約を完全に含む
					{
						startTime: { gte: start },
						endTime: { lte: end },
					},
				],
			},
		});

		if (existingReservation) {
			return NextResponse.json(
				{ error: "指定された時間には既に予約が入っています" },
				{ status: 409 },
			);
		}

		// 予約の作成
		const reservation = await prisma.reservation.create({
			data: {
				computerId,
				startTime: start,
				endTime: end,
				userName,
				notes: notes || null,
			},
		});

		return NextResponse.json(reservation);
	} catch (error) {
		// console.error("予約作成中にエラーが発生しました:", error);
		return NextResponse.json(
			{ error: "予約の作成に失敗しました" },
			{ status: 500 },
		);
	}
}

// 特定日の予約を取得するAPI
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const dateStr = searchParams.get("date");

	if (!dateStr) {
		return NextResponse.json(
			{ error: "日付の指定が必要です" },
			{ status: 400 },
		);
	}

	try {
		// console.log("検索日付文字列:", dateStr);

		// 日付文字列をYYYY-MM-DD形式に解析
		const [year, month, day] = dateStr.split("-").map(Number);

		// 日本時間の0時（UTC時間では前日の15:00）
		const startOfDayJST = new Date(Date.UTC(year, month - 1, day, -9, 0, 0));

		// 日本時間の23:59:59（UTC時間では当日の14:59:59）
		const endOfDayJST = new Date(
			Date.UTC(year, month - 1, day, 14, 59, 59, 999),
		);

		// console.log(
		// 	"日本時間での検索開始:",
		// 	new Date(startOfDayJST.getTime() + 9 * 60 * 60 * 1000).toLocaleString(
		// 		"ja-JP",
		// 	),
		// );
		// console.log(
		// 	"日本時間での検索終了:",
		// 	new Date(endOfDayJST.getTime() + 9 * 60 * 60 * 1000).toLocaleString(
		// 		"ja-JP",
		// 	),
		// );
		// console.log("UTC時間での検索開始:", startOfDayJST.toISOString());
		// console.log("UTC時間での検索終了:", endOfDayJST.toISOString());

		// データベース検索
		const reservations = await prisma.reservation.findMany({
			where: {
				startTime: {
					gte: startOfDayJST,
					lte: endOfDayJST,
				},
			},
			include: {
				computer: true,
			},
			orderBy: {
				startTime: "asc",
			},
		});

		// console.log("取得した予約数:", reservations.length);
		return NextResponse.json(reservations);
	} catch (error) {
		// console.error("予約取得中にエラーが発生しました:", error);
		const errorMessage =
			error instanceof Error
				? `予約の取得に失敗しました: ${error.message}`
				: "予約の取得に失敗しました";

		// スタックトレースも含める
		const stack = error instanceof Error ? error.stack : undefined;
		return NextResponse.json(
			{
				error: errorMessage,
				stack,
				env: {
					nodeEnv: process.env.NODE_ENV,
					hasDbUrl: !!process.env.DATABASE_URL,
				},
			},
			{ status: 500 },
		);
	}
}
