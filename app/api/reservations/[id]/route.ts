import type { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// 予約更新API
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { userName, notes, startTime, endTime } = body;

		// 入力値のバリデーション
		if (!userName || !userName.trim()) {
			return NextResponse.json({ error: "お名前は必須です" }, { status: 400 });
		}

		// 時間のバリデーション（開始時間と終了時間が提供されている場合）
		if (startTime && endTime) {
			const start = new Date(startTime);
			const end = new Date(endTime);

			if (end <= start) {
				return NextResponse.json(
					{ error: "終了時間は開始時間より後にしてください" },
					{ status: 400 },
				);
			}

			// 予約時間の重複チェック（自身の予約は除く）
			const existingReservation = await prisma.reservation.findFirst({
				where: {
					id: { not: id }, // 自分自身を除外
					computerId: (await prisma.reservation.findUnique({ where: { id } }))
						?.computerId,
					OR: [
						{ startTime: { lte: start }, endTime: { gt: start } },
						{ startTime: { lt: end }, endTime: { gte: end } },
						{ startTime: { gte: start }, endTime: { lte: end } },
					],
				},
			});

			if (existingReservation) {
				return NextResponse.json(
					{ error: "選択した時間はすでに予約されています" },
					{ status: 409 },
				);
			}
		}

		// 予約存在確認
		const existingReservation = await prisma.reservation.findUnique({
			where: { id },
		});

		if (!existingReservation) {
			return NextResponse.json(
				{ error: "指定された予約が見つかりません" },
				{ status: 404 },
			);
		}
		// 更新データの準備
		const updateData: Prisma.ReservationUpdateInput = {
			userName,
			notes,
		};

		// 時間のデータがあれば追加
		if (startTime) updateData.startTime = new Date(startTime);
		if (endTime) updateData.endTime = new Date(endTime);

		// 予約を更新
		const updatedReservation = await prisma.reservation.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json(updatedReservation);
	} catch (error) {
		console.error("予約更新エラー:", error);
		return NextResponse.json(
			{ error: "予約の更新中にエラーが発生しました" },
			{ status: 500 },
		);
	}
}

// 予約削除API
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// 予約存在確認
		const existingReservation = await prisma.reservation.findUnique({
			where: { id },
		});

		if (!existingReservation) {
			return NextResponse.json(
				{ error: "指定された予約が見つかりません" },
				{ status: 404 },
			);
		}

		// 予約を削除
		await prisma.reservation.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("予約削除エラー:", error);
		return NextResponse.json(
			{ error: "予約の削除中にエラーが発生しました" },
			{ status: 500 },
		);
	}
}
