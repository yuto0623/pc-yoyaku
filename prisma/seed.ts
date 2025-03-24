const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
	// 既存のデータをクリア
	await prisma.computer.deleteMany({});

	// サンプルPCデータを挿入
	await prisma.computer.createMany({
		data: [{ name: "1号機（白）富士通" }, { name: "2号機（黒）ダイナブック" }],
	});

	console.log("シードデータを挿入しました");
}

main()
	.catch((e) => {
		console.error("シード処理中にエラーが発生しました:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
