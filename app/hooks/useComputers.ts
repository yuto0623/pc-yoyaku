import { useEffect, useState } from "react";

// PC型定義（Prismaモデルと合わせる）
export type Computer = {
	id: string;
	name: string;
	createdAt?: Date;
	updatedAt?: Date;
};

export const useComputers = () => {
	const [computers, setComputers] = useState<Computer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchComputers = async () => {
			try {
				setLoading(true);
				const response = await fetch("/api/computers");

				if (!response.ok) {
					throw new Error("PCデータの取得に失敗しました");
				}

				const data = await response.json();
				setComputers(data);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "PCデータの取得中にエラーが発生しました",
				);
				console.error("PC取得エラー:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchComputers();
	}, []);

	return { computers, loading, error };
};
