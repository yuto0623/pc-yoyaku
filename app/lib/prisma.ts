import { PrismaClient } from "@prisma/client";

// PrismaClientの型定義
declare global {
	var prismaClient: PrismaClient | undefined;
}

// ログを有効にした新しいクライアント
export const prisma =
	global.prismaClient ||
	new PrismaClient({
		log: ["query", "info", "warn", "error"],
	});

// 開発環境ではグローバル変数を使用（ホットリロード対応）
if (process.env.NODE_ENV !== "production") {
	global.prismaClient = prisma;
}
