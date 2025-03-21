"use client";

import { Button } from "@/components/ui/button"; // shadcn/uiを使用している場合
import { Moon, Sun } from "lucide-react"; // lucide-reactをインストールしてください
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	// マウント後にのみレンダリングするためのハイドレーション対策
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
		>
			{theme === "light" ? (
				<Moon className="h-5 w-5" />
			) : (
				<Sun className="h-5 w-5" />
			)}
			<span className="sr-only">テーマ切り替え</span>
		</Button>
	);
}
