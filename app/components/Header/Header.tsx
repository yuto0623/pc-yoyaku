import { ThemeToggle } from "../ThemeToggle/ThemeToggle";

export default function Header() {
	return (
		<header className="flex justify-between items-center py-4 px-4 sm:px-[10%]">
			<h1>PC予約</h1>
			<ThemeToggle />
		</header>
	);
}
