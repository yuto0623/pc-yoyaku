import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
	try {
		const computers = await prisma.computer.findMany({
			orderBy: {
				name: "asc",
			},
		});

		return NextResponse.json(computers);
	} catch (error) {
		console.error("PCの取得中にエラーが発生しました:", error);
		return NextResponse.json(
			{ error: "PCの取得中にエラーが発生しました" },
			{ status: 500 },
		);
	}
}
