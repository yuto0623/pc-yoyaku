import { useEffect, useRef, useState } from "react";

/**
 * タッチ操作（長押し、ドラッグ）を管理するカスタムフック
 */
export function useTouchDrag() {
	// 長押し検出のための状態
	const [isLongPressing, setIsLongPressing] = useState(false);
	const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
	const longPressDuration = 500; // 長押し検出の時間（ミリ秒）

	// グリッド要素のref
	const gridRef = useRef<HTMLDivElement>(null);

	// 長押しを開始する処理
	const startLongPress = (callback: () => void) => {
		// すでに設定されているタイマーをクリア
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
		}

		// 長押し検出のためのタイマーを設定
		longPressTimerRef.current = setTimeout(() => {
			setIsLongPressing(true);

			// 長押し検出時にbodyのスクロールを無効化（クライアント側のみ）
			if (typeof document !== "undefined") {
				document.body.style.overflow = "hidden";
				document.body.style.touchAction = "none";
			}

			// コールバックを実行
			callback();
		}, longPressDuration);
	};

	// タッチキャンセル時の処理
	const cancelLongPress = () => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
		setIsLongPressing(false);

		// スタイルのリセット（クライアント側のみ）
		if (typeof document !== "undefined") {
			document.body.style.overflow = "";
			document.body.style.touchAction = "";
		}
	};

	// タッチ終了時の処理
	const endLongPress = (callback: () => void) => {
		// 長押しタイマーをクリア
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}

		// 長押し状態をリセット
		setIsLongPressing(false);

		// スクロールを再度有効化（クライアント側のみ）
		if (typeof document !== "undefined") {
			document.body.style.overflow = "";
			document.body.style.touchAction = "";
		}

		// コールバックを実行
		callback();
	};

	// 全体のtouchMoveイベントを監視して、ドラッグ中のスクロールを防止する関数
	const preventScrollDuringDrag = (e: TouchEvent) => {
		if (isLongPressing) {
			e.preventDefault();
		}
	};

	// ドラッグ操作のイベントリスナー設定
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (typeof document === "undefined") return;

		// パッシブでないイベントリスナーを追加（スクロールを防止するため）
		document.addEventListener("touchmove", preventScrollDuringDrag, {
			passive: false,
		});

		return () => {
			document.removeEventListener("touchmove", preventScrollDuringDrag);

			// コンポーネントのアンマウント時にタイマーをクリア
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
			}

			// スタイルをリセット
			document.body.style.overflow = "";
			document.body.style.touchAction = "";
		};
	}, [isLongPressing]);

	return {
		isLongPressing,
		gridRef,
		startLongPress,
		cancelLongPress,
		endLongPress,
		preventScrollDuringDrag,
	};
}
