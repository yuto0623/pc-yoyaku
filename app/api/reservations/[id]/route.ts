import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// 予約更新API
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const id = params.id;
		const body = await request.json();
		const { userName, notes } = body;

		// 入力値のバリデーション
		if (!userName || !userName.trim()) {
			return NextResponse.json({ error: "お名前は必須です" }, { status: 400 });
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

		// 予約を更新
		const updatedReservation = await prisma.reservation.update({
			where: { id },
			data: {
				userName,
				notes,
			},
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
	{ params }: { params: { id: string } },
) {
	try {
		const id = params.id;

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
